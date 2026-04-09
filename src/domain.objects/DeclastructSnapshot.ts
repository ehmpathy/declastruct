import { DomainLiteral } from 'domain-objects';

import type { IsoTimestamp } from './IsoTimestamp';

/**
 * .what = a single entry in a snapshot, captures state for one resource
 * .why = enables debug and audit of what declastruct observed for each resource
 */
export interface DeclastructSnapshotEntry {
  /**
   * which resource this entry is for
   */
  forResource: {
    /**
     * class name of the resource
     */
    class: string;

    /**
     * scannable identifier of this specific resource
     */
    slug: string;
  };

  /**
   * serialized state of the resource
   *
   * .note = null if the resource does not exist remotely (for remote[])
   * .note = contains _dobj stamp from serialize()
   */
  state: Record<string, any> | null;
}

export class DeclastructSnapshotEntry
  extends DomainLiteral<DeclastructSnapshotEntry>
  implements DeclastructSnapshotEntry {}

/**
 * .what = snapshot of remote and wished state at plan time
 * .why = enables debug and audit of what declastruct observed before diff
 */
export interface DeclastructSnapshot {
  /**
   * timestamp when the snapshot was taken
   */
  observedAt: IsoTimestamp;

  /**
   * remote state for each resource (before omitReadonly)
   */
  remote: DeclastructSnapshotEntry[];

  /**
   * wished state for each resource (what user declared)
   */
  wished: DeclastructSnapshotEntry[];
}

export class DeclastructSnapshot
  extends DomainLiteral<DeclastructSnapshot>
  implements DeclastructSnapshot
{
  public static nested = {
    remote: DeclastructSnapshotEntry,
    wished: DeclastructSnapshotEntry,
  };
}
