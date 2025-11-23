import { DomainEntity } from 'domain-objects';

import { DeclastructChange } from './DeclastructChange';
import { IsoTimestamp } from './IsoTimestamp';

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
     * file path URI to the wish file containing resources and providers
     */
    uri: string;
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
