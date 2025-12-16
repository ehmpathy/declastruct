import {
  isRefByPrimary,
  isRefByUnique,
  type Ref,
  type Refable,
  type RefByPrimary,
  refByPrimary,
} from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';

import type { DeclastructDao } from '@src/domain.objects/DeclastructDao';

/**
 * .what = resolves any ref to RefByPrimary
 * .why = enables getting primary key from any ref type
 * .note = if ref is already RefByPrimary, returns as-is without db call
 */
export const getRefByPrimary = async <
  TResourceClass extends Refable<any, any, any>,
  TContext extends Record<string, any>,
>(
  input: {
    ref: Ref<TResourceClass>;
  },
  context: {
    dao: DeclastructDao<TResourceClass, TContext>;
  } & TContext,
): Promise<RefByPrimary<TResourceClass> | null> => {
  // if already RefByPrimary, return as-is without db call
  if (isRefByPrimary({ of: context.dao.dobj })(input.ref)) return input.ref;

  // if RefByUnique, fetch resource and extract primary key
  if (isRefByUnique({ of: context.dao.dobj })(input.ref)) {
    // fetch the resource by unique key
    const resource = await context.dao.get.one.byUnique(input.ref, context);

    // return null if resource not found (resource may not exist yet)
    if (!resource) return null;

    // extract primary key from the resource
    return refByPrimary<TResourceClass>(resource);
  }

  // otherwise, unexpected ref type
  throw new UnexpectedCodePathError('invalid ref type', { ref: input.ref });
};
