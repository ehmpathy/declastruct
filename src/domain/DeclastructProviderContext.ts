import type { LogMethods } from 'simple-leveled-log-methods';

import { DeclaredResource } from './DeclaredResource';
import {
  DeclastructProvider,
  DeclastructProviderAgentOptions,
} from './DeclastructProvider';

/**
 * defines the context in which declastruct is being run, accessible a provider
 *
 * specifically
 * - the options that were inititialized for the provider
 * - the resources that were defined for the provider
 *
 * note
 * - we do not expose the full declastruct context to any provider for security
 *   - i.e., ProviderA will never be able to see context related to ProviderB
 *   - otherwise, MaliciousProvider may be able to access the credentials defined for CriticalProvider, and steal them
 *   - therefore, only the information explicitly given by the user to ProviderA is accessible to ProviderA
 */
export interface DeclastructProviderContext<
  AO extends DeclastructProviderAgentOptions,
> {
  /**
   * the options instantiated for the provider itself
   */
  provider: DeclastructProvider<AO>;

  /**
   * the resources for this provider that were declared in this invocation
   */
  resources?: DeclaredResource[];

  /**
   * the log context to use
   */
  log: LogMethods;
}
