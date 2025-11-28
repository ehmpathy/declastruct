import { DomainEntity, getUniqueIdentifierSlug } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';
import { ContextLogTrail } from 'simple-log-methods';

import { ContextDeclastruct } from '../../domain.objects/ContextDeclastruct';
import {
  DeclastructChange,
  DeclastructChangeAction,
} from '../../domain.objects/DeclastructChange';
import { DeclastructPlan } from '../../domain.objects/DeclastructPlan';
import { DeclastructProvider } from '../../domain.objects/DeclastructProvider';
import { planChanges } from '../plan/planChanges';
import { assertPlanStillValid } from '../plan/validate';
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
    context.log.info('🤙 yolo, plan not reviewed...');
  }

  // use current plan for apply (works for both modes)
  const planToApply = currentPlan;

  // log apply phase header
  context.log.info('');
  context.log.info('🪄  apply changes...');
  context.log.info('');

  // apply each change with real-time logging
  const appliedChanges: DeclastructChange[] = [];

  for (const change of planToApply.changes) {
    // log KEEP actions and skip
    if (change.action === DeclastructChangeAction.KEEP) {
      context.log.info(`↓ [KEEP] ${change.forResource.slug}`, {});
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

    // apply the change
    const applied = await applyChange({
      change,
      resource: resourceFound,
      providers: input.providers,
    });

    // log success immediately
    context.log.info(`✔ [${applied.action}] ${applied.forResource.slug}`, {});

    appliedChanges.push(applied);
  }

  return { appliedChanges };
};
