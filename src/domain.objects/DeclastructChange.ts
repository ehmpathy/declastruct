import { type DomainEntity, DomainLiteral } from 'domain-objects';

/**
 * .what = actions that can be proposed for a resource
 * .why = clearly defines the type of change declastruct will execute
 */
export enum DeclastructChangeAction {
  /**
   * keep the resource as is
   */
  KEEP = 'KEEP',

  /**
   * create a new resource
   */
  CREATE = 'CREATE',

  /**
   * update an existing resource
   */
  UPDATE = 'UPDATE',

  /**
   * destroy an existing resource
   */
  DESTROY = 'DESTROY',

  /**
   * replace an existing resource (delete then create)
   */
  REPLACE = 'REPLACE',

  /**
   * omit from instructions (resource doesn't exist and isn't desired)
   */
  OMIT = 'OMIT',
}

/**
 * .what = describes a single change required to align remote state with desired state
 * .why = enables observable, auditable infrastructure changes
 */
export interface DeclastructChange<
  TResource extends DomainEntity<any> = DomainEntity<any>,
> {
  /**
   * which resource this change is for
   */
  forResource: {
    /**
     * class name of the resource being changed
     */
    class: string;

    /**
     * scannable identifier of this specific resource
     */
    slug: string;
  };

  /**
   * action to execute
   */
  action: DeclastructChangeAction;

  /**
   * the states of the resource
   */
  state: {
    /**
     * the desired state of the resource
     *
     * .note = null if the resource should be deleted
     */
    desired: TResource | null;

    /**
     * the remote state of the resource
     *
     * .note = null if the resource doesn't exist remotely
     */
    remote: TResource | null;

    /**
     * human-readable diff of changes
     */
    difference: string | null;
  };
}

export class DeclastructChange<
    TResource extends DomainEntity<any> = DomainEntity<any>,
  >
  extends DomainLiteral<DeclastructChange<TResource>>
  implements DeclastructChange<TResource> {}
