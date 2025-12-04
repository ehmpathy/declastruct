import type { DomainEntity } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';

import type { DeclastructDao } from '../../domain.objects/DeclastructDao';
import type { DeclastructProvider } from '../../domain.objects/DeclastructProvider';

/**
 * .what = gets the DAO and provider context for a given resource from available providers
 * .why = enables automatic routing of operations to the correct provider with proper context
 * .note = fails fast if multiple providers support same resource or if no provider is found
 */
export const getDaoByResource = ({
  resource,
  providers,
}: {
  resource: DomainEntity<any>;
  providers: DeclastructProvider<any, any>[];
}): {
  dao: DeclastructDao<DomainEntity<any>, any, any>;
  context: any;
} => {
  // get resource class name
  const resourceClassName = resource.constructor.name;

  // find all providers applicable to this resource
  const providersApplicable = providers
    .map((provider) => ({
      name: provider.name,
      dao: provider.daos[resourceClassName],
      context: provider.context,
    }))
    .filter((match) => match.dao);

  // reject if multiple providers support same resource
  if (providersApplicable.length > 1) {
    throw new UnexpectedCodePathError(
      'multiple providers support same resource',
      {
        resource: resourceClassName,
        providers: providersApplicable.map((m) => m.name),
      },
    );
  }

  // reject if no provider found
  const [matchedProvider] = providersApplicable;
  if (!matchedProvider) {
    throw new UnexpectedCodePathError('no DAO found for resource', {
      resourceClassName,
      availableProviders: providers.map((p) => ({
        name: p.name,
        supportedResources: Object.keys(p.daos),
      })),
    });
  }

  return { dao: matchedProvider.dao, context: matchedProvider.context };
};
