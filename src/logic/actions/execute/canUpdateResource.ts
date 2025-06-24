import { DomainEntity } from 'domain-objects';

import { DeclastructContext } from '../../../domain/DeclastructContext';
import { getProviderResourceRemoteStateInterfaceExecutionDependenciesForResource } from '../../tools/provider/getProviderResourceRemoteStateInterfaceExecutionDependenciesForResource';

export const canUpdateResource = <R extends DomainEntity<any>>(
  { resource }: { resource: R },
  context: DeclastructContext,
): boolean => {
  // grab the interface for the resource
  const { remoteStateInterface } =
    getProviderResourceRemoteStateInterfaceExecutionDependenciesForResource(
      { resource },
      context,
    );

  // check if it has defined the update method
  return !!remoteStateInterface.update;
};
