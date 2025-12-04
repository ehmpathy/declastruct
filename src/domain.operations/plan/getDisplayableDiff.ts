import { type DomainEntity, omitReadonly, serialize } from 'domain-objects';
import { diff } from 'jest-diff';

/**
 * .what = computes human-readable diff between two resources
 * .why = helps users understand what will change
 * .note = returns null if resources are identical; for CREATE uses empty object to show all attributes; ignores readonly; preserves key order from into
 */
export const getDisplayableDiff = ({
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

  // build key order from into (desired) for stable diff output
  const keyOrder = Object.keys(intoWithoutReadonly);

  // compute diff using jest-diff, sorting keys by into's order
  const difference = diff(fromWithoutReadonly, intoWithoutReadonly, {
    aAnnotation: 'Remote',
    bAnnotation: 'Desired',
    compareKeys: (a, b) => {
      const aIdx = keyOrder.indexOf(a);
      const bIdx = keyOrder.indexOf(b);
      return (aIdx === -1 ? Infinity : aIdx) - (bIdx === -1 ? Infinity : bIdx);
    },
  });

  return difference;
};
