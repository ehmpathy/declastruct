import { DomainEntity } from 'domain-objects';

import type { DeclastructChange } from './DeclastructChange';
import type { IsoTimestamp } from './IsoTimestamp';

/**
 * .what = collection of all planned changes required to fulfill a wish
 * .why = enables review, version control, and validation of infrastructure changes
 */
export interface DeclastructPlan {
  /**
   * hash of the proposed changes (for validation on apply)
   */
  hash: string;

  /**
   * timestamp when plan was created
   */
  createdAt: IsoTimestamp;

  /**
   * reference to the wish file
   */
  wish: {
    /**
     * file path URI to the wish file
     */
    uri: string;

    /**
     * args passed via -- separator at plan time
     *
     * .why = apply must replay these to get same resources for staleness check
     */
    argv: string[];
  };

  /**
   * all proposed changes
   */
  changes: DeclastructChange[];
}

export class DeclastructPlan
  extends DomainEntity<DeclastructPlan>
  implements DeclastructPlan
{
  public static primary = ['hash'] as const;
  public static unique = ['hash'] as const;
  public static updatable = [] as const;
}
