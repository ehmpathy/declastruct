import { DomainEntity } from 'domain-objects';
import { given, then, when } from 'test-fns';

import type { DeclastructDao } from '../../domain.objects/DeclastructDao';
import { getRefByUnique } from './getRefByUnique';

describe('getRefByUnique', () => {
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

  given('RefByUnique input', () => {
    when('getRefByUnique is called', () => {
      then('it should return input as-is without db call', async () => {
        // setup spy to verify no db call is made
        const byPrimarySpy = jest.fn();

        const dao: DeclastructDao<typeof TestResource, any> = {
          dobj: TestResource,
          get: {
            one: {
              byUnique: async () => null,
              byPrimary: byPrimarySpy,
              byRef: async () => null,
            },
            ref: {
              byPrimary: undefined,
              byUnique: undefined,
            },
          },
          set: {
            findsert: async (r) => r as any,
            upsert: undefined,
            delete: undefined,
          },
        };

        // call with RefByUnique
        const result = await getRefByUnique(
          { ref: { externalId: 'ext-123' } },
          { dao },
        );

        // verify result
        expect(result).toEqual({ externalId: 'ext-123' });

        // verify no db call was made
        expect(byPrimarySpy).not.toHaveBeenCalled();
      });
    });
  });

  given('RefByPrimary input', () => {
    when('resource exists', () => {
      then('it should fetch resource and return unique key', async () => {
        const foundResource = new TestResource({
          uuid: 'found-uuid',
          externalId: 'ext-123',
          name: 'Found Resource',
        });

        const byPrimarySpy = jest.fn().mockResolvedValue(foundResource);

        const dao: DeclastructDao<typeof TestResource, any> = {
          dobj: TestResource,
          get: {
            one: {
              byUnique: async () => null,
              byPrimary: byPrimarySpy,
              byRef: async () => null,
            },
            ref: {
              byPrimary: undefined,
              byUnique: undefined,
            },
          },
          set: {
            findsert: async (r) => r as any,
            upsert: undefined,
            delete: undefined,
          },
        };

        // call with RefByPrimary
        const result = await getRefByUnique(
          { ref: { uuid: 'found-uuid' } },
          { dao },
        );

        // verify result is RefByUnique
        expect(result).toEqual({ externalId: 'ext-123' });

        // verify db call was made with full context
        expect(byPrimarySpy).toHaveBeenCalledWith(
          { uuid: 'found-uuid' },
          { dao },
        );
      });
    });

    when('resource does not exist', () => {
      then('it should return null', async () => {
        const byPrimarySpy = jest.fn().mockResolvedValue(null);

        const dao: DeclastructDao<typeof TestResource, any> = {
          dobj: TestResource,
          get: {
            one: {
              byUnique: async () => null,
              byPrimary: byPrimarySpy,
              byRef: async () => null,
            },
            ref: {
              byPrimary: undefined,
              byUnique: undefined,
            },
          },
          set: {
            findsert: async (r) => r as any,
            upsert: undefined,
            delete: undefined,
          },
        };

        // call with RefByPrimary for non-existent resource
        const result = await getRefByUnique(
          { ref: { uuid: 'not-found' } },
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
              byPrimary: async () => null,
              byRef: async () => null,
            },
            ref: {
              byPrimary: undefined,
              byUnique: undefined,
            },
          },
          set: {
            findsert: async (r) => r as any,
            upsert: undefined,
            delete: undefined,
          },
        };

        // verify it can be passed to getRefByUnique
        expect(async () => {
          await getRefByUnique({ ref: { externalId: 'test' } }, { dao });
        }).toBeDefined();
      });
    });
  });

  given('getRefByUnique output', () => {
    when('called with RefByPrimary', () => {
      then('output type should be RefByUnique', async () => {
        const foundResource = new TestResource({
          uuid: 'found-uuid',
          externalId: 'ext-123',
          name: 'Found Resource',
        });

        const dao: DeclastructDao<typeof TestResource, any> = {
          dobj: TestResource,
          get: {
            one: {
              byUnique: async () => null,
              byPrimary: async () => foundResource,
              byRef: async () => null,
            },
            ref: {
              byPrimary: undefined,
              byUnique: undefined,
            },
          },
          set: {
            findsert: async (r) => r as any,
            upsert: undefined,
            delete: undefined,
          },
        };

        // call and check output type
        const result = await getRefByUnique(
          { ref: { uuid: 'found-uuid' } },
          { dao },
        );

        // type assertion: result should have externalId (unique key), not uuid (primary key)
        expect(result).not.toBeNull();
        expect(result?.externalId).toBe('ext-123');
      });
    });
  });
});
