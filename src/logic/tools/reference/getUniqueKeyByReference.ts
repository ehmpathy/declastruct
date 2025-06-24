import { BadRequestError } from '@ehmpathy/error-fns';
import { UnexpectedCodePathError } from '@ehmpathy/error-fns';
import { VisualogicContext } from 'visualogic';

import { DeclaredResource } from '../../../domain/DeclaredResource';
import {
  DeclaredResourceReference,
  DeclaredResourceReferenceKeyType,
} from '../../../domain/DeclaredResourceReference';
import { DeclastructContext } from '../../../domain/DeclastructContext';
import { buildUniqueKeyTo } from './buildUniqueKeyTo';
import { getByReference } from './getByReference';

/**
 * tactic: gets the unique key of a resource by reference
 * strategy
 * - if reference is identified by unique key, then return it
 * - if reference is identified by primary key, then get the resource by reference, and build the unique key from it
 * usecase
 * - speed up unique key resolution by returning it from the reference if already present, preventing redundant downstream calls
 */
export const getUniqueKeyByReference = async <
  T extends DeclaredResource,
  P extends keyof T,
  U extends keyof T,
>(
  {
    reference,
  }: {
    reference: DeclaredResourceReference<T, P, U>;
  },
  context: DeclastructContext & VisualogicContext,
): Promise<Required<Pick<T, U>>> => {
  // if reference is by unique key, return the value
  if (
    reference.identifiedBy.key === DeclaredResourceReferenceKeyType.UNIQUE_KEY
  )
    return reference.identifiedBy.value;

  // if reference is by primary key, get the resource by reference and build the primary key from it
  if (
    reference.identifiedBy.key === DeclaredResourceReferenceKeyType.PRIMARY_KEY
  ) {
    const resource = await getByReference({ reference }, context);
    if (!resource)
      throw new BadRequestError(
        // todo: make this a typed error
        'could not find resource by primary-key reference to getUniqueKeyByReference',
        { reference },
      );
    return buildUniqueKeyTo(resource.constructor as any, resource);
  }

  // otherwise, resource reference was declared incorrectly. this should not happen due to types
  throw new UnexpectedCodePathError('invalid resource reference declaration', {
    reference,
  });
};
