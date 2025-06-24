import { DomainObject } from 'domain-objects';

import {
  DeclaredResourceReference,
  DeclaredResourceReferenceKeyType,
} from '../../../domain/DeclaredResourceReference';
import { buildPrimaryKeyTo } from './buildPrimaryKeyTo';
import { buildUniqueKeyTo } from './buildUniqueKeyTo';
import { defineReferenceClassOf } from './defineReferenceClassOf';
import { defineReferenceKeyConstituentsOf } from './defineReferenceKeyConstituentsOf';

export class CanNotReferenceDeclaredResourceClassError extends Error {
  constructor({
    class: ofClass,
    reason,
  }: {
    class: typeof DomainObject;
    reason: string;
  }) {
    super(
      `
Can not reference declared resource of class '${ofClass.name}'. Instances of the class '${ofClass.name}' can not be referenced because ${reason}.
    `.trim(),
    );
  }
}

export class CanNotBuildReferenceError extends Error {
  constructor({
    referenceInput,
    referenceOf,
    reason,
  }: {
    referenceInput: any;
    referenceOf: any;
    reason: string;
  }) {
    super(
      `
Can not build reference ${
        referenceOf?.name ? `to class '${referenceOf.name}'` : ''
      } because ${reason}.

referenceInput
${JSON.stringify(referenceInput, null, 2)}
    `.trim(),
    );
  }
}

/**
 * build a reference to a resource of a particular class using a supported key
 * - uses the unique key if possible
 * - uses the primary key otherwise
 *
 * note
 * - we prefer unique key over primary key because
 *   - it encodes the most information
 *   - it is always available for resources
 *   - it is the common comparable form of reference
 */
export const buildReferenceTo = <
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
  /**
   * the key we are attempting to build a reference with
   */
  K extends Partial<T>,
>(
  /**
   * the class this is a reference to
   */
  to: C,

  /**
   * the data to build the reference with
   */
  using: K,

  /**
   * the class to instantiate the reference with
   * - defaults to the generic DeclaredResourceReference class
   * - allows using a more specific subclass if one was created
   */
  as?: new (
    props: DeclaredResourceReference<T, P, U>,
  ) => DeclaredResourceReference<T, P, U>,
): DeclaredResourceReference<T, P, U> => {
  const referenceOf = to;
  const referenceInput = using;
  const ReferenceConstructor =
    as ??
    defineReferenceClassOf({ class: referenceOf }) ??
    DeclaredResourceReference; // todo: start throwing errors if reference is not explicitly declared on the source class; using DeclaredResourceError produces hydration and serialization errors for "alternatives" types

  // get the unique and unique key defs for the class
  const { unique, primary } = defineReferenceKeyConstituentsOf({
    class: referenceOf,
  });

  // if unique key is defined, reference by unique key
  const hasUniqueKey = unique.every((key) => key in referenceInput);
  if (hasUniqueKey)
    return new ReferenceConstructor({
      referenceOf: referenceOf.name,
      identifiedBy: {
        key: DeclaredResourceReferenceKeyType.UNIQUE_KEY,
        value: buildUniqueKeyTo(referenceOf, referenceInput),
      },
    }) as DeclaredResourceReference<T, P, U>;

  // if primary key is defined, reference by primary key
  const hasPrimaryKey = primary.every((key) => key in referenceInput);
  if (hasPrimaryKey)
    return new ReferenceConstructor({
      referenceOf: referenceOf.name,
      identifiedBy: {
        key: DeclaredResourceReferenceKeyType.PRIMARY_KEY,
        value: buildPrimaryKeyTo(referenceOf, referenceInput),
      },
    }) as DeclaredResourceReference<T, P, U>;

  // if has neither, then the reference can not be made
  throw new CanNotBuildReferenceError({
    referenceOf,
    referenceInput,
    reason:
      'neither the primary key nor unique key is present in the reference key',
  });
};

export { buildReferenceTo as buildRef };
