import { DomainEntity } from 'domain-objects';
import { getError } from 'helpful-errors';

import { DeclastructDao } from '../../domain.objects/DeclastructDao';
import { DeclastructProvider } from '../../domain.objects/DeclastructProvider';
import { getDaoByResource } from './getDaoByResource';

describe('getDaoByResource', () => {
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

  it('should return DAO and context when exactly one provider matches', () => {
    const demoDao: DeclastructDao<DemoResource, typeof DemoResource, any> = {
      get: {
        byUnique: async () => null,
        byRef: async () => null,
      },
      set: {
        finsert: async (input) => input as any,
      },
    };

    const providerContext = { testKey: 'testValue' };

    const provider = new DeclastructProvider({
      name: 'test-provider',
      daos: { DemoResource: demoDao },
      context: providerContext,
      hooks: {
        beforeAll: async () => {},
        afterAll: async () => {},
      },
    });

    const resource = new DemoResource({ id: 'test-1', name: 'Test' });

    const result = getDaoByResource({
      resource,
      providers: [provider],
    });

    expect(result.dao).toBe(demoDao);
    expect(result.context).toBe(providerContext);
  });

  it('should throw UnexpectedCodePathError when multiple providers support same resource', () => {
    const dao1: DeclastructDao<DemoResource, typeof DemoResource, any> = {
      get: {
        byUnique: async () => null,
        byRef: async () => null,
      },
      set: {
        finsert: async (input) => input as any,
      },
    };

    const dao2: DeclastructDao<DemoResource, typeof DemoResource, any> = {
      get: {
        byUnique: async () => null,
        byRef: async () => null,
      },
      set: {
        finsert: async (input) => input as any,
      },
    };

    const provider1 = new DeclastructProvider({
      name: 'provider-1',
      daos: { DemoResource: dao1 },
      context: {},
      hooks: {
        beforeAll: async () => {},
        afterAll: async () => {},
      },
    });

    const provider2 = new DeclastructProvider({
      name: 'provider-2',
      daos: { DemoResource: dao2 },
      context: {},
      hooks: {
        beforeAll: async () => {},
        afterAll: async () => {},
      },
    });

    const resource = new DemoResource({ id: 'test-1', name: 'Test' });

    const error = getError(() =>
      getDaoByResource({
        resource,
        providers: [provider1, provider2],
      }),
    );

    expect(error.message).toContain('multiple providers support same resource');
  });

  it('should throw UnexpectedCodePathError when no provider supports resource', () => {
    const provider = new DeclastructProvider({
      name: 'empty-provider',
      daos: {},
      context: {},
      hooks: {
        beforeAll: async () => {},
        afterAll: async () => {},
      },
    });

    const resource = new DemoResource({ id: 'test-1', name: 'Test' });

    const error = getError(() =>
      getDaoByResource({
        resource,
        providers: [provider],
      }),
    );

    expect(error.message).toContain('no DAO found for resource');
  });
});
