import { DomainEntity, getUniqueIdentifierSlug } from 'domain-objects';

import { DeclastructChangeAction } from '../../domain.objects/DeclastructChange';
import { computeChange } from './computeChange';

describe('computeChange', () => {
  // demo resource for testing
  interface DemoResource {
    id?: string;
    uuid?: string;
    exid: string;
    name: string;
    createdAt?: string;
    updatedAt?: string;
  }
  class DemoResource
    extends DomainEntity<DemoResource>
    implements DemoResource
  {
    public static primary = ['id'] as const;
    public static unique = ['exid'] as const;
    public static updatable = ['name'] as const;
  }

  it('should return CREATE when remote is null', () => {
    const desired = new DemoResource({
      exid: 'new-1',
      name: 'New Resource',
    });

    const change = computeChange({
      desired,
      remote: null,
    });

    expect(change.action).toBe(DeclastructChangeAction.CREATE);
    expect(change.forResource.class).toBe('DemoResource');
    expect(change.forResource.slug).toBe(getUniqueIdentifierSlug(desired));
    expect(change.state.desired).toBe(desired);
    expect(change.state.remote).toBeNull();
    expect(change.state.difference).toBeTruthy();
  });

  it('should return DESTROY when desired is null', () => {
    const remote = new DemoResource({
      exid: 'old-1',
      name: 'Old Resource',
    });

    const change = computeChange({
      desired: null,
      remote,
    });

    expect(change.action).toBe(DeclastructChangeAction.DESTROY);
    expect(change.forResource.class).toBe('DemoResource');
    expect(change.forResource.slug).toBe(getUniqueIdentifierSlug(remote));
    expect(change.state.desired).toBeNull();
    expect(change.state.remote).toBe(remote);
    expect(change.state.difference).toBeTruthy();
  });

  it('should return KEEP when resources are equivalent', () => {
    const desired = new DemoResource({
      exid: 'same-1',
      name: 'Same Resource',
    });
    const remote = new DemoResource({
      exid: 'same-1',
      name: 'Same Resource',
    });

    const change = computeChange({
      desired,
      remote,
    });

    expect(change.action).toBe(DeclastructChangeAction.KEEP);
    expect(change.forResource.class).toBe('DemoResource');
    expect(change.forResource.slug).toBe(getUniqueIdentifierSlug(desired));
    expect(change.state.desired).toBe(desired);
    expect(change.state.remote).toBe(remote);
    expect(change.state.difference).toBeNull();
  });

  it('should return UPDATE when resources differ', () => {
    const desired = new DemoResource({
      exid: 'update-1',
      name: 'New Name',
    });
    const remote = new DemoResource({
      exid: 'update-1',
      name: 'Old Name',
    });

    const change = computeChange({
      desired,
      remote,
    });

    expect(change.action).toBe(DeclastructChangeAction.UPDATE);
    expect(change.forResource.class).toBe('DemoResource');
    expect(change.forResource.slug).toBe(getUniqueIdentifierSlug(desired));
    expect(change.state.desired).toBe(desired);
    expect(change.state.remote).toBe(remote);
    expect(change.state.difference).toBeTruthy();
    expect(change.state.difference).toContain('Old Name');
    expect(change.state.difference).toContain('New Name');
  });

  it('should return KEEP when only metadata differs (ignores id, createdAt, updatedAt)', () => {
    const desired = new DemoResource({
      exid: 'meta-test-1',
      name: 'Same Name',
    });
    const remote = new DemoResource({
      id: 'db-id-123',
      exid: 'meta-test-1',
      name: 'Same Name',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    });

    const change = computeChange({
      desired,
      remote,
    });

    expect(change.action).toBe(DeclastructChangeAction.KEEP);
    expect(change.state.difference).toBeNull();
  });

  it('should not include metadata in diff when resources differ', () => {
    const desired = new DemoResource({
      exid: 'diff-test-1',
      name: 'New Name',
    });
    const remote = new DemoResource({
      id: 'db-id-456',
      exid: 'diff-test-1',
      name: 'Old Name',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-02T00:00:00Z',
    });

    const change = computeChange({
      desired,
      remote,
    });

    expect(change.action).toBe(DeclastructChangeAction.UPDATE);
    expect(change.state.difference).toBeTruthy();
    expect(change.state.difference).toContain('New Name');
    expect(change.state.difference).toContain('Old Name');
    // metadata should not appear in diff
    expect(change.state.difference).not.toContain('db-id-456');
    expect(change.state.difference).not.toContain('createdAt');
    expect(change.state.difference).not.toContain('updatedAt');
    expect(change.state.difference).not.toContain('2024-01-01');
  });

  it('should return KEEP even when metadata values differ', () => {
    const desired = new DemoResource({
      exid: 'meta-diff-1',
      name: 'Same Name',
    });
    const remote = new DemoResource({
      id: 'db-id-789',
      uuid: 'uuid-abc-123',
      exid: 'meta-diff-1',
      name: 'Same Name',
      createdAt: '2024-01-01T00:00:00Z',
      updatedAt: '2024-01-03T00:00:00Z',
    });

    const change = computeChange({
      desired,
      remote,
    });

    // should be KEEP because only metadata differs
    expect(change.action).toBe(DeclastructChangeAction.KEEP);
    expect(change.state.difference).toBeNull();
  });
});
