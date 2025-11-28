import { DomainEntity } from 'domain-objects';

import { DeclastructDao } from './DeclastructDao';
import { DeclastructProvider } from './DeclastructProvider';

describe('DeclastructProvider', () => {
  it('should build a provider with all required properties', () => {
    const provider = new DeclastructProvider({
      name: 'test-provider',
      daos: {},
      context: {},
      hooks: {
        beforeAll: async () => {},
        afterAll: async () => {},
      },
    });

    expect(provider.name).toBe('test-provider');
    expect(provider.daos).toEqual({});
    expect(provider.context).toEqual({});
    expect(provider.hooks.beforeAll).toBeDefined();
    expect(provider.hooks.afterAll).toBeDefined();
  });

  it('should work without explicit type arguments', () => {
    // type verification - default type parameters should work
    const provider = new DeclastructProvider({
      name: 'default-provider',
      daos: {},
      context: {},
      hooks: {
        beforeAll: async () => {},
        afterAll: async () => {},
      },
    });

    expect(provider).toBeDefined();
  });

  describe('resource with optional primary key', () => {
    /**
     * .what = demo resource with optional primary key (metadata)
     * .why = proves DeclastructProvider works correctly with daos for resources that have optional primary keys
     */
    interface DemoResourceWithOptionalPrimary {
      uuid?: string; // optional in instance, metadata primary key
      name: string;
    }
    class DemoResourceWithOptionalPrimary
      extends DomainEntity<DemoResourceWithOptionalPrimary>
      implements DemoResourceWithOptionalPrimary
    {
      public static primary = ['uuid'] as const;
      public static unique = ['name'] as const;
    }

    it('should work with daos that have optional primary keys and byPrimary defined', () => {
      // define a dao for the resource with optional primary key
      const demoDao: DeclastructDao<
        DemoResourceWithOptionalPrimary,
        typeof DemoResourceWithOptionalPrimary,
        any
      > = {
        get: {
          byUnique: async () => null,
          byPrimary: async (input) => {
            // input.uuid should be string (not string | undefined)
            const uuid: string = input.uuid;
            expect(uuid).toBeDefined();
            return null;
          },
          byRef: async () => null,
        },
        set: {
          finsert: async (r) => r as any,
        },
      };

      // build provider with the dao
      const provider = new DeclastructProvider({
        name: 'optional-primary-key-provider',
        daos: {
          DemoResourceWithOptionalPrimary: demoDao,
        },
        context: {},
        hooks: {
          beforeAll: async () => {},
          afterAll: async () => {},
        },
      });

      // verify provider structure
      expect(provider.name).toBe('optional-primary-key-provider');
      expect(provider.daos.DemoResourceWithOptionalPrimary).toBeDefined();

      // access dao to verify structure
      const dao = provider.daos.DemoResourceWithOptionalPrimary;
      expect(dao?.get.byPrimary).toBeDefined();
      expect(dao?.get.byUnique).toBeDefined();
      expect(dao?.set.finsert).toBeDefined();
    });
  });
});
