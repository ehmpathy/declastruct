import {
  isRefByPrimary,
  isRefByUnique,
  type Ref,
  type Refable,
  type RefByUnique,
  refByUnique,
} from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';

import type { DeclastructDao } from '@src/domain.objects/DeclastructDao';

/**
 * .what = resolves any ref to RefByUnique
 * .why = enables getting unique key from any ref type
 * .note = if ref is already RefByUnique, returns as-is without db call
 */
export const getRefByUnique = async <
  TResourceClass extends Refable<any, any, any>,
  TContext extends Record<string, any>,
>(
  input: {
    ref: Ref<TResourceClass>;
  },
  context: {
    dao: DeclastructDao<TResourceClass, TContext>;
  } & TContext,
): Promise<RefByUnique<TResourceClass> | null> => {
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

    // return null if resource not found (resource may not exist yet)
    if (!resource) return null;

    // extract unique key from the resource
    return refByUnique<TResourceClass>(resource);
  }

  // otherwise, unexpected ref type
  throw new UnexpectedCodePathError('invalid ref type', { ref: input.ref });
};
