import { DomainEntity } from 'domain-objects';

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
});
