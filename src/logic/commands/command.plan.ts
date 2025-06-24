import { roundToHundredths } from '@ehmpathy/number-fns';
import Bottleneck from 'bottleneck';
import chalk from 'chalk';
import indentString from 'indent-string';
import ora from 'ora';
import { isPresent } from 'type-fns';
import { VisualogicContext } from 'visualogic';

import { DeclaredResource } from '../../domain/DeclaredResource';
import {
  DeclastructChangeProposal,
  DeclastructChangeProposalAction,
} from '../../domain/DeclastructChangeProposal';
import { DeclastructContext } from '../../domain/DeclastructContext';
import { getColoredActionToken } from '../actions/propose/getColoredActionToken';
import { getColoredProposalTitle } from '../actions/propose/getColoredProposalTitle';
import { proposeChangeForResource } from '../actions/propose/proposeChangeForResource';

const bottleneck = new Bottleneck({ maxConcurrent: 1 });

type StatsForPlan = {
  [index in DeclastructChangeProposalAction]: {
    total: number;
    perResource: Record<string, number>;
  };
};
const countTimesActionRequired = ({
  proposals,
  action,
}: {
  proposals: DeclastructChangeProposal<any>[];
  action: DeclastructChangeProposalAction;
}) =>
  proposals
    .filter((proposal) => proposal.action === action)
    .reduce(
      (summary, thisProposal) => {
        const currentTotal = summary.total;
        const currentCountPerThisResource =
          summary.perResource[thisProposal.forResourceClassName] ?? 0;
        return {
          total: currentTotal + 1,
          perResource: {
            ...summary.perResource,
            [thisProposal.forResourceClassName]:
              currentCountPerThisResource + 1,
          },
        };
      },
      {
        total: 0,
        perResource: {},
      } as StatsForPlan[DeclastructChangeProposalAction],
    );

/**
 * shows
 * - the differences between the remote state and declared state
 * - the actions proposed to update the remote state to match the declared state // TODO
 */
export const planChanges = async (
  {
    resources,
    inFullDetail,
  }: {
    resources: DeclaredResource[];
    inFullDetail: boolean;
  },
  context: DeclastructContext & VisualogicContext,
): Promise<DeclastructChangeProposal<DeclaredResource>[]> => {
  console.log(chalk.bold(chalk.white(`🔬 planning...`)));
  const startTimeInMillisecondsCumulative = new Date().getTime();
  const proposals = await Promise.all(
    // TODO: dedupe ora spinner + timer between plan and apply
    resources.map(async (resource, index) =>
      bottleneck.schedule(async () => {
        if (index > 0 && index % 100 == 0)
          console.log(
            `${chalk.bold(chalk.gray('[PLANNING]'))} at resource ${index}/${
              resources.length
            }\n`,
          );
        const actionTitle = `${chalk.bold(
          chalk.gray('[PLANNING]'),
        )} ${chalk.bold(resource.constructor.name)}`;
        let spinner: ora.Ora | null = null as ora.Ora | null;
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
          if (!spinner)
            spinner = ora({
              text: actionTitle,
              indent: 2,
            }).start(); // start after first interval timeout passes, so that instaplans dont noise up the output
          spinner.text = `${actionTitle} at ${getDurationInSeconds()} sec`;
        }, 100);
        try {
          const proposal = await proposeChangeForResource(
            { resource },
            context,
          );
          await spinner?.stopAndPersist({
            symbol: chalk.bold(chalk.green('✔')),
            text: `${actionTitle} ${chalk.gray(
              `took ${getDurationInSeconds()} sec`,
            )}`,
          });
          return proposal;
        } catch (error: any) {
          await spinner?.stopAndPersist({
            symbol: chalk.bold(chalk.red('x')),
          });
          throw error;
        } finally {
          // console.log(`fin at ${getDurationInSeconds()} sec`);
          clearInterval(interval); // note: this will prevent any plans that took less than a second from appearing ever w/ spinner
        }
      }),
    ),
  );
  const endTimeInMillisecondsCumulative = new Date().getTime();
  const durationInMillisecondsCumulative =
    endTimeInMillisecondsCumulative - startTimeInMillisecondsCumulative;
  const durationInSecondsCumulative = roundToHundredths(
    durationInMillisecondsCumulative / 1e3,
  );
  console.log(
    `${chalk.bold(
      chalk.gray('[PLANNING]'),
    )} took ${durationInSecondsCumulative} sec total\n`,
  );

  // if full detail was requested, enumerate each change
  let output: string[] = [];
  if (inFullDetail) {
    // filter out nochange plans
    const proposalsWithChange = proposals.filter(
      (proposal) =>
        proposal.action !== DeclastructChangeProposalAction.DO_NOTHING,
    );
    if (!proposalsWithChange.length) {
      console.log(
        `\n${chalk.bold('Everything is up to date 🎉')}. No changes proposed.`,
      );
      return proposals; // exit here if no changes proposed
    }

    // define plans output
    output = proposalsWithChange // skip plans that have no change
      .map((proposal) => {
        // define plan header
        const header = `  * ${getColoredProposalTitle({ proposal })}`;

        // define the diff
        const diff = proposal.difference
          ? `\n${indentString(proposal.difference, 6)}\n`
          : '';

        // append to output
        return header + diff;
      });
  }

  // define the plans summary
  const stats: StatsForPlan = {
    [DeclastructChangeProposalAction.DO_NOTHING]: countTimesActionRequired({
      proposals,
      action: DeclastructChangeProposalAction.DO_NOTHING,
    }),
    [DeclastructChangeProposalAction.CREATE]: countTimesActionRequired({
      proposals,
      action: DeclastructChangeProposalAction.CREATE,
    }),
    [DeclastructChangeProposalAction.UPDATE]: countTimesActionRequired({
      proposals,
      action: DeclastructChangeProposalAction.UPDATE,
    }),
    [DeclastructChangeProposalAction.REPLACE]: countTimesActionRequired({
      proposals,
      action: DeclastructChangeProposalAction.REPLACE,
    }),
    [DeclastructChangeProposalAction.DESTROY]: countTimesActionRequired({
      proposals,
      action: DeclastructChangeProposalAction.DESTROY,
    }),
  };
  const statsToSummaryRows = Object.entries(stats)
    .filter((entry) => entry[1].total > 0)
    .map(([action, counts]) =>
      [
        `  * ${getColoredActionToken({
          action: action as DeclastructChangeProposalAction,
        })} ${counts.total}`,

        // display counts per resource for all actions except "no change"
        ...(action === DeclastructChangeProposalAction.DO_NOTHING
          ? []
          : Object.entries(counts.perResource).map(
              ([resourceName, resourceCount]) =>
                `    * ${resourceCount} ${resourceName}`,
            )),
      ].join('\n'),
    );
  const statsOutput = [
    inFullDetail ? chalk.bold(chalk.white('👀 summary...')) : undefined,
    ...statsToSummaryRows,
  ]
    .filter(isPresent)
    .join('\n');

  // display the output in one statement to make it easier on testing
  console.log([...output, statsOutput, ''].join('\n')); // tslint:disable-line no-console

  // and return the proposals
  return proposals;
};
