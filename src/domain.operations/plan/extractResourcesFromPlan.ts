import { DomainEntity } from 'domain-objects';

import { DeclastructPlan } from '../../domain.objects/DeclastructPlan';

/**
 * .what = extracts resources from a plan's changes
 * .why = needed for replanning during applyChanges
 * .note = returns desired state for each change, filtering out DESTROY-only changes
 */
export const extractResourcesFromPlan = (
  plan: DeclastructPlan,
): DomainEntity<any>[] => {
  // extract desired resources from changes
  const resources = plan.changes
    .map((change) => change.state.desired)
    .filter((resource) => resource !== null) as DomainEntity<any>[];

  return resources;
};
