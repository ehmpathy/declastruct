import { DomainEntity, DomainObject } from 'domain-objects';

import { DeclaredResourceReference } from '../../../domain/DeclaredResourceReference';
import {
  buildReferenceTo,
  CanNotBuildReferenceError,
} from './buildReferenceTo';

export class CanNotReferenceDeclaredResourceError extends Error {
  constructor({
    resource,
    reason,
  }: {
    resource: DomainObject<any>;
    reason: string;
  }) {
    super(
      `
Can not reference declared resource ${
        resource.constructor?.name
          ? `of class '${resource.constructor.name}'`
          : ''
      } because ${reason}.

resource
${JSON.stringify(resource, null, 2)}
    `.trim(),
    );
  }
}
/**
 * returns a reference to a resource
 * - uses the primary key if possible
 * - uses the unique key otherwise
 *
 * note
 * - this is a convinience wrapper for the function `buildReferenceTo`
 */
export const getReferenceTo = <
  T extends DomainObject<any>,
  /**
   * the names of the primary key attributes
   */
  P extends keyof T,
  /**
   * the names of the unique key attributes
   */
  U extends keyof T,
>(
  resource: T,
): DeclaredResourceReference<T, P, U> => {
  // confirm that it is an instance of a domain object
  if (!(resource instanceof DomainObject))
    throw new CanNotReferenceDeclaredResourceError({
      resource,
      reason: 'the resource is not an instance of a DomainObject class',
    });

  // confirm that it is an instance of a domain entity
  if (!(resource instanceof DomainEntity))
    throw new CanNotReferenceDeclaredResourceError({
      resource,
      reason:
        'the resource is not an instance of a DomainEntity class. only Entities have distinct state of their own',
    });

  // try to build the reference
  try {
    return buildReferenceTo(resource.constructor as any, resource);
  } catch (error: any) {
    if (error instanceof CanNotBuildReferenceError)
      throw new CanNotReferenceDeclaredResourceError({
        resource,
        reason:
          'neither the primary key nor unique key is present in the resource',
      });
    throw error; // otherwise, forward the error
  }
};

export { getReferenceTo as getRef };
