import { UnexpectedCodePathError } from '@ehmpathy/error-fns';
import { BadRequestError } from '@ehmpathy/error-fns';
import { VisualogicContext } from 'visualogic';

import { getReferenceTo } from '../../..';
import {
  DeclaredResourceReference,
  DeclaredResourceReferenceKeyType,
} from '../../../domain/DeclaredResourceReference';
import { DeclastructContext } from '../../../domain/DeclastructContext';
import { getByReference } from '../reference/getByReference';
import { resolveReferencesToCommonComparableForm } from './resolveReferencesToCommonComparableForm';

/**
 * resolves a reference to a common form, which any reference can be normalized to, in which it can be compared
 * - references can only be compared in fully-expanded unique-key form
 * - this function resolves all primary key references into fully-expanded unique-key form
 *
 * context
 * - references to the same resource can be defined by primary-key or unique-key
 * - there is no way to determine whether a unique-key reference and a primary-key reference are referring to the same resource
 * - the unique-key reference is the only reference form which can be guaranteed to be resolvable
 *   - a primary-key reference can always be resolved to a unique-key reference (if a resource has a primary key assigned, then it can be looked up by primary key in the remote state)
 *   - a unique-key reference may not be resolvable into a primary-key reference (the resource may not exist yet, and so there may not exist a primary-key defined for the resource)
 * - a unique-key may itself be composed of nested unique keys
 *   - for example, a `GoogleAdsAdGroup` is unique per `GoogleAdsCampaign` which itself is unique per `GoogleAdsAccount`
 *   - these nested references must each be resolved
 */
export const resolveReferenceToCommonComparableForm = async <
  T extends DeclaredResourceReference<any, any, any>,
>(
  { reference }: { reference: T },
  context: DeclastructContext & VisualogicContext,
): Promise<T> => {
  // if this is a unique key reference, resolve any nested references and return that result
  if (
    reference.identifiedBy.key === DeclaredResourceReferenceKeyType.UNIQUE_KEY
  ) {
    const uniqueKeyValueWithNestedReferencesResolved =
      await resolveReferencesToCommonComparableForm(
        {
          in: reference.identifiedBy.value,
        },
        context,
      );
    return new DeclaredResourceReference({
      referenceOf: reference.referenceOf,
      identifiedBy: {
        key: reference.identifiedBy.key,
        value: uniqueKeyValueWithNestedReferencesResolved,
      },
    }) as T;
  }

  // if this is a primary key reference, lookup the resource and evaluate common form from there
  const resource = await getByReference({ reference }, context);
  if (!resource)
    throw new BadRequestError(
      'could not find resource by primary key reference. can not resolveReferenceToCommonComparableForm',
      { reference },
    );
  const resolvedShallowReference = getReferenceTo(resource); // get reference to will produce a reference that may be shallow, since it synchronously computes the deepest reference possible from the available data returned by the interface
  if (
    resolvedShallowReference.identifiedBy.key !==
    DeclaredResourceReferenceKeyType.UNIQUE_KEY // sanity check that the resolved resource reference is defined by unique key; that's what it should normalize to since it's the most common form
  )
    throw new UnexpectedCodePathError(
      'should have resolved a reference by unique key from resolved resource',
      { resource, resolvedReference: resolvedShallowReference },
    );
  const resolvedReference = await resolveReferenceToCommonComparableForm(
    { reference: resolvedShallowReference }, // now resolve the reference into the deep common form
    context,
  );
  return resolvedReference as T;
};
