import { DomainEntity } from 'domain-objects';
import { getError } from 'helpful-errors';

import {
  DeclastructChange,
  DeclastructChangeAction,
} from '../../domain.objects/DeclastructChange';
import type { DeclastructDao } from '../../domain.objects/DeclastructDao';
import { DeclastructProvider } from '../../domain.objects/DeclastructProvider';
import { applyChange } from './applyChange';

describe('applyChange', () => {
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

  it('should return immediately for KEEP action without calling DAO', async () => {
    const resource = new DemoResource({ id: 'keep-1', name: 'Keep Me' });

    const change = new DeclastructChange({
      forResource: {
        class: DemoResource.name,
        slug: 'keep-1',
      },
      action: DeclastructChangeAction.KEEP,
      state: {
        desired: resource,
        remote: resource,
        difference: null,
      },
    });

    const result = await applyChange({
      resource,
      change,
      providers: [],
    });

    expect(result).toBe(change);
  });

  it('should call finsert for CREATE action', async () => {
    const resource = new DemoResource({ id: 'create-1', name: 'Create Me' });
    const finsertSpy = jest.fn().mockResolvedValue(resource);

    const dao: DeclastructDao<DemoResource, typeof DemoResource, any> = {
      dobj: DemoResource,
      get: {
        one: {
          byUnique: async () => null,
          byPrimary: null,
          byRef: async () => null,
        },
        ref: {
          byPrimary: null,
          byUnique: null,
        },
      },
      set: {
        finsert: finsertSpy,
        upsert: null,
        delete: null,
      },
    };

    const provider = new DeclastructProvider({
      name: 'test-provider',
      daos: { DemoResource: dao },
      context: {},
      hooks: {
        beforeAll: async () => {},
        afterAll: async () => {},
      },
    });

    const change = new DeclastructChange({
      forResource: {
        class: DemoResource.name,
        slug: 'create-1',
      },
      action: DeclastructChangeAction.CREATE,
      state: {
        desired: resource,
        remote: null,
        difference: 'some diff',
      },
    });

    await applyChange({
      resource,
      change,
      providers: [provider],
    });

    expect(finsertSpy).toHaveBeenCalledWith(resource, {});
  });

  it('should call upsert for UPDATE action', async () => {
    const remote = new DemoResource({ id: 'update-1', name: 'Old Name' });
    const desired = new DemoResource({ id: 'update-1', name: 'New Name' });
    const upsertSpy = jest.fn().mockResolvedValue(desired);

    const dao: DeclastructDao<DemoResource, typeof DemoResource, any> = {
      dobj: DemoResource,
      get: {
        one: {
          byUnique: async () => null,
          byPrimary: null,
          byRef: async () => null,
        },
        ref: {
          byPrimary: null,
          byUnique: null,
        },
      },
      set: {
        finsert: async (input) => input as any,
        upsert: upsertSpy,
        delete: null,
      },
    };

    const provider = new DeclastructProvider({
      name: 'test-provider',
      daos: { DemoResource: dao },
      context: {},
      hooks: {
        beforeAll: async () => {},
        afterAll: async () => {},
      },
    });

    const change = new DeclastructChange({
      forResource: {
        class: DemoResource.name,
        slug: 'update-1',
      },
      action: DeclastructChangeAction.UPDATE,
      state: {
        desired,
        remote,
        difference: 'some diff',
      },
    });

    await applyChange({
      resource: desired,
      change,
      providers: [provider],
    });

    expect(upsertSpy).toHaveBeenCalledWith(desired, {});
  });

  it('should throw when UPDATE action but DAO does not support upsert', async () => {
    const remote = new DemoResource({ id: 'update-1', name: 'Old Name' });
    const desired = new DemoResource({ id: 'update-1', name: 'New Name' });

    const dao: DeclastructDao<DemoResource, typeof DemoResource, any> = {
      dobj: DemoResource,
      get: {
        one: {
          byUnique: async () => null,
          byPrimary: null,
          byRef: async () => null,
        },
        ref: {
          byPrimary: null,
          byUnique: null,
        },
      },
      set: {
        finsert: async (input) => input as any,
        upsert: null,
        delete: null,
      },
    };

    const provider = new DeclastructProvider({
      name: 'test-provider',
      daos: { DemoResource: dao },
      context: {},
      hooks: {
        beforeAll: async () => {},
        afterAll: async () => {},
      },
    });

    const change = new DeclastructChange({
      forResource: {
        class: DemoResource.name,
        slug: 'update-1',
      },
      action: DeclastructChangeAction.UPDATE,
      state: {
        desired,
        remote,
        difference: 'some diff',
      },
    });

    const error = await getError(() =>
      applyChange({
        resource: desired,
        change,
        providers: [provider],
      }),
    );

    expect(error.message).toContain('DAO does not support updates');
  });

  it('should call delete for DESTROY action', async () => {
    const resource = new DemoResource({ id: 'destroy-1', name: 'Delete Me' });
    const deleteSpy = jest.fn().mockResolvedValue(undefined);

    const dao: DeclastructDao<DemoResource, typeof DemoResource, any> = {
      dobj: DemoResource,
      get: {
        one: {
          byUnique: async () => null,
          byPrimary: null,
          byRef: async () => null,
        },
        ref: {
          byPrimary: null,
          byUnique: null,
        },
      },
      set: {
        finsert: async (input) => input as any,
        upsert: null,
        delete: deleteSpy,
      },
    };

    const provider = new DeclastructProvider({
      name: 'test-provider',
      daos: { DemoResource: dao },
      context: {},
      hooks: {
        beforeAll: async () => {},
        afterAll: async () => {},
      },
    });

    const change = new DeclastructChange({
      forResource: {
        class: DemoResource.name,
        slug: 'destroy-1',
      },
      action: DeclastructChangeAction.DESTROY,
      state: {
        desired: null,
        remote: resource,
        difference: 'some diff',
      },
    });

    await applyChange({
      resource,
      change,
      providers: [provider],
    });

    expect(deleteSpy).toHaveBeenCalledWith(resource, {});
  });

  it('should call delete then finsert for REPLACE action', async () => {
    const remote = new DemoResource({ id: 'replace-1', name: 'Old' });
    const desired = new DemoResource({ id: 'replace-2', name: 'New' });
    const deleteSpy = jest.fn().mockResolvedValue(undefined);
    const finsertSpy = jest.fn().mockResolvedValue(desired);

    const dao: DeclastructDao<DemoResource, typeof DemoResource, any> = {
      dobj: DemoResource,
      get: {
        one: {
          byUnique: async () => null,
          byPrimary: null,
          byRef: async () => null,
        },
        ref: {
          byPrimary: null,
          byUnique: null,
        },
      },
      set: {
        finsert: finsertSpy,
        upsert: null,
        delete: deleteSpy,
      },
    };

    const provider = new DeclastructProvider({
      name: 'test-provider',
      daos: { DemoResource: dao },
      context: {},
      hooks: {
        beforeAll: async () => {},
        afterAll: async () => {},
      },
    });

    const change = new DeclastructChange({
      forResource: {
        class: DemoResource.name,
        slug: 'replace-1',
      },
      action: DeclastructChangeAction.REPLACE,
      state: {
        desired,
        remote,
        difference: 'some diff',
      },
    });

    await applyChange({
      resource: desired,
      change,
      providers: [provider],
    });

    expect(deleteSpy).toHaveBeenCalledWith(remote, {});
    expect(finsertSpy).toHaveBeenCalledWith(desired, {});
  });
});
