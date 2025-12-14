import { UnexpectedCodePathError } from 'helpful-errors';
import { given, then, useBeforeEach, when } from 'test-fns';

import {
  clearDemoRefStore,
  demoGetRefProvider,
  demoRefDao,
  genSampleDemoRefResource,
} from '../../.test/assets/providers/demo-with-getref.provider';
import { getRefByPrimary } from './getRefByPrimary';

describe('getRefByPrimary.integration', () => {
  beforeAll(async () => {
    await demoGetRefProvider.hooks.beforeAll();
  });

  beforeEach(async () => {
    await clearDemoRefStore();
  });

  afterAll(async () => {
    await demoGetRefProvider.hooks.afterAll();
  });

  given(
    '[case1] a persisted resource with both primary and unique keys',
    () => {
      const scene = useBeforeEach(async () => {
        const resource = genSampleDemoRefResource({ name: 'Test Resource' });
        const persisted = await demoRefDao.set.findsert(resource, {});
        return { resource: persisted };
      });

      when('[t0] called with RefByPrimary', () => {
        then(
          'it should return the primary ref as-is without db call',
          async () => {
            const result = await getRefByPrimary(
              { ref: { uuid: scene.resource.uuid } },
              { dao: demoRefDao },
            );
            expect(result).toEqual({ uuid: scene.resource.uuid });
          },
        );
      });

      when('[t1] called with RefByUnique', () => {
        then('it should fetch resource and return primary key', async () => {
          const result = await getRefByPrimary(
            { ref: { exid: scene.resource.exid } },
            { dao: demoRefDao },
          );
          expect(result).toEqual({ uuid: scene.resource.uuid });
        });
      });
    },
  );

  given('[case2] a RefByUnique for a non-existent resource', () => {
    when('[t0] called with RefByUnique', () => {
      then('it should return null', async () => {
        const result = await getRefByPrimary(
          { ref: { exid: 'non-existent-exid' } },
          { dao: demoRefDao },
        );
        expect(result).toBeNull();
      });
    });
  });

  given('[case3] multiple resources persisted', () => {
    const scene = useBeforeEach(async () => {
      const resource1 = genSampleDemoRefResource({ name: 'First Resource' });
      const resource2 = genSampleDemoRefResource({ name: 'Second Resource' });
      const persisted1 = await demoRefDao.set.findsert(resource1, {});
      const persisted2 = await demoRefDao.set.findsert(resource2, {});
      return { resource1: persisted1, resource2: persisted2 };
    });

    when('[t0] called with RefByUnique for first resource', () => {
      then('it should return correct primary key', async () => {
        const result = await getRefByPrimary(
          { ref: { exid: scene.resource1.exid } },
          { dao: demoRefDao },
        );
        expect(result).toEqual({ uuid: scene.resource1.uuid });
      });
    });

    when('[t1] called with RefByUnique for second resource', () => {
      then('it should return correct primary key', async () => {
        const result = await getRefByPrimary(
          { ref: { exid: scene.resource2.exid } },
          { dao: demoRefDao },
        );
        expect(result).toEqual({ uuid: scene.resource2.uuid });
      });
    });
  });

  given('[case4] verifying type safety', () => {
    const scene = useBeforeEach(async () => {
      const resource = genSampleDemoRefResource({ name: 'Type Test' });
      const persisted = await demoRefDao.set.findsert(resource, {});
      return { resource: persisted };
    });

    when('[t0] result is used as RefByPrimary', () => {
      then('it should be assignable to RefByPrimary type', async () => {
        const result = await getRefByPrimary(
          { ref: { exid: scene.resource.exid } },
          { dao: demoRefDao },
        );

        // type check: result should have uuid property
        expect(result).not.toBeNull();
        expect(result?.uuid).toBeDefined();
        expect(typeof result?.uuid).toBe('string');
      });
    });

    when('[t1] result is used to fetch resource by primary', () => {
      then('it should successfully fetch the resource', async () => {
        const primaryRef = await getRefByPrimary(
          { ref: { exid: scene.resource.exid } },
          { dao: demoRefDao },
        );

        expect(primaryRef).not.toBeNull();
        if (!primaryRef)
          throw new UnexpectedCodePathError('primaryRef should not be null');
        const byPrimary = demoRefDao.get.one.byPrimary;
        expect(byPrimary).not.toBeNull();

        const fetched = await byPrimary?.(primaryRef, {});
        expect(fetched).not.toBeNull();
        expect(fetched?.uuid).toEqual(scene.resource.uuid);
        expect(fetched?.exid).toEqual(scene.resource.exid);
        expect(fetched?.name).toEqual(scene.resource.name);
      });
    });
  });
});
