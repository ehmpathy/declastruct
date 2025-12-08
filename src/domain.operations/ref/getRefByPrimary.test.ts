import { DomainEntity } from 'domain-objects';
import { given, then, when } from 'test-fns';

import type { DeclastructDao } from '../../domain.objects/DeclastructDao';
import { getRefByPrimary } from './getRefByPrimary';

describe('getRefByPrimary', () => {
  /**
   * .what = test resource with both primary and unique keys
   */
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

  given('RefByPrimary input', () => {
    when('getRefByPrimary is called', () => {
      then('it should return input as-is without db call', async () => {
        // setup spy to verify no db call is made
        const byUniqueSpy = jest.fn();

        const dao: DeclastructDao<typeof TestResource, any> = {
          dobj: TestResource,
          get: {
            one: {
              byUnique: byUniqueSpy,
              byPrimary: null,
              byRef: async () => null,
            },
            ref: {
              byPrimary: null,
              byUnique: null,
            },
          },
          set: {
            finsert: async (r) => r as any,
            upsert: null,
            delete: null,
          },
        };

        // call with RefByPrimary
        const result = await getRefByPrimary(
          { ref: { uuid: 'test-uuid' } },
          { dao },
        );

        // verify result
        expect(result).toEqual({ uuid: 'test-uuid' });

        // verify no db call was made
        expect(byUniqueSpy).not.toHaveBeenCalled();
      });
    });
  });

  given('RefByUnique input', () => {
    when('resource exists', () => {
      then('it should fetch resource and return primary key', async () => {
        const foundResource = new TestResource({
          uuid: 'found-uuid',
          externalId: 'ext-123',
          name: 'Found Resource',
        });

        const byUniqueSpy = jest.fn().mockResolvedValue(foundResource);

        const dao: DeclastructDao<typeof TestResource, any> = {
          dobj: TestResource,
          get: {
            one: {
              byUnique: byUniqueSpy,
              byPrimary: null,
              byRef: async () => null,
            },
            ref: {
              byPrimary: null,
              byUnique: null,
            },
          },
          set: {
            finsert: async (r) => r as any,
            upsert: null,
            delete: null,
          },
        };

        // call with RefByUnique
        const result = await getRefByPrimary(
          { ref: { externalId: 'ext-123' } },
          { dao },
        );

        // verify result is RefByPrimary
        expect(result).toEqual({ uuid: 'found-uuid' });

        // verify db call was made with full context
        expect(byUniqueSpy).toHaveBeenCalledWith(
          { externalId: 'ext-123' },
          { dao },
        );
      });
    });

    when('resource does not exist', () => {
      then('it should return null', async () => {
        const byUniqueSpy = jest.fn().mockResolvedValue(null);

        const dao: DeclastructDao<typeof TestResource, any> = {
          dobj: TestResource,
          get: {
            one: {
              byUnique: byUniqueSpy,
              byPrimary: null,
              byRef: async () => null,
            },
            ref: {
              byPrimary: null,
              byUnique: null,
            },
          },
          set: {
            finsert: async (r) => r as any,
            upsert: null,
            delete: null,
          },
        };

        // call with RefByUnique for non-existent resource
        const result = await getRefByPrimary(
          { ref: { externalId: 'not-found' } },
          { dao },
        );

        // verify null is returned
        expect(result).toBeNull();
      });
    });
  });

  given('a dao for the resource', () => {
    when('used in context', () => {
      then('it should fit the context shape', () => {
        // type test: verify dao fits context shape
        const dao: DeclastructDao<typeof TestResource, any> = {
          dobj: TestResource,
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
            finsert: async (r) => r as any,
            upsert: null,
            delete: null,
          },
        };

        // verify it can be passed to getRefByPrimary
        expect(async () => {
          await getRefByPrimary({ ref: { uuid: 'test' } }, { dao });
        }).toBeDefined();
      });
    });
  });

  given('getRefByPrimary output', () => {
    when('called with RefByUnique', () => {
      then('output type should be RefByPrimary', async () => {
        const foundResource = new TestResource({
          uuid: 'found-uuid',
          externalId: 'ext-123',
          name: 'Found Resource',
        });

        const dao: DeclastructDao<typeof TestResource, any> = {
          dobj: TestResource,
          get: {
            one: {
              byUnique: async () => foundResource,
              byPrimary: null,
              byRef: async () => null,
            },
            ref: {
              byPrimary: null,
              byUnique: null,
            },
          },
          set: {
            finsert: async (r) => r as any,
            upsert: null,
            delete: null,
          },
        };

        // call and check output type
        const result = await getRefByPrimary(
          { ref: { externalId: 'ext-123' } },
          { dao },
        );

        // type assertion: result should have uuid (primary key), not externalId (unique key)
        expect(result).not.toBeNull();
        expect(result?.uuid).toBe('found-uuid');
      });
    });
  });
});
