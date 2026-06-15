import { DeclastructChangeAction } from '@src/domain.objects/DeclastructChange';

/**
 * .what = dynamically imports chalk (ESM-only in v5+)
 * .why = node16 module resolution requires dynamic import for ESM packages in CJS
 */
const getChalk = async () => (await import('chalk')).default;

/**
 * .what = returns a colorized action label for CLI output
 * .why = improves visual distinction between action types
 * .note = uses pastel colors for a softer, zen aesthetic
 */
export const colorizeAction = async (
  action: DeclastructChangeAction,
): Promise<string> => {
  const chalk = await getChalk();
  switch (action) {
    case DeclastructChangeAction.KEEP:
      return chalk.hex('#9ca3af')('[KEEP]'); // pastel gray
    case DeclastructChangeAction.CREATE:
      return chalk.hex('#86efac')('[CREATE]'); // pastel green
    case DeclastructChangeAction.UPDATE:
      return chalk.hex('#fde047')('[UPDATE]'); // pastel yellow
    case DeclastructChangeAction.DESTROY:
      return chalk.hex('#fca5a5')('[DESTROY]'); // pastel red
    case DeclastructChangeAction.REPLACE:
      return chalk.hex('#fca5a5')('[REPLACE]'); // pastel red, since it includes a destroy
    case DeclastructChangeAction.OMIT:
      return chalk.hex('#9ca3af')('[OMIT]'); // pastel gray
    default:
      return `[${action}]`;
  }
};
