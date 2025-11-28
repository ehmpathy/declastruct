import { type IsoTimestamp } from './IsoTimestamp';

describe('IsoTimestamp', () => {
  it('should be a string type', () => {
    // type verification
    const timestamp: IsoTimestamp = '2025-11-22T10:30:00.000Z';
    expect(typeof timestamp).toBe('string');
  });
});
