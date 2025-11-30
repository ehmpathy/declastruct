import chalk from 'chalk';

import { DeclastructChangeAction } from '../domain.objects/DeclastructChange';

/**
 * .what = returns a colorized action label for CLI output
 * .why = improves visual distinction between action types
 * .note = uses pastel colors for a softer, zen aesthetic
 */
export const colorizeAction = (action: DeclastructChangeAction): string => {
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
    default:
      return `[${action}]`;
  }
};
