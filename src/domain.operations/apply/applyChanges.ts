import { type DomainEntity, getUniqueIdentifierSlug } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';
import type { ContextLogTrail } from 'simple-log-methods';

import type { ContextDeclastruct } from '@src/domain.objects/ContextDeclastruct';
import {
  type DeclastructChange,
  DeclastructChangeAction,
} from '@src/domain.objects/DeclastructChange';
import type { DeclastructPlan } from '@src/domain.objects/DeclastructPlan';
import type { DeclastructProvider } from '@src/domain.objects/DeclastructProvider';
import { planChanges } from '@src/domain.operations/plan/planChanges';
import { assertPlanStillValid } from '@src/domain.operations/plan/validate';
import { colorizeAction } from '@src/infra/colorizeAction';
import { withSpinner } from '@src/infra/withSpinner';

import { applyChange } from './applyChange';

/**
 * .what = applies changes to achieve desired state
 * .why = executes infrastructure changes in a controlled, observable manner
 * .note = idempotent - reapplying same plan is safe (guards check if already applied)
 *   - when plan is provided, validates staleness before applying
 *   - when plan is null (yolo mode), skips validation and applies immediately
 */
export const applyChanges = async (
  input: {
    plan: DeclastructPlan | null;
    resources: DomainEntity<any>[];
    providers: DeclastructProvider<any, any>[];
  },
  context: ContextLogTrail & ContextDeclastruct,
): Promise<{ appliedChanges: DeclastructChange[] }> => {
  // replan to get current state
  const currentPlan = await planChanges(
    {
      resources: input.resources,
      providers: input.providers,
      wishFilePath: input.plan?.wish.uri ?? 'ignorable',
    },
    context,
  );

  // use current plan for apply (works for both modes)
  const planToApply = currentPlan;

  // check if there are any actionable changes (non-KEEP)
  const hasActionableChanges = planToApply.changes.some(
    (change) => change.action !== DeclastructChangeAction.KEEP,
  );

  // skip apply phase if everything is in sync
  if (!hasActionableChanges) return { appliedChanges: [] };

  // validate plan matches current state (skip if no plan provided, i.e. yolo mode)
  if (input.plan) {
    assertPlanStillValid({
      originalPlan: input.plan,
      currentPlan,
    });
    context.log.info('');
    context.log.info('👌 plan still valid...');
  } else {
    context.log.info('');
    context.log.info('🤙 yolo, plan auto approved...');
  }

  // log apply phase header
  context.log.info('');
  context.log.info('🪄  apply changes...');
  context.log.info('');

  // apply each change with real-time logging
  const appliedChanges: DeclastructChange[] = [];

  for (const change of planToApply.changes) {
    // log KEEP actions and skip
    if (change.action === DeclastructChangeAction.KEEP) {
      context.log.info(
        `↓ ${colorizeAction(change.action)} ${change.forResource.slug}`,
      );
      continue;
    }

    // find the desired resource
    const resourceFound =
      input.resources.find(
        (candidate) =>
          candidate.constructor.name === change.forResource.class &&
          getUniqueIdentifierSlug(candidate) === change.forResource.slug,
      ) ??
      UnexpectedCodePathError.throw(
        'could not find resource specified in plan. was it removed?',
        { change },
      );

    // log the action line (stays fixed)
    const actionLabel = colorizeAction(change.action);
    context.log.info(`○ ${actionLabel} ${change.forResource.slug}`);

    // apply the change with spinner on line below
    const { result: applied, durationMs } = await withSpinner({
      message: 'inflight',
      operation: () =>
        applyChange({
          change,
          resource: resourceFound,
          providers: input.providers,
        }),
    });

    // log completion with duration
    const durationSec = (durationMs / 1000).toFixed(2);
    context.log.info(`   └─ ✔ done in ${durationSec}s`);
    context.log.info('');

    appliedChanges.push(applied);
  }

  return { appliedChanges };
};
