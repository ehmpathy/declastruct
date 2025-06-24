import { DomainObject } from 'domain-objects';

import { DeclaredResource } from './DeclaredResource';

/**
 * an action that can be proposed
 */
export enum DeclastructChangeProposalAction {
  /**
   * do nothing, the resource is already in the desired state
   */
  DO_NOTHING = 'DO_NOTHING',

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
   * replace an existing resource
   *
   * note
   * - this is a `delete` followed by a `create`
   */
  REPLACE = 'REPLACE',
}

/**
 * a change that declastruct has proposed in order to update the remote state to reflect the declared state
 */
export interface DeclastructChangeProposal<R extends DeclaredResource> {
  /**
   * the name of the class of resource this proposal is for
   */
  forResourceClassName: string;

  /**
   * the grokable identity string of the resource this proposal is for
   */
  forGrokableIdentifier: string;

  /**
   * the remote-state the resource is currently in, from which we will be changing it
   */
  fromRemoteState: R | null;

  /**
   * the desired-state the resource should be in, to which we will be changing it
   */
  toDesiredState: R | null;

  /**
   * the action we plan to execute in order to fulfil this proposed change
   */
  action: DeclastructChangeProposalAction;

  /**
   * the displayable difference made by the change
   */
  difference: string | null;
}

export class DeclastructChangeProposal<R extends DeclaredResource>
  extends DomainObject<DeclastructChangeProposal<R>>
  implements DeclastructChangeProposal<R> {}
