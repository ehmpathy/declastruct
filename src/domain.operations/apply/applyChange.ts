import { DomainEntity } from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';

import {
  DeclastructChange,
  DeclastructChangeAction,
} from '../../domain.objects/DeclastructChange';
import { DeclastructProvider } from '../../domain.objects/DeclastructProvider';
import { getDaoByResource } from '../plan/getDaoByResource';

/**
 * .what = applies a single change to infrastructure
 * .why = executes the actual infrastructure modification
 * .note = different actions require different DAO methods; fails fast if method not available
 */
export const applyChange = async <TContext = any>({
  resource,
  change,
  providers,
  context,
}: {
  resource: DomainEntity<any>;
  change: DeclastructChange;
  providers: DeclastructProvider<any, TContext>[];
  context: TContext;
}): Promise<DeclastructChange> => {
  // skip KEEP actions immediately
  if (change.action === DeclastructChangeAction.KEEP) return change;

  // validate that the name of the resource and on the change is the same
  if (resource.constructor.name !== change.forResource.class)
    throw new UnexpectedCodePathError(
      'why were we asked to apply a change on an unrelated resource?',
      { resource, change },
    );

  const dao = getDaoByResource({
    resource,
    providers,
  });

  // execute action based on change type
  switch (change.action) {
    case DeclastructChangeAction.CREATE:
      // create new resource
      await dao.set.finsert(change.state.desired!, context);
      return change;

    case DeclastructChangeAction.UPDATE:
      // update existing resource
      if (!dao.set.upsert) {
        throw new UnexpectedCodePathError('DAO does not support updates', {
          resourceClassName: change.forResource.class,
        });
      }
      await dao.set.upsert(change.state.desired!, context);
      return change;

    case DeclastructChangeAction.DESTROY:
      // delete resource
      if (!dao.set.delete) {
        throw new UnexpectedCodePathError('DAO does not support deletes', {
          resourceClassName: change.forResource.class,
        });
      }
      await dao.set.delete(change.state.remote as any, context);
      return change;

    case DeclastructChangeAction.REPLACE:
      // delete then create
      if (!dao.set.delete) {
        throw new UnexpectedCodePathError('DAO does not support deletes', {
          resourceClassName: change.forResource.class,
        });
      }
      await dao.set.delete(change.state.remote as any, context);
      await dao.set.finsert(change.state.desired!, context);
      return change;

    default:
      throw new UnexpectedCodePathError('unknown change action', {
        action: change.action,
      });
  }
};
