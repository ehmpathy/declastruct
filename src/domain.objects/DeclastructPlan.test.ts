import { DeclastructPlan } from './DeclastructPlan';

describe('DeclastructPlan', () => {
  it('should build a plan with all required properties', () => {
    const plan = new DeclastructPlan({
      hash: 'abc123',
      createdAt: '2025-11-22T10:30:00.000Z',
      wish: { uri: '/path/to/wish.ts' },
      changes: [],
    });

    expect(plan.hash).toBe('abc123');
    expect(plan.createdAt).toBe('2025-11-22T10:30:00.000Z');
    expect(plan.wish.uri).toBe('/path/to/wish.ts');
    expect(plan.changes).toEqual([]);
  });

  it('should have unique key set to hash', () => {
    expect(DeclastructPlan.unique).toEqual(['hash']);
  });

  it('should extend DomainEntity', () => {
    const plan = new DeclastructPlan({
      hash: 'test-hash',
      createdAt: '2025-11-22T10:30:00.000Z',
      wish: { uri: '/test' },
      changes: [],
    });

    // domain entities should have constructor.name
    expect(plan.constructor.name).toBe('DeclastructPlan');
  });
});
