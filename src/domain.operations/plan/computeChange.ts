import { DomainEntity, getUniqueIdentifierSlug } from 'domain-objects';
import { diff } from 'jest-diff';

import {
  DeclastructChange,
  DeclastructChangeAction,
} from '../../domain.objects/DeclastructChange';

/**
 * .what = checks if two resources are equivalent
 * .why = determines whether a resource needs to be updated
 * .note = uses JSON serialization for deep equality check
 */
const resourcesAreEquivalent = (
  remote: DomainEntity<any>,
  desired: DomainEntity<any>,
): boolean => {
  // serialize both to JSON for deep comparison
  const remoteJson = JSON.stringify(remote);
  const desiredJson = JSON.stringify(desired);

  return remoteJson === desiredJson;
};

/**
 * .what = computes human-readable diff between two resources
 * .why = helps users understand what will change
 * .note = returns null if resources are identical; for CREATE uses empty object to show all attributes
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

  // use empty object for CREATE to show all attributes in diff
  const fromValue = from === null ? {} : from;
  const intoValue = into === null ? {} : into;

  // compute diff using jest-diff
  const difference = diff(fromValue, intoValue, {
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
    if (resourcesAreEquivalent(remote, desired))
      return DeclastructChangeAction.KEEP;

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
      slug: getUniqueIdentifierSlug(resourceForChange),
    },
    action,
    state: {
      desired,
      remote,
      difference,
    },
  });
};
