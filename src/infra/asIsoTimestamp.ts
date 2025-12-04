import type { IsoTimestamp } from '../domain.objects/IsoTimestamp';

/**
 * .what = converts a Date to ISO 8601 timestamp string
 * .why = ensures consistent timestamp format across the system
 */
export const asIsoTimestamp = (date: Date): IsoTimestamp => {
  return date.toISOString();
};
