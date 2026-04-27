/**
 * .what = transforms a plan command argv into the equivalent apply command
 * .why = shows users the exact command to run after plan, no syntax to remember
 */
export const asApplyCommandFromArgv = (input: {
  argv: string[];
  planFilePath: string;
}): string => {
  const { argv, planFilePath } = input;

  // detect invocation prefix (npx, pnpm dlx, yarn dlx, or bare)
  const prefix = getInvocationPrefix({ argv });

  // build the apply command
  // convert: plan → apply, --into → --plan, remove --wish, --snap, and passthrough args
  const applyArgs = asApplyArgsFromArgv({ argv, planFilePath });

  return [prefix, 'declastruct apply', ...applyArgs].filter(Boolean).join(' ');
};

/**
 * .what = extracts the invocation prefix from argv
 * .why = preserves how user invoked the command (npx, pnpm dlx, yarn dlx, or bare)
 */
const getInvocationPrefix = (input: { argv: string[] }): string => {
  const { argv } = input;
  const execPath = argv[1] ?? '';

  // detect package manager runners
  if (execPath.includes('npx')) return 'npx';
  if (execPath.includes('pnpm')) return 'pnpm dlx';
  if (execPath.includes('yarn')) return 'yarn dlx';

  // check if invoked via node_modules/.bin (local install)
  if (execPath.includes('node_modules/.bin')) return 'npx';

  // bare invocation (global install or direct path)
  return '';
};

/**
 * .what = converts plan argv into apply args
 * .why = removes plan-specific flags and adds --plan flag
 */
const asApplyArgsFromArgv = (input: {
  argv: string[];
  planFilePath: string;
}): string[] => {
  const { argv, planFilePath } = input;
  const result: string[] = [`--plan ${planFilePath}`];

  // find where our CLI args start (after node and executable path)
  const cliArgs = argv.slice(2);

  // track which args to skip (flag + value pairs)
  const skipFlags = new Set(['--wish', '--into', '--snap']);
  let skipNext = false;
  let hitPassthrough = false;

  for (const arg of cliArgs) {
    // stop at passthrough separator
    if (arg === '--') {
      hitPassthrough = true;
      continue;
    }

    // skip everything after passthrough
    if (hitPassthrough) continue;

    // skip the value of a flag we're removing
    if (skipNext) {
      skipNext = false;
      continue;
    }

    // check if this is a flag we're removing
    if (skipFlags.has(arg)) {
      skipNext = true;
      continue;
    }

    // check for --flag=value syntax
    const [flag] = arg.split('=');
    if (flag && skipFlags.has(flag)) continue;

    // skip the 'plan' command itself
    if (arg === 'plan') continue;

    // preserve all other args
    result.push(arg);
  }

  return result;
};
