/* eslint-disable @typescript-eslint/ban-types */
import type { LogMethods } from 'simple-leveled-log-methods';

import { DeclaredResource } from './DeclaredResource';
import { DeclastructProviderContext } from './DeclastructProviderContext';
import { DeclastructProviderResourceRemoteStateInterface } from './DeclastructProviderResourceRemoteStateInterface';

/**
 * the class name of a declared resource
 *
 * note
 * - it is just a string, but we distinguish it with its own type for clarity when defining other types
 */
export type DeclaredResourceClassName = string;

/**
 * agent options can take any shape
 *
 * typically, agent options include
 * - credentials
 * - caching mechanisms
 * - request throttling mechanisms
 */
export type DeclastructProviderAgentOptions = {
  log: LogMethods;
};

/**
 * a provider exposes the agent, interfaces, and resource definitions required to declaratively manage resources
 */
export interface DeclastructProvider<
  AO extends DeclastructProviderAgentOptions,
> {
  /**
   * defines the options available to agents of this provider
   *
   * relevance
   * - agents act on the behalf of the user to manage their resources
   * - typically, agent options include
   *   - credentials
   *   - caching mechanisms
   *   - request throttling mechanisms
   */
  agentOptions: AO;

  /**
   * defines the interfaces exposed by the provider for managing the remote state of resources
   *
   * note
   * - specified as a "name" to "interface" lookup table, for convenient usage
   */
  interfaces: Record<
    DeclaredResourceClassName,
    DeclastructProviderResourceRemoteStateInterface<
      DeclaredResource,
      DeclastructProviderContext<AO>,
      keyof DeclaredResource,
      keyof DeclaredResource
    >
  >;

  /**
   * defines hooks that we should execute in conjunction with managing resources
   */
  hooks: {
    /**
     * a hook to run before any operations for this provider
     */
    beforeAll?: () => {};

    /**
     * a hook to run after all operations for this provider
     */
    afterAll?: () => {};
  };
}
