import { DeclaredResource } from '../../../domain/DeclaredResource';
import { DeclastructContext } from '../../../domain/DeclastructContext';
import { getProviderContextFromGlobalContextForResourceClass } from '../provider/getProviderContextFromGlobalContextForResourceClass';
import { getProviderResourceRemoteStateInterfaceFromContextForResourceClass } from '../provider/getProviderResourceRemoteStateInterfaceFromContextForResourceClass';

export const getByReferencedPrimaryKey = <
  R extends DeclaredResource,
  P extends keyof R,
>(
  {
    referenceOf,
    primaryKey,
  }: {
    referenceOf: string;
    primaryKey: Required<Pick<R, P>>;
  },
  context: DeclastructContext,
) => {
  // lookup the interface
  const persistanceInterface =
    getProviderResourceRemoteStateInterfaceFromContextForResourceClass<
      R,
      any,
      P,
      any
    >(
      {
        resourceClassName: referenceOf,
      },
      context,
    );

  // lookup the provider context
  const providerContext = getProviderContextFromGlobalContextForResourceClass(
    { resourceClassName: referenceOf },
    context,
  );

  // find by primary
  return persistanceInterface.findByPrimary(primaryKey, providerContext);
};
