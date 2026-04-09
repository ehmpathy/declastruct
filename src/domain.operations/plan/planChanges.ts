import {
  type DomainEntity,
  getUniqueIdentifierSlug,
  serialize,
} from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';
import type { ContextLogTrail } from 'simple-log-methods';

import type { ContextDeclastruct } from '@src/domain.objects/ContextDeclastruct';
import type { ContextDeclastructCli } from '@src/domain.objects/ContextDeclastructCli';
import { DeclastructChangeAction } from '@src/domain.objects/DeclastructChange';
import { DeclastructPlan } from '@src/domain.objects/DeclastructPlan';
import type { DeclastructProvider } from '@src/domain.objects/DeclastructProvider';
import {
  DeclastructSnapshot,
  DeclastructSnapshotEntry,
} from '@src/domain.objects/DeclastructSnapshot';
import { isMarkedForDeletion } from '@src/domain.operations/del/del';
import { asIndentedLines } from '@src/infra/asIndentedLines';
import { asIsoTimestamp } from '@src/infra/asIsoTimestamp';
import { colorizeAction } from '@src/infra/colorizeAction';
import { withSpinner } from '@src/infra/withSpinner';

import { computeChange } from './computeChange';
import { getDaoByResource } from './getDaoByResource';
import { hashChanges } from './hashChanges';

/**
 * .what = checks if all changes are KEEP (no actions required)
 * .why = determines whether to show "all in sync" message
 */
const isAllInSync = (input: {
  changes: { action: DeclastructChangeAction }[];
}): boolean => {
  return input.changes.every(
    (change) => change.action === DeclastructChangeAction.KEEP,
  );
};

/**
 * .what = generates a plan of changes required to achieve desired state
 * .why = enables users to review infrastructure changes before applying them
 * .note = idempotent - calling multiple times produces the same plan
 */
export const planChanges = async (
  input: {
    resources: DomainEntity<any>[];
    providers: DeclastructProvider<any, any>[];
    wishFilePath: string;
  },
  context: ContextLogTrail & ContextDeclastruct & ContextDeclastructCli,
): Promise<{ plan: DeclastructPlan; snapshot: DeclastructSnapshot }> => {
  // log plan phase header
  context.log.info('🔮 plan changes...');
  context.log.info('');

  // extract bottleneck for planning
  const bottleneck =
    'onPlan' in context.bottleneck
      ? context.bottleneck.onPlan
      : context.bottleneck;

  // capture observation timestamp (before any API calls)
  const observedAt = asIsoTimestamp(new Date());

  // compute change for each resource with real-time output
  const changes = [];
  const snapshotRemote: DeclastructSnapshotEntry[] = [];
  const snapshotWished: DeclastructSnapshotEntry[] = [];
  for (const resource of input.resources) {
    const change = await bottleneck.schedule(async () => {
      // find DAO and provider context for this resource
      const { dao, context: providerContext } = getDaoByResource({
        resource,
        providers: input.providers,
      });

      // log the resource being planned
      context.log.info(`○ ${getUniqueIdentifierSlug(resource)}`);

      // fetch current remote state using provider context with spinner
      const { result: remoteState, durationMs } = await withSpinner({
        message: 'inflight',
        operation: () => dao.get.one.byUnique(resource, providerContext),
      });

      // log done (replaces spinner)
      const durationSec = (durationMs / 1000).toFixed(2);
      context.log.info(`   ├─ ✔ done in ${durationSec}s`);

      // determine desired state - null if marked for deletion
      const desiredState = isMarkedForDeletion(resource) ? null : resource;

      // collect snapshot entry BEFORE omitReadonly (for debug and audit)
      const forResource = {
        class: resource.constructor.name,
        slug: UnexpectedCodePathError.wrap(
          () => getUniqueIdentifierSlug(resource),
          {
            message: 'failed to getUniqueIdentifierSlug for snapshot',
            metadata: {
              resource,
              ctor: resource.constructor.name,
            },
          },
        )(),
      };
      snapshotRemote.push(
        new DeclastructSnapshotEntry({
          forResource,
          state: remoteState ? JSON.parse(serialize(remoteState)) : null,
        }),
      );
      snapshotWished.push(
        new DeclastructSnapshotEntry({
          forResource,
          state: JSON.parse(serialize(resource)), // always the declared resource, not desiredState
        }),
      );

      // compute change
      const computed = computeChange({
        desired: desiredState,
        remote: remoteState,
      });

      // skip if nothing to track (resource doesn't exist and isn't desired)
      if (!computed) {
        context.log.info(
          `   └─ decision ${colorizeAction(DeclastructChangeAction.OMIT)}`,
        );
        context.log.info('');
        return null;
      }

      // log decision
      context.log.info(`   └─ decision ${colorizeAction(computed.action)}`);

      // and the diff too, indented to align with tree
      if (computed.state.difference) {
        const indentedDiff = asIndentedLines({
          text: computed.state.difference,
          indent: '      ',
        });
        context.log.info(indentedDiff);
      }
      context.log.info('');

      return computed;
    });
    if (change) changes.push(change);
  }

  // log success message if everything is in sync
  if (isAllInSync({ changes })) {
    context.log.info('');
    context.log.info('🎉 everything is in sync!');
  }

  // build plan
  const plan = new DeclastructPlan({
    hash: hashChanges(changes),
    createdAt: asIsoTimestamp(new Date()),
    wish: {
      uri: input.wishFilePath,
      argv: context.passthrough.argv,
    },
    changes,
  });

  // build snapshot
  const snapshot = new DeclastructSnapshot({
    observedAt,
    remote: snapshotRemote,
    wished: snapshotWished,
  });

  return { plan, snapshot };
};
