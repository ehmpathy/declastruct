import { VisualogicContext } from 'visualogic';

import { DeclaredResource } from '../../../domain/DeclaredResource';
import { DeclastructContext } from '../../../domain/DeclastructContext';
import { getProviderContextFromGlobalContextForResourceClass } from '../provider/getProviderContextFromGlobalContextForResourceClass';
import { getProviderResourceRemoteStateInterfaceFromContextForResourceClass } from '../provider/getProviderResourceRemoteStateInterfaceFromContextForResourceClass';

export const getByReferencedUniqueKey = async <
  R extends DeclaredResource,
  U extends keyof R,
>(
  {
    referenceOf,
    uniqueKey,
  }: {
    referenceOf: string;
    uniqueKey: Required<Pick<R, U>>;
  },
  context: DeclastructContext & VisualogicContext,
) => {
  // lookup the interface
  // const stopwatchOne = startDurationStopwatch(
  //   {
  //     for: `getByReferencedUniqueKey.ofClass::${referenceOf}.getInterface`,
  //     log: { level: LogLevel.INFO, threshold: { milliseconds: 1 } },
  //   },
  //   context,
  // );
  const persistanceInterface =
    getProviderResourceRemoteStateInterfaceFromContextForResourceClass<
      R,
      any,
      any,
      U
    >(
      {
        resourceClassName: referenceOf,
      },
      context,
    );
  // stopwatchOne.stop();

  // lookup the provider context
  // const stopwatchTwo = startDurationStopwatch(
  //   {
  //     for: `getByReferencedUniqueKey.ofClass::${referenceOf}.getContext`,
  //     log: { level: LogLevel.INFO, threshold: { milliseconds: 1 } },
  //   },
  //   context,
  // );
  const providerContext = getProviderContextFromGlobalContextForResourceClass(
    { resourceClassName: referenceOf },
    context,
  );
  // stopwatchTwo.stop();

  // find by unique
  // const stopwatchThree = startDurationStopwatch(
  //   {
  //     for: `getByReferencedUniqueKey.ofClass::${referenceOf}:persistanceInterface.findByUnique`,
  //     log: { level: LogLevel.INFO, threshold: { milliseconds: 1 } },
  //   },
  //   context,
  // );
  const result = await persistanceInterface.findByUnique(
    uniqueKey,
    providerContext,
  );
  // stopwatchThree.stop();
  return result;
};
