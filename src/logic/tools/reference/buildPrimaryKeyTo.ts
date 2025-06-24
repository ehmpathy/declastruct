import { DomainObject } from 'domain-objects';

import { CanNotBuildReferenceError } from './buildReferenceTo';
import { defineReferenceKeyConstituentsOf } from './defineReferenceKeyConstituentsOf';

/**
 * build the primary key of a resource
 */
export const buildPrimaryKeyTo = <
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
): Required<Pick<T, P>> => {
  const referenceOf = to;
  const referenceInput = using;

  // get the primary key defs for the class
  const { primary } = defineReferenceKeyConstituentsOf({
    class: referenceOf,
  });

  // assert that the resource has a primary key defined on it
  const hasPrimaryKey = primary.every((key) => key in referenceInput);
  if (!hasPrimaryKey)
    throw new CanNotBuildReferenceError({
      referenceOf,
      referenceInput,
      reason: 'the primary key is not present in the reference input',
    });

  // extract the primary key value
  const primaryKey = primary.reduce((summary, thisKeyKey) => {
    const thisKeyValue =
      referenceInput[thisKeyKey as keyof typeof referenceInput];
    return { ...summary, [thisKeyKey]: thisKeyValue };
  }, {} as Required<Pick<T, P>>);
  return primaryKey;
};
