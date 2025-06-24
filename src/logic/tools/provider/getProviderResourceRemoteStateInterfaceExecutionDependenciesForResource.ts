import { UnexpectedCodePathError } from '@ehmpathy/error-fns';
import { DomainEntity } from 'domain-objects';

import { DeclastructContext } from '../../../domain/DeclastructContext';
import { DeclastructProviderContext } from '../../../domain/DeclastructProviderContext';
import { DeclastructProviderResourceRemoteStateInterface } from '../../../domain/DeclastructProviderResourceRemoteStateInterface';
import { getProviderContextFromGlobalContextForResourceClass } from './getProviderContextFromGlobalContextForResourceClass';
import { getProviderResourceRemoteStateInterfaceFromContextForResourceClass } from './getProviderResourceRemoteStateInterfaceFromContextForResourceClass';

/**
 * returns everything required to execute operations against the remote-state-interface for a resource
 */
export const getProviderResourceRemoteStateInterfaceExecutionDependenciesForResource =
  <R extends DomainEntity<any>>(
    { resource }: { resource: R },
    context: DeclastructContext,
  ): {
    remoteStateInterface: DeclastructProviderResourceRemoteStateInterface<
      R,
      any,
      any,
      any
    >;
    providerContext: DeclastructProviderContext<any>;
  } => {
    // sanity check that resource is a domain entity (otherwise, it cant be created)
    if (!(resource instanceof DomainEntity))
      throw new UnexpectedCodePathError(
        'can not createResource on a non DomainEntity object',
        { resource },
      );
    const resourceClassName = resource.constructor.name;

    // lookup the interface
    const remoteStateInterface =
      getProviderResourceRemoteStateInterfaceFromContextForResourceClass<
        R,
        any,
        any,
        any
      >({ resourceClassName }, context);

    // lookup the provider context
    const providerContext = getProviderContextFromGlobalContextForResourceClass(
      { resourceClassName },
      context,
    );

    // return the dependencies
    return { remoteStateInterface, providerContext };
  };
