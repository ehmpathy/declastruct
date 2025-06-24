import { UnexpectedCodePathError } from '@ehmpathy/error-fns';

import { DeclaredResource } from '../../../domain/DeclaredResource';
import { DeclastructContext } from '../../../domain/DeclastructContext';
import {
  DeclastructProvider,
  DeclastructProviderAgentOptions,
} from '../../../domain/DeclastructProvider';
import { DeclastructProviderContext } from '../../../domain/DeclastructProviderContext';

/**
 * defines the provider specific context for resources of a specific class, from the full context
 *
 * relevance
 * - we dont share the full declastruct context to providers, due to security, becuase credentials are defined in the full context
 * - instead, we only share the the data the user explicitly defined for a particular provider (agentOptions, resources)
 */
export const getProviderContextFromGlobalContextForResourceClass = <
  AO extends DeclastructProviderAgentOptions,
>(
  { resourceClassName }: { resourceClassName: string },
  context: DeclastructContext,
): DeclastructProviderContext<AO> => {
  // lookup the provider for this resource
  const provider = context.providers.find(
    (thisProvider) => resourceClassName in thisProvider.interfaces,
  );
  if (!provider)
    throw new UnexpectedCodePathError('could not find provider for resource', {
      resourceClassName,
    });

  // find all of the resources managed by this provider
  const resources: DeclaredResource[] = context.resources.filter(
    (resource) => resource.constructor.name in provider.interfaces, // only expose resources to this provider for the the resources that this provider exposes interfaces for // TODO: assert that only one provider can claim a resource name
  );

  // return the context
  return {
    provider: provider as DeclastructProvider<AO>,
    resources,
    log: context.log,
  };
};
