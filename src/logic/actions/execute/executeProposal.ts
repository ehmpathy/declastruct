import { UnexpectedCodePathError } from '@ehmpathy/error-fns';

import {
  DeclastructChangeProposal,
  DeclastructChangeProposalAction,
} from '../../../domain/DeclastructChangeProposal';
import { DeclastructContext } from '../../../domain/DeclastructContext';
import { getProviderResourceRemoteStateInterfaceExecutionDependenciesForResource } from '../../tools/provider/getProviderResourceRemoteStateInterfaceExecutionDependenciesForResource';

export const executeProposal = async (
  { proposal }: { proposal: DeclastructChangeProposal<any> },
  context: DeclastructContext,
) => {
  // grab the interface and context for the resource
  const { remoteStateInterface, providerContext } =
    getProviderResourceRemoteStateInterfaceExecutionDependenciesForResource(
      { resource: proposal.toDesiredState ?? proposal.fromRemoteState },
      context,
    );

  // if the proposed action was to do nothing, just return its current state
  if (proposal.action === DeclastructChangeProposalAction.DO_NOTHING) {
    // look up the resource
    const found = await remoteStateInterface.findByUnique(
      proposal.toDesiredState,
      providerContext,
    );

    // sanity check that the resource does really exist
    if (!found)
      throw new UnexpectedCodePathError(
        'proposal was to do nothing but resource does not exist. how is that possible?',
        { proposal, found },
      );

    // return the state of the resource
    return found;
  }

  // if the proposed action was to create it, create it
  if (proposal.action === DeclastructChangeProposalAction.CREATE) {
    // sanity check that the entity does not already exist
    const found = await remoteStateInterface.findByUnique(
      proposal.toDesiredState,
      providerContext,
    );
    if (found) {
      // done if already found it, we must have created it as part of another operation (or the plan was wrong)
      // console.log('    * found this resource by unique instead of creating it');
      return found;
    }

    // create it
    await remoteStateInterface.create(proposal.toDesiredState, providerContext);

    // prove we can find it now
    const foundNow = await remoteStateInterface.findByUnique(
      proposal.toDesiredState,
      providerContext,
    );
    if (!foundNow)
      throw new UnexpectedCodePathError(
        'could not find resource after creating it',
        {
          forClassName: proposal.forResourceClassName,
          forGrokableIdentifier: proposal.forGrokableIdentifier,
        },
      );
    return foundNow;
  }

  // if the proposed action was to update it, update it
  if (proposal.action === DeclastructChangeProposalAction.UPDATE) {
    if (!remoteStateInterface.update)
      throw new UnexpectedCodePathError(
        `should not have attempted to update a resource who's remote state interface does not support updates`,
        { resourceClassName: proposal.forResourceClassName },
      );
    return await remoteStateInterface.update(
      proposal.toDesiredState,
      providerContext,
    );
  }

  // otherwise, throw an error, since we couldn't handle it
  throw new UnexpectedCodePathError('unsupported proposal action', {
    proposal,
  });
};
