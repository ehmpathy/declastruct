import type { LogMethods } from 'simple-leveled-log-methods';

import { DeclaredResource } from './DeclaredResource';
import { DeclastructProvider } from './DeclastructProvider';

/**
 * the declastruct context defines all of the providers and resources declared by the user
 *
 * note:
 * - this is the global context available to declastruct methods
 * - this is _not_ the provider context available to provider methods
 */
export interface DeclastructContext {
  /**
   * the providers loaded by the user
   */
  providers: DeclastructProvider<any>[];

  /**
   * all of the resources declared by the user
   */
  resources: DeclaredResource[];

  /**
   * the log context to use
   */
  log: LogMethods;
}
