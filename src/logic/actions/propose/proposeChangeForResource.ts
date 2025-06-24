import { VisualogicContext } from 'visualogic';

import { DeclaredResource } from '../../../domain/DeclaredResource';
import {
  DeclastructChangeProposal,
  DeclastructChangeProposalAction,
} from '../../../domain/DeclastructChangeProposal';
import { DeclastructContext } from '../../../domain/DeclastructContext';
import { castReferenceToGrokableString } from '../../tools/compare/castReferenceToGrokableString';
import { detectDifferenceBetweenDesiredAndRemoteStateOfResource } from '../../tools/compare/detectDifferenceBetweenDesiredAndRemoteStateOfResource';
import { getByReference } from '../../tools/reference/getByReference';
import { getRef } from '../../tools/reference/getReferenceTo';
import { canUpdateResource } from '../execute/canUpdateResource';

export const proposeChangeForResource = async <R extends DeclaredResource>(
  {
    resource: desiredState, // TODO: support deleting remote state resources, based on remoteState resource as input (i.e., specify which type the resource declaration represents, right now always desiredState)
  }: { resource: R },
  context: DeclastructContext & VisualogicContext,
) => {
  // get its current remote state
  // const stopwatchOne = startDurationStopwatch(
  //   {
  //     for: `proposeChangeForResource.getByReference.ofClass::${desiredState.constructor.name}`,
  //     log: { level: LogLevel.INFO, threshold: { milliseconds: 1 } },
  //   },
  //   context,
  // );
  const remoteState = await getByReference(
    { reference: getRef(desiredState) },
    context,
  );
  // stopwatchOne.stop();

  // detect the difference
  const diff = await detectDifferenceBetweenDesiredAndRemoteStateOfResource(
    {
      desiredState,
      remoteState,
    },
    context,
  );

  // determine what we should do
  const action = await (async () => {
    // if remote and desired state are already the same, do nothing
    if (desiredState === remoteState)
      return DeclastructChangeProposalAction.DO_NOTHING;

    // if remote state is null, create it
    if (remoteState === null) return DeclastructChangeProposalAction.CREATE;

    // if desired state is null, destroy it
    if (desiredState === null) return DeclastructChangeProposalAction.DESTROY;

    // if there are no changes detected, do nothing
    if (
      Object.values(diff.usable)
        .map((changeType) => Object.values(changeType).length) // TODO: make the "usable" diff more usable, this is pretty ugly and convoluted
        .every((numberOfChangesForType) => numberOfChangesForType === 0)
    )
      return DeclastructChangeProposalAction.DO_NOTHING;

    // if the resource supports update, update it
    if (await canUpdateResource({ resource: desiredState }, context))
      return DeclastructChangeProposalAction.UPDATE;

    // otherwise, replace it
    return DeclastructChangeProposalAction.REPLACE;
  })();

  // get the grokable identifier
  const grokableIdentifier = await castReferenceToGrokableString(
    { reference: getRef(desiredState) }, // TODO: support desiredState  = null, remote state != null
    context,
  );

  // return the proposed change
  return new DeclastructChangeProposal<R>({
    forResourceClassName: desiredState.constructor.name,
    forGrokableIdentifier: grokableIdentifier,
    fromRemoteState: remoteState,
    toDesiredState: desiredState,
    difference:
      action === DeclastructChangeProposalAction.DO_NOTHING
        ? null
        : diff.displayable,
    action,
  });
};
