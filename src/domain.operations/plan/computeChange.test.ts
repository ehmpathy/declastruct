import { DomainEntity, getUniqueIdentifierSlug } from 'domain-objects';

import { DeclastructChangeAction } from '../../domain.objects/DeclastructChange';
import { computeChange } from './computeChange';

describe('computeChange', () => {
  // demo resource for testing
  interface DemoResource {
    id: string;
    name: string;
  }
  class DemoResource
    extends DomainEntity<DemoResource>
    implements DemoResource
  {
    public static unique = ['id'] as const;
  }

  it('should return CREATE when remote is null', () => {
    const desired = new DemoResource({ id: 'new-1', name: 'New Resource' });

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
    const remote = new DemoResource({ id: 'old-1', name: 'Old Resource' });

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
    const desired = new DemoResource({ id: 'same-1', name: 'Same Resource' });
    const remote = new DemoResource({ id: 'same-1', name: 'Same Resource' });

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
    const desired = new DemoResource({ id: 'update-1', name: 'New Name' });
    const remote = new DemoResource({ id: 'update-1', name: 'Old Name' });

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
});
