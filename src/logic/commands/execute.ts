import { UnexpectedCodePathError } from '@ehmpathy/error-fns';
import chalk from 'chalk';
import { VisualogicContext } from 'visualogic';

import { DeclaredResource } from '../../domain/DeclaredResource';
import { DeclastructProvider } from '../../domain/DeclastructProvider';
import { createDeclastructContext } from '../tools/context/createDeclastructContext';
import { destroyDeclastructContext } from '../tools/context/destroyDeclastructContext';
import { applyChanges } from './command.apply';
import { planChanges } from './command.plan';

export enum DeclastructCommandOption {
  PLAN = 'PLAN',
  APPLY = 'APPLY',
}

/**
 * a utility for safely executing a command
 */
export const executeCommand = async (
  {
    option,
    resources,
    providers,
  }: {
    option: DeclastructCommandOption;
    resources: DeclaredResource[];
    providers: DeclastructProvider<any>[];
  },
  { log }: VisualogicContext,
): Promise<void> => {
  // create the context
  console.log(
    `🔑 ${chalk.bold(chalk.white('initializing...'))} ${chalk.gray(
      `(${providers.length} providers, ${resources.length} resources)`,
    )}`,
  );
  console.log('');
  const context = await createDeclastructContext({ providers, resources, log });

  // execute the command safely
  let hadError = false;
  try {
    // handle the plan command
    if (option === DeclastructCommandOption.PLAN) {
      await planChanges({ resources, inFullDetail: true }, context);
      return;
    }

    // handle the apply command
    if (option === DeclastructCommandOption.APPLY) {
      const proposals = await planChanges(
        { resources, inFullDetail: false },
        context,
      );
      await applyChanges({ proposals }, context);
      return;
    }

    // throw on unexpected
    throw new UnexpectedCodePathError('unsupported option was selected', {
      option,
    });
  } catch (error) {
    // track that there was an error
    hadError = true;

    // log the error
    console.error(error);

    // and pass it on up
    throw error;
  } finally {
    console.log(`🧹 cleaning up...`);
    await destroyDeclastructContext({ context }); // todo: actually destroy when can destroy only the instantiated providers (not the preinstantiated ones)
    if (hadError) console.log(`\n🚨 experienced an error\n`);
    else console.log(`🎉 done!`);
  }
};
