import { DomainLiteral } from 'domain-objects';

import { DeclastructDao } from './DeclastructDao';

export type DeclastructDaosShape<TContext> = Record<
  string,
  DeclastructDao<any, any, TContext>
>;

/**
 * .what = bundles all DAOs and lifecycle hooks for a specific infrastructure provider
 * .why = enables plug-and-play support for different infrastructure backends (AWS, GCP, Azure, etc)
 */
export interface DeclastructProvider<
  TDeclastructDaos extends DeclastructDaosShape<TContext> = DeclastructDaosShape<any>,
  TContext = any,
> {
  /**
   * unique name identifying this provider
   */
  name: string;

  /**
   * map of resource class names to their DAOs
   */
  daos: TDeclastructDaos;

  /**
   * provider-specific context (credentials, region, etc)
   */
  context: TContext;

  /**
   * lifecycle hooks for setup and teardown
   */
  hooks: {
    beforeAll: () => Promise<void>;
    afterAll: () => Promise<void>;
  };
}

export class DeclastructProvider<
    TDeclastructDaos extends DeclastructDaosShape<TContext> = DeclastructDaosShape<any>,
    TContext = any,
  >
  extends DomainLiteral<DeclastructProvider<TDeclastructDaos, TContext>>
  implements DeclastructProvider<TDeclastructDaos, TContext> {}
