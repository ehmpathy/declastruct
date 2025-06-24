import chalk from 'chalk';

import { DeclastructChangeProposalAction } from '../../../domain/DeclastructChangeProposal';

export const getColoredActionToken = ({
  action,
}: {
  action: DeclastructChangeProposalAction;
}) => {
  // define action color
  const actionChalk = {
    [DeclastructChangeProposalAction.CREATE]: chalk.green,
    [DeclastructChangeProposalAction.DO_NOTHING]: chalk.gray,
    [DeclastructChangeProposalAction.UPDATE]: chalk.yellow,
    [DeclastructChangeProposalAction.REPLACE]: chalk.red,
    [DeclastructChangeProposalAction.DESTROY]: chalk.red,
  }[action];

  // return the token
  return chalk.bold(actionChalk(`[${action}]`));
};
