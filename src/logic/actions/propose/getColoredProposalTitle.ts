import chalk from 'chalk';
import { getMetadataKeys } from 'domain-objects';
import { isPresent } from 'type-fns';

import { DeclastructChangeProposal } from '../../../domain/DeclastructChangeProposal';
import { getColoredActionToken } from './getColoredActionToken';

export const getColoredProposalTitle = ({
  proposal,
}: {
  proposal: DeclastructChangeProposal<any>;
}) => {
  // get the action token
  const actionToken = getColoredActionToken({ action: proposal.action });

  // define the metadata string
  const metadata = proposal.fromRemoteState
    ? getMetadataKeys(proposal.fromRemoteState).reduce(
        (summary, thisMetadataKey) => ({
          ...summary,
          [thisMetadataKey]: proposal.toDesiredState[thisMetadataKey],
        }),
        {} as Partial<typeof proposal.toDesiredState>,
      )
    : {};
  const identifierAvailableWidth =
    151 - 5 - actionToken.length - proposal.forResourceClassName.length - 15;
  const identifierString = Object.values(metadata).filter(isPresent).length
    ? JSON.stringify(metadata)
    : proposal.forGrokableIdentifier.replace(proposal.forResourceClassName, ''); // remove the classname from the identifier because its redundant, the class name is already in the title
  const displayableIdentifierString = chalk.grey(
    `(${
      identifierString.length > identifierAvailableWidth
        ? identifierString.slice(0, identifierAvailableWidth - 3) + '...'
        : identifierString
    })`,
  );

  // define the header
  const title = chalk.bold(
    `${actionToken} ${proposal.forResourceClassName} ${displayableIdentifierString}`,
  );

  // return header
  return title;
};
