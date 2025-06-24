import { BadRequestError } from '@ehmpathy/error-fns';
import { UnexpectedCodePathError } from '@ehmpathy/error-fns';
import { VisualogicContext } from 'visualogic';

import { DeclaredResource } from '../../../domain/DeclaredResource';
import {
  DeclaredResourceReference,
  DeclaredResourceReferenceKeyType,
} from '../../../domain/DeclaredResourceReference';
import { DeclastructContext } from '../../../domain/DeclastructContext';
import { buildPrimaryKeyTo } from './buildPrimaryKeyTo';
import { getByReference } from './getByReference';

/**
 * tactic: gets the primary key of a resource by reference
 * strategy
 * - if reference is identified by primary key, then return it
 * - if reference is identified by unique key, then get the resource by reference, and build the primary key from it
 * usecase
 * - speed up unique key resolution by returning it from the reference if already present, preventing redundant downstream calls
 */
export const getPrimaryKeyByReference = async <
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
): Promise<Required<Pick<T, P>>> => {
  // if reference is by primary key, return the value
  if (
    reference.identifiedBy.key === DeclaredResourceReferenceKeyType.PRIMARY_KEY
  )
    return reference.identifiedBy.value;

  // if reference is by unique key, get the resource by reference and build the primary key from it
  if (
    reference.identifiedBy.key === DeclaredResourceReferenceKeyType.UNIQUE_KEY
  ) {
    const resource = await getByReference({ reference }, context);
    if (!resource)
      throw new BadRequestError(
        // todo: make this a typed error
        'could not find resource by unique-key reference to getPrimaryKeyByReference',
        { reference },
      );
    return buildPrimaryKeyTo(resource.constructor as any, resource);
  }

  // otherwise, resource reference was declared incorrectly. this should not happen due to types
  throw new UnexpectedCodePathError('invalid resource reference declaration', {
    reference,
  });
};
