import { DomainEntity, RefByPrimary } from 'domain-objects';

import { DeclastructDao } from './DeclastructDao';

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
    const dao: DeclastructDao<DemoResource, typeof DemoResource> = {
      get: {
        byUnique: async () => null,
        byRef: async () => null,
      },
      set: {
        finsert: async (input) => input as any,
      },
    };

    expect(dao.get.byUnique).toBeDefined();
    expect(dao.get.byRef).toBeDefined();
    expect(dao.set.finsert).toBeDefined();
  });

  it('should support optional methods', () => {
    // type verification
    const dao: DeclastructDao<DemoResource, typeof DemoResource> = {
      get: {
        byUnique: async () => null,
        byPrimary: async () => null,
        byRef: async () => null,
      },
      set: {
        finsert: async (input) => input as any,
        upsert: async (input) => input as any,
        delete: async () => {},
      },
    };

    expect(dao.get.byPrimary).toBeDefined();
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

    it('dao.get.byPrimary should accept RefByPrimary with required uuid', () => {
      // type verification: byPrimary input should have uuid as required (not optional)
      const dao: DeclastructDao<
        DemoResourceWithOptionalPrimary,
        typeof DemoResourceWithOptionalPrimary
      > = {
        get: {
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
        set: { finsert: async (r) => r as any },
      };

      expect(dao.get.byPrimary).toBeDefined();
    });
  });
});
