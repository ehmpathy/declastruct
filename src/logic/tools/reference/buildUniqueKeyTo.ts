import { DomainObject } from 'domain-objects';

import { CanNotBuildReferenceError } from './buildReferenceTo';
import { defineReferenceKeyConstituentsOf } from './defineReferenceKeyConstituentsOf';

/**
 * build the unique key of the resource
 */
export const buildUniqueKeyTo = <
  /**
   * the type of the domain object
   */
  T extends DomainObject<any>,
  /**
   * the class of the domain object
   */
  C extends new (props: T) => T,
  /**
   * the names of the unique key attributes
   */
  U extends keyof T,
  /**
   * the key we are attempting to build a reference with
   */
  K extends Partial<T> | Required<Pick<T, U>>,
>(
  /**
   * the class this is a reference to
   */
  to: C,

  /**
   * the data to build the reference with
   */
  using: K,
): Required<Pick<T, U>> => {
  const referenceOf = to;
  const referenceInput = using;

  // get the unique key defs for the class
  const { unique } = defineReferenceKeyConstituentsOf({
    class: referenceOf,
  });

  // assert that the resource has a unique key defined on it
  const hasUniqueKey = unique.every((key) => key in referenceInput);
  if (!hasUniqueKey)
    throw new CanNotBuildReferenceError({
      referenceOf,
      referenceInput,
      reason: 'the unique key is not present in the reference input',
    });

  // extract the unique key value
  const uniqueKey = unique.reduce((summary, thisKeyKey) => {
    const thisKeyValue =
      referenceInput[thisKeyKey as keyof typeof referenceInput];
    return { ...summary, [thisKeyKey]: thisKeyValue };
  }, {} as Required<Pick<T, U>>);
  return uniqueKey;
};
