import { VisualogicContext } from 'visualogic';

import { DeclaredResource } from '../../../domain/DeclaredResource';
import { DeclastructChangeProposal } from '../../../domain/DeclastructChangeProposal';
import { DeclastructProvider } from '../../../domain/DeclastructProvider';
import { proposeChangeForResource } from '../../../logic/actions/propose/proposeChangeForResource';
import { createDeclastructContext } from '../../../logic/tools/context/createDeclastructContext';

/**
 * tactic: get plan to synchronize one resource
 * objective:
 * - get a plan for synchronizing the remote state of the resource to the declared state
 * impact:
 * - enable comparing the difference between the remote state and declared state
 * - enable applying the plan to synchronize the remote state to the declared state
 *
 * strategy
 * - define a context for this one resource
 * - get the plan for this one resource
 */
export const getPlansToSynchronize = async <R extends DeclaredResource>(
  { resources }: { resources: R[] },
  {
    providers,
    log,
  }: { providers: DeclastructProvider<any>[] } & VisualogicContext,
): Promise<DeclastructChangeProposal<R>[]> => {
  // define the context for this one resource
  const context = await createDeclastructContext({
    providers,
    resources,
    log,
  });

  // get the plan for this one resource
  return await Promise.all(
    resources.map((resource) =>
      proposeChangeForResource({ resource }, context),
    ),
  );
};

// export a convenient alias
export { getPlansToSynchronize as getPlans };
