import { DomainObject } from 'domain-objects';
import { VisualogicContext } from 'visualogic';

import { DeclaredResourceReference } from '../../../domain/DeclaredResourceReference';
import { DeclastructContext } from '../../../domain/DeclastructContext';
import { resolveReferenceToCommonComparableForm } from './resolveReferenceToCommonComparableForm';

/**
 * recursively resolves all references in the given object to their common-comparable-form
 *
 * see the docs on `resolveReferenceToCommonComparableForm` for more info
 */
export const resolveReferencesToCommonComparableForm = async <T extends any>(
  { in: value }: { in: T },
  context: DeclastructContext & VisualogicContext,
): Promise<T> => {
  // if this is not an object, then do nothing to it
  if (!Array.isArray(value) && typeof value !== 'object') return value; // if this value is not an array and is not an object, then it's a literal, so no more preparation required, return it itself
  if (value === null) return value; // if its null, return it too (null is typeof 'object' in js :shrug:)

  // if its an array, then `resolve references` on each element
  if (Array.isArray(value))
    return (await Promise.all(
      value.map((el) =>
        resolveReferencesToCommonComparableForm({ in: el }, context),
      ),
    )) as T;

  // if it's a reference, then resolve the reference
  if (value instanceof DeclaredResourceReference)
    return await resolveReferenceToCommonComparableForm(
      { reference: value },
      context,
    );

  // otherwise, it's a generic object, so resolve the references on each key
  const object: Record<string, any> = value as any;
  const resolvedObject: Record<string, any> = {};
  for (const nestedKey of Object.keys(object)) {
    const nestedValue = object[nestedKey];
    const resolvedValue = await resolveReferencesToCommonComparableForm(
      { in: nestedValue },
      context,
    );
    resolvedObject[nestedKey] = resolvedValue;
  }

  // if the object was a declared resource, then instantiate it with the same constructor and return that
  if (object instanceof DomainObject) {
    const DomainObjectConstructor = object.constructor as typeof DomainObject;
    return new DomainObjectConstructor(resolvedObject) as T;
  }

  // otherwise, return the resolved object
  return resolvedObject as T;
};
