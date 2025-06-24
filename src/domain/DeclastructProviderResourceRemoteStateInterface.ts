import { PickOne } from 'type-fns';

import { DeclaredResource } from './DeclaredResource';
import {
  DeclaredResourceClassName,
  DeclastructProviderAgentOptions,
} from './DeclastructProvider';
import { DeclastructProviderContext } from './DeclastructProviderContext';

/**
 * an interface which enables the management of the remote state of a resource
 * - capable of crud operations on the resource
 * - conforms to a standard shape for interoperability
 */
export interface DeclastructProviderResourceRemoteStateInterface<
  /**
   * the class of resource being managed by this dao
   */
  R extends DeclaredResource,
  /**
   * the shape of options given to the agent of this resource's provider
   */
  AO extends DeclastructProviderAgentOptions,
  /**
   * the names of the primary key attributes
   */
  P extends keyof R,
  /**
   * the names of the unique key attributes
   */
  U extends keyof R,
  /**
   * the shape of the resources search filter options
   */
  F extends undefined | null | Record<string, any> = undefined,
  /**
   * the shape of the resources search sort options
   */
  S extends undefined | Record<string, any | null> = undefined,
> {
  /**
   * the name of the resource this interface manages
   */
  for: DeclaredResourceClassName;

  /**
   * a method capable of finding the state of a resource of this class, by primary-key
   */
  findByPrimary: (
    /**
     * the primary key to lookup the resource by
     */
    primary: Required<Pick<R, P>>,

    /**
     * the declastruct context available to interfaces of this provider
     */
    context: DeclastructProviderContext<AO>,
  ) => Promise<Required<R> | null>;

  /**
   * a method capable of finding the state of a resource of this class, by unique-key
   */
  findByUnique: (
    /**
     * the unique key to lookup the resource by
     */
    unique: Required<Pick<R, U>>,

    /**
     * the declastruct context available to interfaces of this provider
     */
    context: DeclastructProviderContext<AO>,
  ) => Promise<Required<R> | null>;

  /**
   * a method capable of finding all instances of a resource of this class, by some filtering criteria
   *
   * note
   * - may not be supported if search is not possible
   */
  findAll?: (
    /**
     * the criteria to search with
     */
    criteria: {
      /**
       * what to filter the results to list by
       *
       * note
       * - if null is supported and specified, no filter will be applied
       */
      filter: F;

      /**
       * what to sort the results by
       *
       * note
       * - this dictates the order of results
       * - this dictates the offset key for pagination
       *
       * tip
       * - if you're seeing "never" when trying to use this, please make sure you're using the instantiated type of the resource, not the generic type
       */
      sort: PickOne<{
        /**
         * descending sort
         */
        until: S;

        /**
         * ascending sort
         */
        since: S;
      }>;

      /**
       * how many results to return
       *
       * note
       * - combine this with the sort option to paginate results
       */
      limit: number;
    },
    /**
     * the declastruct context available to interfaces of this provider
     */
    context: DeclastructProviderContext<AO>,
  ) => Promise<Required<R>[]>;

  /**
   * a method capable of creating a resource of this class
   */
  create: (
    /**
     * the state we want to create the resource with
     */
    resource: R,

    /**
     * the declastruct context available to interfaces of this provider
     */
    context: DeclastructProviderContext<AO>,
  ) => Promise<Required<R>>;

  /**
   * a method capable of destroying a resource of this class
   */
  destroy: (
    /**
     * the primary key of the resource we want to destroy
     */
    primary: Required<Pick<R, P>>,

    /**
     * the declastruct context available to interfaces of this provider
     */
    context: DeclastructProviderContext<AO>,
  ) => Promise<Required<R>>;

  /**
   * a method capable of creating a resource of this class
   *
   * note
   * - may not be supported if resource is immutable
   */
  update?: (
    /**
     * the state we want to update the resource to
     *
     * note
     * - either primary or unique key must be defined
     * - any updatable keys defined will be persisted
     */
    resource: R,

    /**
     * the declastruct context available to interfaces of this provider
     */
    context: DeclastructProviderContext<AO>,
  ) => Promise<Required<R>>;
}
