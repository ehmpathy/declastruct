import { DomainEntity } from 'domain-objects';
import { ContextLogTrail } from 'simple-log-methods';

import { ContextDeclastruct } from '../../domain.objects/ContextDeclastruct';
import { DeclastructChangeAction } from '../../domain.objects/DeclastructChange';
import { DeclastructPlan } from '../../domain.objects/DeclastructPlan';
import { DeclastructProvider } from '../../domain.objects/DeclastructProvider';
import { asIsoTimestamp } from '../../infra/asIsoTimestamp';
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
  // extract bottleneck for planning
  const bottleneck =
    'onPlan' in context.bottleneck
      ? context.bottleneck.onPlan
      : context.bottleneck;

  // compute change for each resource with real-time logging
  const changes = await Promise.all(
    input.resources.map((resource) =>
      bottleneck.schedule(async () => {
        // find DAO for this resource
        const dao = getDaoByResource({
          resource,
          providers: input.providers,
        });

        // fetch current remote state
        const remoteState = await dao.get.byUnique(resource, context);

        // compute change
        const change = computeChange({
          desired: resource,
          remote: remoteState,
        });

        // log change as it's computed
        const symbol =
          change.action === DeclastructChangeAction.KEEP ? '↓' : '○';
        context.log.info(
          `${symbol} [${change.action}] ${change.forResource.slug}`,
          {},
        );

        return change;
      }),
    ),
  );

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
