import { UnexpectedCodePathError } from 'helpful-errors';
import { given, then, useBeforeEach, when } from 'test-fns';

import {
  clearDemoRefStore,
  demoGetRefProvider,
  demoRefDao,
  genSampleDemoRefResource,
} from '@src/.test/assets/providers/demo-with-getref.provider';

import { getRefByUnique } from './getRefByUnique';

describe('getRefByUnique.integration', () => {
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

      when('[t0] called with RefByUnique', () => {
        then(
          'it should return the unique ref as-is without db call',
          async () => {
            const result = await getRefByUnique(
              { ref: { exid: scene.resource.exid } },
              { dao: demoRefDao },
            );
            expect(result).toEqual({ exid: scene.resource.exid });
          },
        );
      });

      when('[t1] called with RefByPrimary', () => {
        then('it should fetch resource and return unique key', async () => {
          const result = await getRefByUnique(
            { ref: { uuid: scene.resource.uuid } },
            { dao: demoRefDao },
          );
          expect(result).toEqual({ exid: scene.resource.exid });
        });
      });
    },
  );

  given('[case2] a RefByPrimary for a non-existent resource', () => {
    when('[t0] called with RefByPrimary', () => {
      then('it should return null', async () => {
        const result = await getRefByUnique(
          { ref: { uuid: 'non-existent-uuid' } },
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

    when('[t0] called with RefByPrimary for first resource', () => {
      then('it should return correct unique key', async () => {
        const result = await getRefByUnique(
          { ref: { uuid: scene.resource1.uuid } },
          { dao: demoRefDao },
        );
        expect(result).toEqual({ exid: scene.resource1.exid });
      });
    });

    when('[t1] called with RefByPrimary for second resource', () => {
      then('it should return correct unique key', async () => {
        const result = await getRefByUnique(
          { ref: { uuid: scene.resource2.uuid } },
          { dao: demoRefDao },
        );
        expect(result).toEqual({ exid: scene.resource2.exid });
      });
    });
  });

  given('[case4] verifying type safety', () => {
    const scene = useBeforeEach(async () => {
      const resource = genSampleDemoRefResource({ name: 'Type Test' });
      const persisted = await demoRefDao.set.findsert(resource, {});
      return { resource: persisted };
    });

    when('[t0] result is used as RefByUnique', () => {
      then('it should be assignable to RefByUnique type', async () => {
        const result = await getRefByUnique(
          { ref: { uuid: scene.resource.uuid } },
          { dao: demoRefDao },
        );

        // type check: result should have exid property
        expect(result).not.toBeNull();
        expect(result?.exid).toBeDefined();
        expect(typeof result?.exid).toBe('string');
      });
    });

    when('[t1] result is used to fetch resource by unique', () => {
      then('it should successfully fetch the resource', async () => {
        const uniqueRef = await getRefByUnique(
          { ref: { uuid: scene.resource.uuid } },
          { dao: demoRefDao },
        );

        expect(uniqueRef).not.toBeNull();
        if (!uniqueRef)
          throw new UnexpectedCodePathError('uniqueRef should not be null');
        const fetched = await demoRefDao.get.one.byUnique(uniqueRef, {});
        expect(fetched).not.toBeNull();
        expect(fetched?.uuid).toEqual(scene.resource.uuid);
        expect(fetched?.exid).toEqual(scene.resource.exid);
        expect(fetched?.name).toEqual(scene.resource.name);
      });
    });
  });

  given('[case5] round-trip ref resolution', () => {
    const scene = useBeforeEach(async () => {
      const resource = genSampleDemoRefResource({ name: 'Round Trip Test' });
      const persisted = await demoRefDao.set.findsert(resource, {});
      return { resource: persisted };
    });

    when('[t0] converting primary to unique and back', () => {
      then('it should preserve the original reference', async () => {
        // need to import getRefByPrimary for round-trip test
        const { getRefByPrimary } = await import('./getRefByPrimary');

        const originalPrimary = { uuid: scene.resource.uuid };

        // primary -> unique
        const uniqueRef = await getRefByUnique(
          { ref: originalPrimary },
          { dao: demoRefDao },
        );
        expect(uniqueRef).not.toBeNull();
        if (!uniqueRef)
          throw new UnexpectedCodePathError('uniqueRef should not be null');

        // unique -> primary
        const backToPrimary = await getRefByPrimary(
          { ref: uniqueRef },
          { dao: demoRefDao },
        );

        expect(backToPrimary).toEqual(originalPrimary);
      });
    });
  });
});
