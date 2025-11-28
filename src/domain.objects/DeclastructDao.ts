import {
  type DomainEntity,
  DomainLiteral,
  type Ref,
  type Refable,
  type RefByPrimary,
  type RefByUnique,
} from 'domain-objects';
import { type HasMetadata } from 'type-fns';

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
  get: {
    /**
     * required - fetch by unique keys (enables idempotency)
     */
    byUnique(
      input: RefByUnique<TResourceClass>,
      context: TContext,
    ): Promise<TResource | null>;

    /**
     * optional - fetch by primary keys (if resource supports them)
     */
    byPrimary?(
      input: RefByPrimary<TResourceClass>,
      context: TContext,
    ): Promise<TResource | null>;

    /**
     * required - fetch by any supported reference type
     */
    byRef(
      input: Ref<TResourceClass>,
      context: TContext,
    ): Promise<TResource | null>;
  };

  set: {
    /**
     * required - find or insert resource (idempotent create)
     */
    finsert(
      input: TResource,
      context: TContext,
    ): Promise<HasMetadata<TResource>>;

    /**
     * optional - create or update resource (idempotent upsert)
     */
    upsert?(
      input: TResource,
      context: TContext,
    ): Promise<HasMetadata<TResource>>;

    /**
     * optional - delete resource
     */
    delete?(input: Ref<TResourceClass>, context: TContext): Promise<void>;
  };
}

export class DeclastructDao<
    TResource extends DomainEntity<any>,
    TResourceClass extends Refable<any, any, any>,
    TContext,
  >
  extends DomainLiteral<DeclastructDao<TResource, TResourceClass, TContext>>
  implements DeclastructDao<TResource, TResourceClass, TContext> {}
