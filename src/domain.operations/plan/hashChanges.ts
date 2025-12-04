import { createHash } from 'crypto';

import type { DeclastructChange } from '../../domain.objects/DeclastructChange';

/**
 * .what = computes deterministic hash of changes
 * .why = enables plan comparison and staleness detection
 * .note = uses SHA-256 for consistency
 */
export const hashChanges = (changes: DeclastructChange[]): string => {
  // serialize changes to deterministic JSON
  const serialized = JSON.stringify(changes, null, 0);

  // compute SHA-256 hash
  const hash = createHash('sha256').update(serialized).digest('hex');

  return hash;
};
