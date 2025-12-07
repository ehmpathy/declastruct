import { type DomainEntity, getUniqueIdentifierSlug } from 'domain-objects';
import type { ContextLogTrail } from 'simple-log-methods';

import type { ContextDeclastruct } from '../../domain.objects/ContextDeclastruct';
import { DeclastructChangeAction } from '../../domain.objects/DeclastructChange';
import { DeclastructPlan } from '../../domain.objects/DeclastructPlan';
import type { DeclastructProvider } from '../../domain.objects/DeclastructProvider';
import { asIsoTimestamp } from '../../infra/asIsoTimestamp';
import { colorizeAction } from '../../infra/colorizeAction';
import { withSpinner } from '../../infra/withSpinner';
import { computeChange } from './computeChange';
import { getDaoByResource } from './getDaoByResource';
import { hashChanges } from './hashChanges';

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
  context: ContextLogTrail & ContextDeclastruct,
): Promise<DeclastructPlan> => {
  // log plan phase header
  context.log.info('🔮 plan changes...');
  context.log.info('');

  // extract bottleneck for planning
  const bottleneck =
    'onPlan' in context.bottleneck
      ? context.bottleneck.onPlan
      : context.bottleneck;

  // compute change for each resource with real-time logging
  const changes = [];
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

      // compute change
      const computed = computeChange({
        desired: resource,
        remote: remoteState,
      });

      // log decision
      context.log.info(`   └─ decision ${colorizeAction(computed.action)}`);

      // and the diff too, indented to align with tree
      if (computed.state.difference) {
        const indentedDiff = computed.state.difference
          .split('\n')
          .map((line) => `      ${line}`)
          .join('\n');
        context.log.info(indentedDiff);
      }
      context.log.info('');

      return computed;
    });
    changes.push(change);
  }

  // log success message if everything is in sync
  const allInSync = changes.every(
    (change) => change.action === DeclastructChangeAction.KEEP,
  );
  if (allInSync) {
    context.log.info('');
    context.log.info('🎉 everything is in sync!');
  }

  // return plan
  return new DeclastructPlan({
    hash: hashChanges(changes),
    createdAt: asIsoTimestamp(new Date()),
    wish: {
      uri: input.wishFilePath,
    },
    changes,
  });
};
