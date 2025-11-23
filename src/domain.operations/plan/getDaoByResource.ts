import { DomainEntity } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';

import { DeclastructDao } from '../../domain.objects/DeclastructDao';
import { DeclastructProvider } from '../../domain.objects/DeclastructProvider';

/**
 * .what = gets the DAO for a given resource from available providers
 * .why = enables automatic routing of operations to the correct provider
 * .note = fails fast if multiple providers support same resource or if no provider is found
 */
export const getDaoByResource = ({
  resource,
  providers,
}: {
  resource: DomainEntity<any>;
  providers: DeclastructProvider<any, any>[];
}): DeclastructDao<DomainEntity<any>, any, any> => {
  // get resource class name
  const resourceClassName = resource.constructor.name;

  // find all DAOs applicable to this resource
  const daosApplicable = providers
    .map((provider) => ({
      from: provider.name,
      dao: provider.daos[resourceClassName],
    }))
    .filter((match) => match.dao);

  // reject if multiple providers support same resource
  if (daosApplicable.length > 1) {
    throw new UnexpectedCodePathError(
      'multiple providers support same resource',
      {
        resource: resourceClassName,
        providers: daosApplicable.map((m) => m.from),
      },
    );
  }

  // reject if no DAO found
  const [matchedDao] = daosApplicable;
  if (!matchedDao) {
    throw new UnexpectedCodePathError('no DAO found for resource', {
      resourceClassName,
      availableProviders: providers.map((p) => ({
        name: p.name,
        supportedResources: Object.keys(p.daos),
      })),
    });
  }

  return matchedDao.dao;
};
