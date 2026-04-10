import { Command } from 'commander';
import { BadRequestError } from 'helpful-errors';

import pkg from '../../../package.json';
import { executeApplyCommand } from './apply';
import { executePlanCommand } from './plan';

const log = console;

/**
 * .what = determines exit code based on error type
 * .why = semantic exit codes let callers know if they can retry or must fix
 */
const getExitCodeForError = (error: unknown): number => {
  if (error instanceof BadRequestError) return 2;
  return 1;
};

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
    .option('--snap <file>', 'Path to output snapshot file')
    .usage('--wish <file> --into <file> [-- <wish-args>]')
    .allowExcessArguments(true)
    .configureOutput({
      writeErr: (str: string) => {
        // intercept unknown option errors and add hint
        if (str.includes('unknown option')) {
          const match = str.match(/unknown option '([^']+)'/);
          const flag = match?.[1] ?? '';
          log.error(str.trim());
          log.error(`hint: to pass args to your wish file, use: -- ${flag}`);
        } else {
          log.error(str.trim());
        }
      },
    })
    .action(async (options, command) => {
      try {
        // capture args after -- separator
        const passthroughArgs = command.args;
        await executePlanCommand({
          wishFilePath: options.wish,
          planFilePath: options.into,
          snapFilePath: options.snap ?? null,
          passthroughArgs,
        });
      } catch (error) {
        // allowlist: BadRequestError (user must fix) and Error (malfunction)
        // rethrow anything else (non-Error thrown = unexpected)
        if (!(error instanceof Error)) throw error;
        log.error('✖ plan failed:', error);
        process.exit(getExitCodeForError(error));
      }
    });

  program
    .command('apply')
    .description('Apply changes from a plan file')
    .option('--plan <file>', 'Path to plan file, or "yolo" for immediate apply')
    .option('--wish <file>', 'Path to wish file (required when --plan yolo)')
    .allowExcessArguments(true) // ignore passthrough args - apply uses plan's captured state
    .action(async (options) => {
      try {
        await executeApplyCommand({
          planFilePath: options.plan,
          wishFilePath: options.wish,
        });
      } catch (error) {
        // allowlist: BadRequestError (user must fix) and Error (malfunction)
        // rethrow non-Error values (unexpected)
        if (!(error instanceof Error)) throw error;
        log.error('✖ apply failed:', error);
        process.exit(getExitCodeForError(error));
      }
    });

  await program.parseAsync(args, { from: 'user' });
};
