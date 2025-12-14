import {
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
 *   - uses method syntax in the get & set for bivariance, to enable assignment to DeclastructDao<any, any>
 */
export interface DeclastructDao<
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
      ): Promise<InstanceType<TResourceClass> | null>;

      /**
       * .what = fetch by primary keys
       * .why = enables efficient lookups when primary key is known
       *
       * .note = undefined if resource lacks primary keys; would be null, but that breaks bivariance
       */
      byPrimary?(
        input: RefByPrimary<TResourceClass>,
        context: TContext,
      ): Promise<InstanceType<TResourceClass> | null>;

      /**
       * .what = fetch by any supported reference type
       * .why = enables flexible lookups when ref type is not known at compile time
       */
      byRef(
        input: Ref<TResourceClass>,
        context: TContext,
      ): Promise<InstanceType<TResourceClass> | null>;
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
       * .note = undefined if resource lacks primary keys; would be null, but that breaks bivariance
       */
      byPrimary?(
        input: Ref<TResourceClass>,
        context: TContext,
      ): Promise<RefByPrimary<TResourceClass> | null>;

      /**
       * .what = resolve any ref to RefByUnique
       * .why = enables getting unique key from any ref type
       *
       * .note = undefined if resource lacks primary keys; would be null, but that breaks bivariance
       */
      byUnique?(
        input: Ref<TResourceClass>,
        context: TContext,
      ): Promise<RefByUnique<TResourceClass> | null>;
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
    findsert(
      input: InstanceType<TResourceClass>,
      context: TContext,
    ): Promise<HasMetadata<InstanceType<TResourceClass>>>;

    /**
     * .what = create or update resource
     * .why = idempotent upsert - creates if not found, updates if found
     *
     * .note = undefined if resource does not support updates; would be null, but that breaks bivariance
     */
    upsert?(
      input: InstanceType<TResourceClass>,
      context: TContext,
    ): Promise<HasMetadata<InstanceType<TResourceClass>>>;

    /**
     * .what = delete resource
     * .why = removes resource from remote state
     *
     * .note = undefined if resource does not support deletion; would be null, but that breaks bivariance
     */
    delete?(input: Ref<TResourceClass>, context: TContext): Promise<void>;
  };
}

export class DeclastructDao<
    TResourceClass extends Refable<any, any, any>,
    TContext,
  >
  extends DomainLiteral<DeclastructDao<TResourceClass, TContext>>
  implements DeclastructDao<TResourceClass, TContext> {}
