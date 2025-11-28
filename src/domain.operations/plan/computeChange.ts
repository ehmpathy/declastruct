import {
  DomainEntity,
  getUniqueIdentifierSlug,
  omitReadonly,
  serialize,
} from 'domain-objects';
import { UnexpectedCodePathError } from 'helpful-errors';
import { diff } from 'jest-diff';

import {
  DeclastructChange,
  DeclastructChangeAction,
} from '../../domain.objects/DeclastructChange';

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
 * .what = computes human-readable diff between two resources
 * .why = helps users understand what will change
 * .note = returns null if resources are identical; for CREATE uses empty object to show all attributes; ignores readonly
 */
const computeDiff = ({
  from,
  into,
}: {
  from: DomainEntity<any> | null;
  into: DomainEntity<any> | null;
}): string | null => {
  // no diff if both are null
  if (from === null && into === null) return null;

  // check if resources are equivalent after omitting readonly
  if (from !== null && into !== null) {
    const fromSerialized = serialize(omitReadonly(from));
    const intoSerialized = serialize(omitReadonly(into));
    if (fromSerialized === intoSerialized) return null;
  }

  // omit readonly before diff
  const fromWithoutReadonly = from === null ? {} : omitReadonly(from);
  const intoWithoutReadonly = into === null ? {} : omitReadonly(into);

  // compute diff using jest-diff
  const difference = diff(fromWithoutReadonly, intoWithoutReadonly, {
    aAnnotation: 'Remote',
    bAnnotation: 'Desired',
  });

  return difference;
};

/**
 * .what = computes a single change by comparing desired vs remote state
 * .why = determines the action needed to achieve desired state for one resource
 * .note = uses IIFE to compute action immutably
 */
export const computeChange = ({
  desired,
  remote,
}: {
  desired: DomainEntity<any> | null;
  remote: DomainEntity<any> | null;
}): DeclastructChange => {
  // determine action based on state comparison
  const action = (() => {
    // resource doesn't exist remotely
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
      : computeDiff({ from: remote, into: desired });

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
      desired,
      remote,
      difference,
    },
  });
};
