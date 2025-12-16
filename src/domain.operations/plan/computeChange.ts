import {
  type DomainEntity,
  getUniqueIdentifierSlug,
  omitReadonly,
  serialize,
} from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';

import {
  DeclastructChange,
  DeclastructChangeAction,
} from '@src/domain.objects/DeclastructChange';

import { getDisplayableDiff } from './getDisplayableDiff';

/**
 * .what = checks if two resources are equivalent
 * .why = determines whether a resource needs to be updated
 * .note = uses deterministic serialization for deep equality check, ignoring readonly
 */
const checkAreResourcesEquivalent = (input: {
  remote: DomainEntity<any>;
  desired: DomainEntity<any>;
}): boolean => {
  // serialize both deterministically for deep comparison, omitting readonly
  const remoteSerialized = serialize(omitReadonly(input.remote));
  const desiredSerialized = serialize(omitReadonly(input.desired));

  return remoteSerialized === desiredSerialized;
};

/**
 * .what = computes a single change by comparing desired vs remote state
 * .why = determines the action needed to achieve desired state for one resource
 * .note = returns null when both desired and remote are null (nothing to track)
 */
export const computeChange = ({
  desired,
  remote,
}: {
  desired: DomainEntity<any> | null;
  remote: DomainEntity<any> | null;
}): DeclastructChange | null => {
  // resource doesn't exist and isn't desired - nothing to track
  if (!remote && !desired) return null;

  // determine action based on state comparison
  const action = (() => {
    // resource doesn't exist remotely but is desired - create it
    if (!remote) return DeclastructChangeAction.CREATE;

    // resource exists but should be deleted
    if (!desired) return DeclastructChangeAction.DESTROY;

    // no changes needed
    const areResourcesEquivalent = UnexpectedCodePathError.wrap(
      () => checkAreResourcesEquivalent({ remote, desired }),
      {
        message: 'failed to checkAreResourcesEquivalent',
        metadata: {
          input: { desired, remote },
          ctors: {
            desired: desired?.constructor.name,
            remote: remote?.constructor.name,
          },
        },
      },
    )();
    if (areResourcesEquivalent) return DeclastructChangeAction.KEEP;

    // resource exists and needs updating
    return DeclastructChangeAction.UPDATE;
  })();

  // compute displayable difference
  const difference =
    action === DeclastructChangeAction.KEEP
      ? null
      : getDisplayableDiff({ from: remote, into: desired });

  // get resource info for change record
  const resourceForChange = desired || remote!;

  // return change
  return new DeclastructChange({
    forResource: {
      class: resourceForChange.constructor.name,
      slug: UnexpectedCodePathError.wrap(
        () => getUniqueIdentifierSlug(resourceForChange),
        {
          message: 'failed to getUniqueIdentifierSlug',
          metadata: {
            input: { desired, remote },
            ctors: {
              desired: desired?.constructor.name,
              remote: remote?.constructor.name,
            },
          },
        },
      )(),
    },
    action,
    state: {
      desired: desired ? omitReadonly(desired) : null,
      remote: remote ? omitReadonly(remote) : null,
      difference,
    },
  });
};
