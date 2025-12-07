import {
  type DomainEntity,
  DomainLiteral,
  type Ref,
  type Refable,
  type RefByPrimary,
  type RefByUnique,
} from 'domain-objects';
import type { HasMetadata } from 'type-fns';

/**
 * .what = standardized data access interface for any resource type
 *
 * .why = enforces idempotent semantics and consistent access patterns across all providers
 *
 * .note =
 *   - TResourceClass is the class constructor (e.g., typeof MyResource) with static unique/primary properties
 *   - uses method syntax in the get & set for bivariance, to enable assignment to DeclastructDao<any, any, any>
 */
export interface DeclastructDao<
  TResource extends DomainEntity<any>,
  TResourceClass extends Refable<any, any, any>,
  TContext = never,
> {
  /**
   * .what = the domain object class this dao operates on
   * .why = enables downstream operations (like getRefByPrimary) to access static properties
   */
  dobj: TResourceClass;

  /**
   * .what = read operations for fetching resources and resolving refs
   * .why = provides consistent, type-safe access to remote state
   */
  get: {
    /**
     * .what = fetch a single resource by reference
     * .why = enables looking up current state of a resource
     */
    one: {
      /**
       * .what = fetch by unique keys
       * .why = enables idempotent lookups via natural keys
       */
      byUnique(
        input: RefByUnique<TResourceClass>,
        context: TContext,
      ): Promise<TResource | null>;

      /**
       * .what = fetch by primary keys
       * .why = enables efficient lookups when primary key is known
       *
       * .note = set to null if resource lacks primary keys (forces explicit decision)
       */
      byPrimary:
        | null
        | ((
            input: RefByPrimary<TResourceClass>,
            context: TContext,
          ) => Promise<TResource | null>);

      /**
       * .what = fetch by any supported reference type
       * .why = enables flexible lookups when ref type is not known at compile time
       */
      byRef(
        input: Ref<TResourceClass>,
        context: TContext,
      ): Promise<TResource | null>;
    };

    /**
     * .what = ref resolution utilities for converting between ref types
     * .why = enables working with generic Ref<T> while resolving to specific RefByPrimary/RefByUnique when needed
     *
     * .note = set methods to null if resource lacks primary keys (forces explicit decision)
     */
    ref: {
      /**
       * .what = resolve any ref to RefByPrimary
       * .why = enables getting primary key from any ref type
       *
       * .note = set to null if resource lacks primary keys
       */
      byPrimary:
        | null
        | ((
            input: Ref<TResourceClass>,
            context: TContext,
          ) => Promise<RefByPrimary<TResourceClass>>);

      /**
       * .what = resolve any ref to RefByUnique
       * .why = enables getting unique key from any ref type
       *
       * .note = set to null if resource lacks primary keys
       */
      byUnique:
        | null
        | ((
            input: Ref<TResourceClass>,
            context: TContext,
          ) => Promise<RefByUnique<TResourceClass>>);
    };
  };

  /**
   * .what = write operations for mutating resources
   * .why = provides idempotent, type-safe mutations to remote state
   */
  set: {
    /**
     * .what = find or insert resource
     * .why = idempotent create - returns existing if found by unique keys, otherwise creates
     */
    finsert(
      input: TResource,
      context: TContext,
    ): Promise<HasMetadata<TResource>>;

    /**
     * .what = create or update resource
     * .why = idempotent upsert - creates if not found, updates if found
     *
     * .note = set to null if resource does not support updates
     */
    upsert:
      | null
      | ((
          input: TResource,
          context: TContext,
        ) => Promise<HasMetadata<TResource>>);

    /**
     * .what = delete resource
     * .why = removes resource from remote state
     *
     * .note = set to null if resource does not support deletion
     */
    delete:
      | null
      | ((input: Ref<TResourceClass>, context: TContext) => Promise<void>);
  };
}

export class DeclastructDao<
    TResource extends DomainEntity<any>,
    TResourceClass extends Refable<any, any, any>,
    TContext,
  >
  extends DomainLiteral<DeclastructDao<TResource, TResourceClass, TContext>>
  implements DeclastructDao<TResource, TResourceClass, TContext> {}
