import { BadRequestError } from 'helpful-errors';

import type { DeclastructPlan } from '../../domain.objects/DeclastructPlan';

/**
 * .what = validates that a plan hasn't become stale
 * .why = prevents applying outdated changes to infrastructure
 * .note = compares plan hashes to detect drift
 */
export const assertPlanStillValid = ({
  originalPlan,
  currentPlan,
}: {
  originalPlan: DeclastructPlan;
  currentPlan: DeclastructPlan;
}): void => {
  // reject if plan hashes differ
  if (originalPlan.hash !== currentPlan.hash) {
    throw new BadRequestError('plan is stale', {
      originalHash: originalPlan.hash,
      currentHash: currentPlan.hash,
      message:
        'The infrastructure state has changed since this plan was created. Please review and create a new plan.',
    });
  }
};
