import {
  type DomainEntity,
  isRefByPrimary,
  isRefByUnique,
  type Ref,
  type Refable,
  type RefByUnique,
  refByUnique,
} from 'domain-objects';
import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';

import type { DeclastructDao } from '../../domain.objects/DeclastructDao';

/**
 * .what = resolves any ref to RefByUnique
 * .why = enables getting unique key from any ref type
 * .note = if ref is already RefByUnique, returns as-is without db call
 */
export const getRefByUnique = async <
  TResource extends DomainEntity<any>,
  TResourceClass extends Refable<any, any, any>,
  TContext extends Record<string, any>,
>(
  input: {
    ref: Ref<TResourceClass>;
  },
  context: {
    dao: DeclastructDao<TResource, TResourceClass, TContext>;
  } & TContext,
): Promise<RefByUnique<TResourceClass>> => {
  // if already RefByUnique, return as-is without db call
  if (isRefByUnique({ of: context.dao.dobj })(input.ref)) return input.ref;

  // if RefByPrimary, fetch resource and extract unique key
  if (isRefByPrimary({ of: context.dao.dobj })(input.ref)) {
    // verify dao supports byPrimary
    if (!context.dao.get.one.byPrimary)
      throw new UnexpectedCodePathError(
        'dao does not support byPrimary lookup',
        { ref: input.ref },
      );

    // fetch the resource by primary key
    const resource = await context.dao.get.one.byPrimary(input.ref, context);

    // throw if resource not found
    if (!resource)
      throw new BadRequestError('resource not found by primary ref', {
        ref: input.ref,
      });

    // extract unique key from the resource
    return refByUnique<TResourceClass>(
      resource as InstanceType<TResourceClass>,
    );
  }

  // otherwise, unexpected ref type
  throw new UnexpectedCodePathError('invalid ref type', { ref: input.ref });
};
