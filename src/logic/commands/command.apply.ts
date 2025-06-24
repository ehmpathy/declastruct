/* eslint-disable @typescript-eslint/no-loop-func */
import { roundToHundredths } from '@ehmpathy/number-fns';
import chalk from 'chalk';
import ora from 'ora';

import {
  DeclastructChangeProposal,
  DeclastructChangeProposalAction,
} from '../../domain/DeclastructChangeProposal';
import { DeclastructContext } from '../../domain/DeclastructContext';
import { executeProposal } from '../actions/execute/executeProposal';
import { getColoredProposalTitle } from '../actions/propose/getColoredProposalTitle';

/**
 * applies the planned actions required to update the remote state to match the declared state
 */
export const applyChanges = async (
  {
    proposals,
  }: {
    proposals: DeclastructChangeProposal<any>[];
  },
  context: DeclastructContext,
): Promise<void> => {
  console.log(chalk.bold(chalk.white(`🦾 applying...`)));

  // apply each plan, in parallel, up to max concurrency
  for (const proposal of proposals) {
    await (async () => {
      // if no change, dont even mention it
      if (proposal.action === DeclastructChangeProposalAction.DO_NOTHING)
        return;

      // if cant apply, notify we're skipping
      const canApply = [
        DeclastructChangeProposalAction.CREATE,
        DeclastructChangeProposalAction.UPDATE, // TODO: re-enable updates once we fix the permadiffs on the resources (also, add an easy way for users to say 'only create')
      ].includes(proposal.action);
      if (!canApply) {
        console.log(
          `  ${chalk.bold(chalk.yellow('↓'))} ${getColoredProposalTitle({
            proposal,
          })}`,
        ); // tslint:disable-line no-console
        return;
      }

      // if can apply, then try to apply
      const spinner = ora({
        text: `${getColoredProposalTitle({
          proposal,
        })}`,
        indent: 2,
      }).start();
      const startTimeInMilliseconds = new Date().getTime();
      const getDurationInSeconds = () => {
        const endTimeInMilliseconds = new Date().getTime();
        const durationInMilliseconds =
          endTimeInMilliseconds - startTimeInMilliseconds;
        const durationInSeconds = roundToHundredths(
          durationInMilliseconds / 1e3,
        );
        return durationInSeconds;
      };
      const interval = setInterval(() => {
        spinner.text = `${getColoredProposalTitle({
          proposal,
        })} at ${getDurationInSeconds()} sec`;
      }, 1000);
      try {
        await executeProposal({ proposal }, context);
        await spinner.stopAndPersist({
          symbol: chalk.bold(chalk.green('✔')),
          text: `${getColoredProposalTitle({
            proposal,
          })} ${chalk.gray(`took ${getDurationInSeconds()} sec`)}`,
        });
      } catch (error: any) {
        await spinner.stopAndPersist({
          symbol: chalk.bold(chalk.red('x')),
        });
        throw error;
      } finally {
        clearInterval(interval);
      }
    })();
  }
};
