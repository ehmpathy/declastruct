import { VisualogicContext } from 'visualogic';

import { DeclaredResource } from '../../../domain/DeclaredResource';
import { DeclastructChangeProposal } from '../../../domain/DeclastructChangeProposal';
import { DeclastructProvider } from '../../../domain/DeclastructProvider';
import { executeProposal } from '../../../logic/actions/execute/executeProposal';
import { createDeclastructContext } from '../../../logic/tools/context/createDeclastructContext';

/**
 * tactic: apply plans to synchronize resources
 * objective:
 * - synchronize the remote state of the resource to the declared state
 * impact:
 * - ensures the remote state matches the declared state
 *
 * strategy
 * - define a context for these resources
 * - apply the plan for these resources
 */
export const applyPlansToSynchronize = async <R extends DeclaredResource>(
  {
    resources,
    plans,
  }: { resources: R[]; plans: DeclastructChangeProposal<R>[] },
  {
    providers,
    log,
  }: { providers: DeclastructProvider<any>[] } & VisualogicContext,
): Promise<Required<R>[]> => {
  // define the context for these resources
  const context = await createDeclastructContext({
    providers,
    resources,
    log,
  });

  // get the plan for this one resource
  return await Promise.all(
    plans.map(
      (plan) =>
        executeProposal({ proposal: plan }, context) as Promise<Required<R>>,
    ),
  );
};

// export a convenient alias
export { applyPlansToSynchronize as applyPlans };
