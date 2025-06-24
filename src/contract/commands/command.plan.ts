import { VisualogicContext } from 'visualogic';

import {
  DeclastructCommandOption,
  executeCommand,
} from '../../logic/commands/execute';
import {
  DeclastructCommandInput,
  resolveCommandInputs,
} from './utils/resolveCommandInputs';

/**
 * applies the planned actions required to update the remote state to match the declared state
 */
export const plan = async (
  input: DeclastructCommandInput,
  context: VisualogicContext,
): Promise<void> => {
  // resolve the inputs
  const { resources, providers } = await resolveCommandInputs({ input });

  // execute the command
  await executeCommand(
    {
      option: DeclastructCommandOption.PLAN,
      resources,
      providers,
    },
    context,
  );
};
