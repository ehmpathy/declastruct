import { Command } from 'commander';

import pkg from '../../../package.json';
import { executeApplyCommand } from './apply';
import { executePlanCommand } from './plan';

const log = console;

/**
 * .what = invokes CLI commands based on user input
 * .why = provides global entry point for declastruct CLI
 * .note = uses commander for argument parsing and help text
 */
export const invoke = async ({ args }: { args: string[] }): Promise<void> => {
  const program = new Command();

  program
    .name('declastruct')
    .description('Declarative resource structure control')
    .version(pkg.version);

  program
    .command('plan')
    .description('Generate a change plan from a wish file')
    .requiredOption('--wish <file>', 'Path to wish file')
    .requiredOption('--into <file>', 'Path to output plan file')
    .action(async (options) => {
      try {
        await executePlanCommand({
          wishFilePath: options.wish,
          planFilePath: options.into,
        });
      } catch (error) {
        log.error('✖ Error during plan:', error);
        process.exit(1);
      }
    });

  program
    .command('apply')
    .description('Apply changes from a plan file')
    .option('--plan <file>', 'Path to plan file, or "yolo" for immediate apply')
    .option('--wish <file>', 'Path to wish file (required when --plan yolo)')
    .action(async (options) => {
      try {
        await executeApplyCommand({
          planFilePath: options.plan,
          wishFilePath: options.wish,
        });
      } catch (error) {
        log.error('✖ Error during apply:', error);
        process.exit(1);
      }
    });

  await program.parseAsync(args, { from: 'user' });
};
