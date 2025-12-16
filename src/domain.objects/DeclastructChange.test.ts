import { DomainEntity } from 'domain-objects';

import {
  DeclastructChange,
  DeclastructChangeAction,
} from './DeclastructChange';

describe('DeclastructChange', () => {
  describe('DeclastructChangeAction', () => {
    it('should export all 6 action types', () => {
      expect(DeclastructChangeAction.KEEP).toBe('KEEP');
      expect(DeclastructChangeAction.CREATE).toBe('CREATE');
      expect(DeclastructChangeAction.UPDATE).toBe('UPDATE');
      expect(DeclastructChangeAction.DESTROY).toBe('DESTROY');
      expect(DeclastructChangeAction.REPLACE).toBe('REPLACE');
      expect(DeclastructChangeAction.OMIT).toBe('OMIT');
    });
  });

  describe('DeclastructChange class', () => {
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

    it('should build a change with all required properties', () => {
      const change = new DeclastructChange({
        forResource: {
          class: DemoResource.constructor.name,
          slug: 'demo-1',
        },
        action: DeclastructChangeAction.CREATE,
        state: {
          desired: new DemoResource({ id: 'demo-1', name: 'Demo' }),
          remote: null,
          difference: null,
        },
      });

      expect(change.forResource.class).toBe(DemoResource.constructor.name);
      expect(change.forResource.slug).toBe('demo-1');
      expect(change.action).toBe(DeclastructChangeAction.CREATE);
      expect(change.state.desired).toBeDefined();
      expect(change.state.remote).toBeNull();
      expect(change.state.difference).toBeNull();
    });

    it('should handle KEEP action with matching desired and remote state', () => {
      const resource = new DemoResource({ id: 'demo-2', name: 'Demo' });

      const change = new DeclastructChange({
        forResource: {
          class: DemoResource.constructor.name,
          slug: 'demo-2',
        },
        action: DeclastructChangeAction.KEEP,
        state: {
          desired: resource,
          remote: resource,
          difference: null,
        },
      });

      expect(change.action).toBe(DeclastructChangeAction.KEEP);
      expect(change.state.difference).toBeNull();
      expect(change.state.desired).toBe(change.state.remote);
    });
  });
});
