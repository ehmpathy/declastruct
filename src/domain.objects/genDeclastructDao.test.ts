import { DomainEntity } from 'domain-objects';

import type { DeclastructDaosShape } from './DeclastructProvider';
import { genDeclastructDao } from './genDeclastructDao';

describe('genDeclastructDao', () => {
  describe('type inference', () => {
    // resource with both primary and unique keys
    interface DemoResourceWithPrimary {
      uuid?: string;
      exid: string;
      name: string;
    }
    class DemoResourceWithPrimary
      extends DomainEntity<DemoResourceWithPrimary>
      implements DemoResourceWithPrimary
    {
      public static primary = ['uuid'] as const;
      public static unique = ['exid'] as const;
    }

    // resource with only unique keys (no primary)
    interface DemoResourceWithoutPrimary {
      exid: string;
      name: string;
    }
    class DemoResourceWithoutPrimary
      extends DomainEntity<DemoResourceWithoutPrimary>
      implements DemoResourceWithoutPrimary
    {
      public static unique = ['exid'] as const;
    }

    it('should infer get.ref methods as functions when byPrimary is defined', () => {
      const dao = genDeclastructDao<typeof DemoResourceWithPrimary, {}>({
        dobj: DemoResourceWithPrimary,
        get: {
          one: {
            byUnique: async () => null,
            byPrimary: async () => null,
          },
        },
        set: {
          finsert: async (input) => input as any,
          upsert: null,
          delete: null,
        },
      });

      // verify get.ref.byPrimary is callable (not null)
      expect(typeof dao.get.ref.byPrimary).toBe('function');
      expect(typeof dao.get.ref.byUnique).toBe('function');

      // verify get.one.byRef is auto-composed
      expect(typeof dao.get.one.byRef).toBe('function');

      // type test: these should compile without error
      const _byPrimary: typeof dao.get.ref.byPrimary = async () => ({
        uuid: 'test',
      });
      const _byUnique: typeof dao.get.ref.byUnique = async () => ({
        exid: 'test',
      });
      expect(_byPrimary).toBeDefined();
      expect(_byUnique).toBeDefined();
    });

    it('should infer get.ref methods as null when byPrimary is null', () => {
      const dao = genDeclastructDao<typeof DemoResourceWithoutPrimary, {}>({
        dobj: DemoResourceWithoutPrimary,
        get: {
          one: {
            byUnique: async () => null,
            byPrimary: null,
          },
        },
        set: {
          finsert: async (input) => input as any,
          upsert: null,
          delete: null,
        },
      });

      // verify get.ref.byPrimary is undefined (not callable)
      expect(dao.get.ref.byPrimary).toBeUndefined();
      expect(dao.get.ref.byUnique).toBeUndefined();

      // verify get.one.byRef is still auto-composed
      expect(typeof dao.get.one.byRef).toBe('function');

      // type test: these should be typed as undefined
      const _byPrimary: undefined = dao.get.ref.byPrimary;
      const _byUnique: undefined = dao.get.ref.byUnique;
      expect(_byPrimary).toBeUndefined();
      expect(_byUnique).toBeUndefined();
    });

    it('should error when trying to call get.ref.byPrimary on dao without primary', () => {
      const dao = genDeclastructDao<typeof DemoResourceWithoutPrimary, {}>({
        dobj: DemoResourceWithoutPrimary,
        get: {
          one: {
            byUnique: async () => null,
            byPrimary: null,
          },
        },
        set: {
          finsert: async (input) => input as any,
          upsert: null,
          delete: null,
        },
      });

      // type test: attempting to call null methods should be a type error
      // @ts-expect-error - byPrimary is undefined, not callable
      const _callByPrimary = () => dao.get.ref.byPrimary({ exid: 'test' }, {});

      // @ts-expect-error - byUnique is undefined, not callable
      const _callByUnique = () => dao.get.ref.byUnique({ exid: 'test' }, {});

      // verify they're undefined at runtime (don't actually call them)
      expect(dao.get.ref.byPrimary).toBeUndefined();
      expect(dao.get.ref.byUnique).toBeUndefined();
      expect(_callByPrimary).toBeDefined();
      expect(_callByUnique).toBeDefined();
    });

    it('should error when trying to assign null to get.ref.byPrimary on dao with primary', () => {
      const dao = genDeclastructDao<typeof DemoResourceWithPrimary, {}>({
        dobj: DemoResourceWithPrimary,
        get: {
          one: {
            byUnique: async () => null,
            byPrimary: async () => null,
          },
        },
        set: {
          finsert: async (input) => input as any,
          upsert: null,
          delete: null,
        },
      });

      // @ts-expect-error - byPrimary is a function, not null
      const _byPrimaryNull: null = dao.get.ref.byPrimary;

      // @ts-expect-error - byUnique is a function, not null
      const _byUniqueNull: null = dao.get.ref.byUnique;

      expect(_byPrimaryNull).toBeDefined();
      expect(_byUniqueNull).toBeDefined();
    });

    it('should correctly infer context type from factory input', () => {
      interface CustomContext {
        credentials: { apiKey: string };
        region: string;
      }

      const dao = genDeclastructDao<
        typeof DemoResourceWithPrimary,
        CustomContext
      >({
        dobj: DemoResourceWithPrimary,
        get: {
          one: {
            byUnique: async (_input, context) => {
              // type test: context.credentials should be accessible
              const _apiKey: string = context.credentials.apiKey;
              const _region: string = context.region;
              expect(_apiKey).toBeUndefined();
              expect(_region).toBeUndefined();
              return null;
            },
            byPrimary: async (_input, context) => {
              // type test: context type is inferred consistently across methods
              const _apiKey: string = context.credentials.apiKey;
              expect(_apiKey).toBeUndefined();
              return null;
            },
          },
        },
        set: {
          finsert: async (input, context) => {
            // type test: context type is inferred in set methods too
            const _apiKey: string = context.credentials.apiKey;
            expect(_apiKey).toBeUndefined();
            return input as any;
          },
          upsert: null,
          delete: null,
        },
      });

      // type test: calling dao methods requires the correct context type
      const _callWithEmptyContext = () =>
        // @ts-expect-error - missing credentials and region
        dao.get.one.byUnique({ exid: 'x' }, {});

      const _callWithPartialContext = () =>
        // @ts-expect-error - missing region
        dao.get.one.byUnique({ exid: 'x' }, { credentials: { apiKey: 'key' } });

      expect(dao).toBeDefined();
      expect(_callWithEmptyContext).toBeDefined();
      expect(_callWithPartialContext).toBeDefined();
    });

    it('should correctly infer TResourceClass from factory input', () => {
      const dao = genDeclastructDao<typeof DemoResourceWithPrimary, {}>({
        dobj: DemoResourceWithPrimary,
        get: {
          one: {
            byUnique: async () =>
              DemoResourceWithPrimary.as({ exid: 'test', name: 'Test' }),
            byPrimary: async () => null,
          },
        },
        set: {
          finsert: async (input) => {
            // type test: input should be typed as DemoResourceWithPrimary
            const _exid: string = input.exid;
            const _name: string = input.name;

            // @ts-expect-error - input.nonexistent should not exist
            const _nonexistent = input.nonexistent;

            expect(_exid).toBeDefined();
            expect(_name).toBeDefined();
            expect(_nonexistent).toBeUndefined();
            return input as any;
          },
          upsert: null,
          delete: null,
        },
      });

      // type test: dao methods should return DemoResourceWithPrimary | null
      const _checkReturnType = async () => {
        const result = await dao.get.one.byUnique({ exid: 'test' }, {});
        if (result) {
          const _exid: string = result.exid;
          const _name: string = result.name;

          // @ts-expect-error - result.nonexistent should not exist
          const _nonexistent = result.nonexistent;

          expect(_exid).toBeDefined();
          expect(_name).toBeDefined();
          expect(_nonexistent).toBeUndefined();
        }
      };

      expect(dao).toBeDefined();
      expect(_checkReturnType).toBeDefined();
    });
  });

  describe('runtime behavior', () => {
    interface TestResource {
      uuid?: string;
      exid: string;
      name: string;
    }
    class TestResource
      extends DomainEntity<TestResource>
      implements TestResource
    {
      public static primary = ['uuid'] as const;
      public static unique = ['exid'] as const;
    }

    it('should auto-wire get.ref.byPrimary to resolve RefByUnique to RefByPrimary', async () => {
      const store: Record<string, TestResource> = {};

      const dao = genDeclastructDao<typeof TestResource, {}>({
        dobj: TestResource,
        get: {
          one: {
            byUnique: async (input) => store[input.exid] ?? null,
            byPrimary: async (input) => {
              const found = Object.values(store).find(
                (r) => r.uuid === input.uuid,
              );
              return found ?? null;
            },
          },
        },
        set: {
          finsert: async (resource) => {
            const withUuid = TestResource.as({
              ...resource,
              uuid: resource.uuid ?? 'gen-uuid',
            });
            store[resource.exid] = withUuid;
            return withUuid as any;
          },
          upsert: null,
          delete: null,
        },
      });

      // insert a resource
      await dao.set.finsert(
        TestResource.as({ exid: 'test-exid', name: 'Test' }),
        {},
      );

      // resolve RefByUnique to RefByPrimary
      const refByPrimary = await dao.get.ref.byPrimary(
        { exid: 'test-exid' },
        {},
      );
      expect(refByPrimary).toEqual({ uuid: 'gen-uuid' });
    });

    it('should auto-wire get.ref.byUnique to resolve RefByPrimary to RefByUnique', async () => {
      const store: Record<string, TestResource> = {};

      const dao = genDeclastructDao<typeof TestResource, {}>({
        dobj: TestResource,
        get: {
          one: {
            byUnique: async (input) => store[input.exid] ?? null,
            byPrimary: async (input) => {
              const found = Object.values(store).find(
                (r) => r.uuid === input.uuid,
              );
              return found ?? null;
            },
          },
        },
        set: {
          finsert: async (resource) => {
            const withUuid = TestResource.as({
              ...resource,
              uuid: resource.uuid ?? 'gen-uuid',
            });
            store[resource.exid] = withUuid;
            return withUuid as any;
          },
          upsert: null,
          delete: null,
        },
      });

      // insert a resource
      await dao.set.finsert(
        TestResource.as({ exid: 'test-exid', name: 'Test' }),
        {},
      );

      // resolve RefByPrimary to RefByUnique
      const refByUnique = await dao.get.ref.byUnique({ uuid: 'gen-uuid' }, {});
      expect(refByUnique).toEqual({ exid: 'test-exid' });
    });

    it('should auto-compose get.one.byRef from byUnique and byPrimary', async () => {
      const store: Record<string, TestResource> = {};

      const dao = genDeclastructDao<typeof TestResource, {}>({
        dobj: TestResource,
        get: {
          one: {
            byUnique: async (input) => store[input.exid] ?? null,
            byPrimary: async (input) => {
              const found = Object.values(store).find(
                (r) => r.uuid === input.uuid,
              );
              return found ?? null;
            },
          },
        },
        set: {
          finsert: async (resource) => {
            const withUuid = TestResource.as({
              ...resource,
              uuid: resource.uuid ?? 'gen-uuid',
            });
            store[resource.exid] = withUuid;
            return withUuid as any;
          },
          upsert: null,
          delete: null,
        },
      });

      // insert a resource
      await dao.set.finsert(
        TestResource.as({ exid: 'test-exid', name: 'Test' }),
        {},
      );

      // byRef should work with RefByUnique
      const byUnique = await dao.get.one.byRef({ exid: 'test-exid' }, {});
      expect(byUnique?.exid).toBe('test-exid');

      // byRef should work with RefByPrimary
      const byPrimary = await dao.get.one.byRef({ uuid: 'gen-uuid' }, {});
      expect(byPrimary?.uuid).toBe('gen-uuid');
    });

    it('should return null from get.ref methods when resource not found', async () => {
      const dao = genDeclastructDao<typeof TestResource, {}>({
        dobj: TestResource,
        get: {
          one: {
            byUnique: async () => null,
            byPrimary: async () => null,
          },
        },
        set: {
          finsert: async (input) => input as any,
          upsert: null,
          delete: null,
        },
      });

      const refByPrimary = await dao.get.ref.byPrimary(
        { exid: 'nonexistent' },
        {},
      );
      expect(refByPrimary).toBeNull();

      const refByUnique = await dao.get.ref.byUnique(
        { uuid: 'nonexistent' },
        {},
      );
      expect(refByUnique).toBeNull();
    });
  });

  describe('provider compatibility', () => {
    interface ProviderResource {
      uuid?: string;
      exid: string;
      name: string;
    }
    class ProviderResource
      extends DomainEntity<ProviderResource>
      implements ProviderResource
    {
      public static primary = ['uuid'] as const;
      public static unique = ['exid'] as const;
    }

    it('should assign dao to DeclastructDaosShape for use in DeclastructProvider', () => {
      // create a dao with genDeclastructDao
      const dao = genDeclastructDao<typeof ProviderResource, {}>({
        dobj: ProviderResource,
        get: {
          one: {
            byUnique: async () => null,
            byPrimary: async () => null,
          },
        },
        set: {
          finsert: async (input) => input as any,
          upsert: null,
          delete: null,
        },
      });

      // type test: dao should be assignable to DeclastructDaosShape
      // this verifies bivariance works correctly after the callable interface syntax fix
      const daos: DeclastructDaosShape<{}> = {
        ProviderResource: dao,
      };

      expect(daos.ProviderResource).toBe(dao);
    });

    it('should assign dao without primary to DeclastructDaosShape', () => {
      interface NoPrimaryResource {
        exid: string;
        name: string;
      }
      class NoPrimaryResource
        extends DomainEntity<NoPrimaryResource>
        implements NoPrimaryResource
      {
        public static unique = ['exid'] as const;
      }

      const dao = genDeclastructDao<typeof NoPrimaryResource, {}>({
        dobj: NoPrimaryResource,
        get: {
          one: {
            byUnique: async () => null,
            byPrimary: null,
          },
        },
        set: {
          finsert: async (input) => input as any,
          upsert: null,
          delete: null,
        },
      });

      // type test: dao without primary should also be assignable
      const daos: DeclastructDaosShape<{}> = {
        NoPrimaryResource: dao,
      };

      expect(daos.NoPrimaryResource).toBe(dao);
    });

    it('should assign multiple daos to DeclastructDaosShape', () => {
      interface ResourceA {
        uuid?: string;
        exid: string;
      }
      class ResourceA extends DomainEntity<ResourceA> implements ResourceA {
        public static primary = ['uuid'] as const;
        public static unique = ['exid'] as const;
      }

      interface ResourceB {
        slug: string;
        value: number;
      }
      class ResourceB extends DomainEntity<ResourceB> implements ResourceB {
        public static unique = ['slug'] as const;
      }

      const daoA = genDeclastructDao<typeof ResourceA, {}>({
        dobj: ResourceA,
        get: {
          one: {
            byUnique: async () => null,
            byPrimary: async () => null,
          },
        },
        set: {
          finsert: async (input) => input as any,
          upsert: async (input) => input as any,
          delete: async () => {},
        },
      });

      const daoB = genDeclastructDao<typeof ResourceB, {}>({
        dobj: ResourceB,
        get: {
          one: {
            byUnique: async () => null,
            byPrimary: null,
          },
        },
        set: {
          finsert: async (input) => input as any,
          upsert: null,
          delete: null,
        },
      });

      // type test: heterogeneous daos should all fit into DeclastructDaosShape
      const daos: DeclastructDaosShape<{}> = {
        ResourceA: daoA,
        ResourceB: daoB,
      };

      expect(Object.keys(daos)).toEqual(['ResourceA', 'ResourceB']);
    });
  });
});
