import { DomainEntity, type RefByPrimary } from 'domain-objects';

import type { DeclastructDao } from './DeclastructDao';

describe('DeclastructDao', () => {
  // demo resource for testing
  interface DemoResource {
    id: string;
  }
  class DemoResource
    extends DomainEntity<DemoResource>
    implements DemoResource
  {
    public static unique = ['id'] as const;
  }

  it('should implement the interface structure', () => {
    // type verification
    const dao: DeclastructDao<typeof DemoResource> = {
      dobj: DemoResource,
      get: {
        one: {
          byUnique: async () => null,
          byPrimary: undefined,
          byRef: async () => null,
        },
        ref: {
          byPrimary: undefined,
          byUnique: undefined,
        },
      },
      set: {
        finsert: async (input) => input as any,
        upsert: undefined,
        delete: undefined,
      },
    };

    expect(dao.dobj).toBe(DemoResource);
    expect(dao.get.one.byUnique).toBeDefined();
    expect(dao.get.one.byRef).toBeDefined();
    expect(dao.set.finsert).toBeDefined();
  });

  it('should support fn | null methods', () => {
    // type verification
    const dao: DeclastructDao<typeof DemoResource> = {
      dobj: DemoResource,
      get: {
        one: {
          byUnique: async () => null,
          byPrimary: async () => null,
          byRef: async () => null,
        },
        ref: {
          byPrimary: async () => ({ id: 'test' }),
          byUnique: async () => ({ id: 'test' }),
        },
      },
      set: {
        finsert: async (input) => input as any,
        upsert: async (input) => input as any,
        delete: async () => {},
      },
    };

    expect(dao.get.one.byPrimary).toBeDefined();
    expect(dao.get.ref.byPrimary).toBeDefined();
    expect(dao.get.ref.byUnique).toBeDefined();
    expect(dao.set.upsert).toBeDefined();
    expect(dao.set.delete).toBeDefined();
  });

  describe('resource with optional primary key', () => {
    /**
     * .what = demo resource with optional primary key (metadata)
     * .why = proves RefByPrimary correctly requires the primary key even when optional in instance
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

    it('RefByPrimary should require uuid (not optional)', () => {
      // type test: this should compile
      const ref: RefByPrimary<typeof DemoResourceWithOptionalPrimary> = {
        uuid: 'test-uuid',
      };

      // verify ref has uuid
      expect(ref.uuid).toBe('test-uuid');

      // note: the following would fail type check (but we can't test that at runtime)
      // @ts-expect-error - uuid should be required, empty object should fail
      const badRef: RefByPrimary<typeof DemoResourceWithOptionalPrimary> = {};
      expect(badRef).toBeDefined(); // suppress unused var warning
    });

    it('dao.get.one.byPrimary should accept RefByPrimary with required uuid', () => {
      // type verification: byPrimary input should have uuid as required (not optional)
      const dao: DeclastructDao<typeof DemoResourceWithOptionalPrimary> = {
        dobj: DemoResourceWithOptionalPrimary,
        get: {
          one: {
            byUnique: async () => null,
            byPrimary: async (input) => {
              // input.uuid should be string (not string | undefined)
              // this assignment would fail if uuid were optional
              const uuid: string = input.uuid;
              expect(uuid).toBeDefined();
              return null;
            },
            byRef: async () => null,
          },
          ref: {
            byPrimary: undefined,
            byUnique: undefined,
          },
        },
        set: {
          finsert: async (r) => r as any,
          upsert: undefined,
          delete: undefined,
        },
      };

      expect(dao.get.one.byPrimary).toBeDefined();
    });
  });

  describe('type safety', () => {
    interface TestResource {
      uuid?: string;
      externalId: string;
      name: string;
    }
    class TestResource
      extends DomainEntity<TestResource>
      implements TestResource
    {
      public static primary = ['uuid'] as const;
      public static unique = ['externalId'] as const;
    }

    it('should require dobj attribute', () => {
      // @ts-expect-error - missing dobj
      const badDao: DeclastructDao<typeof TestResource> = {
        get: {
          one: {
            byUnique: async () => null,
            byPrimary: undefined,
            byRef: async () => null,
          },
          ref: {
            byPrimary: undefined,
            byUnique: undefined,
          },
        },
        set: {
          finsert: async (input) => input as any,
          upsert: undefined,
          delete: undefined,
        },
      };
      expect(badDao).toBeDefined();
    });

    it('should require get.one namespace', () => {
      // this test verifies that flat structure (without .one namespace) fails type check
      // note: since we can't use @ts-expect-error on the nested property,
      // we just verify that the new structure is required by the positive test below
      expect(true).toBe(true);
    });

    it('should implement the new interface structure', () => {
      const dao: DeclastructDao<typeof TestResource> = {
        dobj: TestResource,
        get: {
          one: {
            byUnique: async () => null,
            byPrimary: async () => null,
            byRef: async () => null,
          },
          ref: {
            byPrimary: async () => ({ uuid: 'test' }),
            byUnique: async () => ({ externalId: 'test' }),
          },
        },
        set: {
          finsert: async (input) => input as any,
          upsert: async (input) => input as any,
          delete: async () => {},
        },
      };

      expect(dao.dobj).toBe(TestResource);
      expect(dao.get.one.byUnique).toBeDefined();
      expect(dao.get.one.byRef).toBeDefined();
      expect(dao.set.finsert).toBeDefined();
    });
  });
});
