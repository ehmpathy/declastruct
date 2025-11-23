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
export const applyChange = async ({
  resource,
  change,
  providers,
}: {
  resource: DomainEntity<any>;
  change: DeclastructChange;
  providers: DeclastructProvider<any, any>[];
}): Promise<DeclastructChange> => {
  // skip KEEP actions immediately
  if (change.action === DeclastructChangeAction.KEEP) return change;

  // validate that the name of the resource and on the change is the same
  if (resource.constructor.name !== change.forResource.class)
    throw new UnexpectedCodePathError(
      'why were we asked to apply a change on an unrelated resource?',
      { resource, change },
    );

  // find DAO and provider context for this resource
  const { dao, context: providerContext } = getDaoByResource({
    resource,
    providers,
  });

  // execute action based on change type
  switch (change.action) {
    case DeclastructChangeAction.CREATE:
      // create new resource using provider context
      await dao.set.finsert(
        change.state.desired ??
          UnexpectedCodePathError.throw(
            'expected change.state.desired for CREATE',
            { change },
          ),
        providerContext,
      );
      return change;

    case DeclastructChangeAction.UPDATE:
      // update existing resource using provider context
      if (!dao.set.upsert) {
        throw new UnexpectedCodePathError('DAO does not support updates', {
          resourceClassName: change.forResource.class,
        });
      }
      await dao.set.upsert(
        change.state.desired ??
          UnexpectedCodePathError.throw(
            'expected change.state.desired for UPDATE',
            { change },
          ),
        providerContext,
      );
      return change;

    case DeclastructChangeAction.DESTROY:
      // delete resource using provider context
      if (!dao.set.delete) {
        throw new UnexpectedCodePathError('DAO does not support deletes', {
          resourceClassName: change.forResource.class,
        });
      }
      await dao.set.delete(
        change.state.remote ??
          UnexpectedCodePathError.throw(
            'expected change.state.remote for DESTROY',
            { change },
          ),
        providerContext,
      );
      return change;

    case DeclastructChangeAction.REPLACE:
      // delete then create using provider context
      if (!dao.set.delete) {
        throw new UnexpectedCodePathError('DAO does not support deletes', {
          resourceClassName: change.forResource.class,
        });
      }
      await dao.set.delete(
        change.state.remote ??
          UnexpectedCodePathError.throw(
            'expected change.state.remote for REPLACE',
            { change },
          ),
        providerContext,
      );
      await dao.set.finsert(
        change.state.desired ??
          UnexpectedCodePathError.throw(
            'expected change.state.desired for REPLACE',
            { change },
          ),
        providerContext,
      );
      return change;

    default:
      throw new UnexpectedCodePathError('unknown change action', {
        action: change.action,
      });
  }
};
