import { DomainObject } from 'domain-objects';
import { isAFunction } from 'type-fns';

import { DeclaredResourceReference } from '../../../domain/DeclaredResourceReference';
import { CanNotReferenceDeclaredResourceClassError } from './defineReferenceKeyConstituentsOf';

export const defineReferenceClassOf = <
  /**
   * the type of the domain object
   */
  T extends DomainObject<any>,
  /**
   * the class of the domain object
   */
  C extends new (props: T) => T,
  /**
   * the names of the primary key attributes
   */
  P extends keyof T,
  /**
   * the names of the unique key attributes
   */
  U extends keyof T,
>({
  class: ofClass,
}: {
  class: C;
}):
  | (new (
      props: DeclaredResourceReference<T, P, U>,
    ) => DeclaredResourceReference<T, P, U>)
  | null => {
  // grab the reference spec, if any
  const referenceSpec = (ofClass as any).reference;
  if (!referenceSpec) return null;

  // if its a function, call it to get the reference spec
  const referenceSpecResolved = isAFunction(referenceSpec)
    ? referenceSpec()
    : referenceSpec;

  // assert that the reference spec is a valid reference spec
  if (!(referenceSpecResolved.prototype instanceof DeclaredResourceReference))
    throw new CanNotReferenceDeclaredResourceClassError({
      class: ofClass as any as typeof DomainObject,
      reason: `${ofClass.name}.reference was defined but not as an instance of DeclaredResourceReference`,
    });

  return referenceSpecResolved;
};
