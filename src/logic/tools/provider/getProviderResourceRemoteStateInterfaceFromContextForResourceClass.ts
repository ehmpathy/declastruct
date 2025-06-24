import { UnexpectedCodePathError } from '@ehmpathy/error-fns';

import { DeclaredResource } from '../../../domain/DeclaredResource';
import { DeclastructContext } from '../../../domain/DeclastructContext';
import { DeclastructProviderAgentOptions } from '../../../domain/DeclastructProvider';
import { DeclastructProviderResourceRemoteStateInterface } from '../../../domain/DeclastructProviderResourceRemoteStateInterface';

/**
 * grabs the appropriate interface for managing resources of this class, by resource class name
 */
export const getProviderResourceRemoteStateInterfaceFromContextForResourceClass =
  <
    R extends DeclaredResource,
    AO extends DeclastructProviderAgentOptions,
    P extends keyof R,
    U extends keyof R,
  >(
    { resourceClassName }: { resourceClassName: string },
    context: DeclastructContext,
  ): DeclastructProviderResourceRemoteStateInterface<R, AO, P, U> => {
    // lookup the provider for this resource
    const provider = context.providers.find(
      (thisProvider) => resourceClassName in thisProvider.interfaces,
    );
    if (!provider)
      throw new UnexpectedCodePathError(
        'could not find provider for resource',
        {
          resourceClassName,
        },
      );

    // grab the interface
    const resourceInterface = provider.interfaces[
      resourceClassName
    ] as any as DeclastructProviderResourceRemoteStateInterface<R, AO, P, U>;

    // return it
    return resourceInterface;
  };
