import { isAFunction } from 'type-fns';

import { DeclaredResource } from '../../../domain/DeclaredResource';
import { DeclastructProvider } from '../../../domain/DeclastructProvider';
import { createDeclastructContext } from '../../../logic/tools/context/createDeclastructContext';

export interface DeclastructCommandInput {
  resources: DeclaredResource[] | (() => Promise<DeclaredResource[]>);
  providers:
    | DeclastructProvider<any>[]
    | (() => Promise<DeclastructProvider<any>[]>);
}

/**
 * a utility method for resolving the command inputs from user definition
 * - we allow users to specify the inputs directly or from a function that promises the inputs
 * - this method awaits the inputs if needed
 */
export const resolveCommandInputs = async ({
  input,
}: {
  input: DeclastructCommandInput;
}) => {
  const resources: DeclaredResource[] = isAFunction(input.resources)
    ? await input.resources()
    : input.resources;
  const providers: DeclastructProvider<any>[] = isAFunction(input.providers)
    ? await input.providers()
    : input.providers;
  return {
    resources,
    providers,
  };
};
