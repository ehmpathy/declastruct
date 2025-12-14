import {
  isRefByPrimary,
  isRefByUnique,
  type Ref,
  type Refable,
  type RefByPrimary,
  type RefByUnique,
} from 'domain-objects';
import { BadRequestError } from 'helpful-errors';

import { getRefByPrimary } from '../domain.operations/ref/getRefByPrimary';
import { getRefByUnique } from '../domain.operations/ref/getRefByUnique';
import type { DeclastructDao } from './DeclastructDao';

/**
 * .what = input type for genDeclastructDao without get.ref and get.one.byRef (auto-wired by factory)
 * .why = derives from DeclastructDao to stay in sync, omits auto-wired methods
 * .note = uses `| null` syntax to force explicit decision on nullable methods
 */
export type DeclastructDaoInput<
  TResourceClass extends Refable<any, any, any>,
  TContext,
> = Omit<DeclastructDao<TResourceClass, TContext>, 'get' | 'set'> & {
  get: {
    one: Omit<
      DeclastructDao<TResourceClass, TContext>['get']['one'],
      'byRef' | 'byPrimary'
    > & {
      // explicit null required for byPrimary to force conscious decision
      byPrimary:
        | ((
            input: RefByPrimary<TResourceClass>,
            context: TContext,
          ) => Promise<InstanceType<TResourceClass> | null>)
        | null;
    };
    // ref is omitted - auto-wired by factory
    // byRef is omitted - auto-composed from byUnique + byPrimary
  };
  set: Omit<
    DeclastructDao<TResourceClass, TContext>['set'],
    'upsert' | 'delete'
  > & {
    // explicit null required for upsert to force conscious decision
    upsert:
      | ((
          input: InstanceType<TResourceClass>,
          context: TContext,
        ) => Promise<InstanceType<TResourceClass>>)
      | null;
    // explicit null required for delete to force conscious decision
    delete:
      | ((input: Ref<TResourceClass>, context: TContext) => Promise<void>)
      | null;
  };
};

/**
 * .what = input type for daos with byPrimary defined
 * .why = enables overload to distinguish daos with primary key support
 */
export type DeclastructDaoInputWithPrimary<
  TResourceClass extends Refable<any, any, any>,
  TContext,
> = Omit<DeclastructDaoInput<TResourceClass, TContext>, 'get'> & {
  get: {
    one: Omit<
      DeclastructDao<TResourceClass, TContext>['get']['one'],
      'byPrimary' | 'byRef'
    > & {
      byPrimary: NonNullable<
        DeclastructDao<TResourceClass, TContext>['get']['one']['byPrimary']
      >;
    };
  };
};

/**
 * .what = input type for daos without byPrimary
 * .why = enables overload to distinguish daos without primary key support
 */
export type DeclastructDaoInputWoutPrimary<
  TResourceClass extends Refable<any, any, any>,
  TContext,
> = Omit<DeclastructDaoInput<TResourceClass, TContext>, 'get'> & {
  get: {
    one: Omit<
      DeclastructDao<TResourceClass, TContext>['get']['one'],
      'byPrimary' | 'byRef'
    > & {
      byPrimary: null;
    };
  };
};

/**
 * .what = output type for daos with ref methods defined
 * .why = enables type-safe access to ref resolution methods
 * .note = uses method syntax for bivariance (enables assignment to DeclastructDao<any>)
 */
export type DeclastructDaoWithRef<
  TResourceClass extends Refable<any, any, any>,
  TContext,
> = Omit<DeclastructDao<TResourceClass, TContext>, 'get'> & {
  get: {
    one: DeclastructDao<TResourceClass, TContext>['get']['one'];
    ref: {
      byPrimary(
        input: Ref<TResourceClass>,
        context: TContext,
      ): Promise<RefByPrimary<TResourceClass> | null>;
      byUnique(
        input: Ref<TResourceClass>,
        context: TContext,
      ): Promise<RefByUnique<TResourceClass> | null>;
    };
  };
};

/**
 * .what = output type for daos without ref methods
 * .why = ref methods are undefined when byPrimary is not supported
 */
export type DeclastructDaoWoutRef<
  TResourceClass extends Refable<any, any, any>,
  TContext,
> = Omit<DeclastructDao<TResourceClass, TContext>, 'get'> & {
  get: {
    one: DeclastructDao<TResourceClass, TContext>['get']['one'];
    ref: {
      byPrimary: undefined;
      byUnique: undefined;
    };
  };
};

/**
 * .what = factory to create DeclastructDao with auto-wired ref methods
 * .why = enforces that ref methods are defined iff byPrimary is defined
 * .note = TContext must be explicitly provided as a generic parameter to avoid hazardous Record<string, any> inference
 *
 * @overload input with byPrimary defined → output with ref methods defined
 */
export function genDeclastructDao<
  TResourceClass extends Refable<any, any, any>,
  TContext extends Record<string, any> = never, // typed as never so callers will be forced to declare the TContext explicitly
>(
  input: DeclastructDaoInputWithPrimary<TResourceClass, TContext>,
): DeclastructDaoWithRef<TResourceClass, TContext>;

/**
 * @overload input without byPrimary → output with ref methods null
 */
export function genDeclastructDao<
  TResourceClass extends Refable<any, any, any>,
  TContext extends Record<string, any> = never, // typed as never so callers will be forced to declare the TContext explicitly
>(
  input: DeclastructDaoInputWoutPrimary<TResourceClass, TContext>,
): DeclastructDaoWoutRef<TResourceClass, TContext>;

/**
 * .impl = creates dao with byRef and ref methods auto-wired based on byPrimary presence
 */
export function genDeclastructDao<
  TResourceClass extends Refable<any, any, any>,
  TContext extends Record<string, any> = never, // typed as never so callers will be forced to declare the TContext explicitly
>(
  input: DeclastructDaoInput<TResourceClass, TContext>,
): DeclastructDao<TResourceClass, TContext> {
  const hasPrimary = input.get.one.byPrimary !== null;

  // build byRef from byUnique + byPrimary
  const byRef = async (
    ref: Ref<TResourceClass>,
    context: TContext,
  ): Promise<InstanceType<TResourceClass> | null> => {
    // check primary key first (only if resource declares .primary)
    if (hasPrimary && isRefByPrimary({ of: input.dobj })(ref))
      return input.get.one.byPrimary!(ref, context);

    // check unique key
    if (isRefByUnique({ of: input.dobj })(ref))
      return input.get.one.byUnique(ref, context);

    throw new BadRequestError(
      'get.one.byRef called with neither a RefByUnique nor RefByPrimary',
      { ref },
    );
  };

  // convert null → undefined for optional methods
  const upsert = input.set.upsert ?? undefined;
  const del = input.set.delete ?? undefined;

  if (hasPrimary) {
    // auto-wire ref methods using the helper functions
    // convert null → undefined for byPrimary (input requires null, output uses undefined)
    const byPrimary = input.get.one.byPrimary ?? undefined;
    const dao: DeclastructDao<TResourceClass, TContext> = {
      ...input,
      get: {
        one: {
          byUnique: input.get.one.byUnique,
          byPrimary,
          byRef,
        },
        ref: {
          byPrimary: (ref, context) =>
            getRefByPrimary({ ref }, { dao, ...context }),
          byUnique: (ref, context) =>
            getRefByUnique({ ref }, { dao, ...context }),
        },
      },
      set: {
        findsert: input.set.findsert,
        upsert,
        delete: del,
      },
    };
    return dao;
  }

  // no primary key support - ref methods are undefined
  return {
    ...input,
    get: {
      one: {
        byUnique: input.get.one.byUnique,
        byPrimary: undefined,
        byRef,
      },
      ref: {
        byPrimary: undefined,
        byUnique: undefined,
      },
    },
    set: {
      findsert: input.set.findsert,
      upsert,
      delete: del,
    },
  };
}
