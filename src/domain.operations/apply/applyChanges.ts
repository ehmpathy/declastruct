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
 * .what = applies a validated plan to achieve desired state
 * .why = executes infrastructure changes in a controlled, observable manner
 * .note = idempotent - reapplying same plan is safe (guards check if already applied)
 */
export const applyChanges = async (
  input: {
    plan: DeclastructPlan;
    resources: DomainEntity<any>[];
    providers: DeclastructProvider<any, any>[];
  },
  context: ContextLogTrail & ContextDeclastruct,
): Promise<{ appliedChanges: DeclastructChange[] }> => {
  // replan to ensure plan is still valid
  const currentPlan = await planChanges(
    {
      resources: input.resources,
      providers: input.providers,
      wishFilePath: input.plan.wish.uri,
    },
    context,
  );

  // validate plan matches current state
  assertPlanStillValid({
    originalPlan: input.plan,
    currentPlan,
  });

  // apply each change with real-time logging
  const appliedChanges: DeclastructChange[] = [];

  for (const change of input.plan.changes) {
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
        'could not find resource specified in plan. was it removed and plan is no longer valid?',
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
