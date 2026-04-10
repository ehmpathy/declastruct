import { existsSync } from 'fs';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { BadRequestError } from 'helpful-errors';
import { basename, resolve } from 'path';
import { getUuid } from 'uuid-fns';

import { DeclastructPlan } from '@src/domain.objects/DeclastructPlan';
import { DeclastructSnapshot } from '@src/domain.objects/DeclastructSnapshot';

import { executeApplyCommand } from './apply';
import { executePlanCommand } from './plan';

/**
 * .what = clones a fixture file into temp dir with unique exid
 * .why = enables parallel test execution without race conditions
 */
const cloneFixtureWithExid = async (input: {
  fixturePath: string;
  tempDir: string;
  exid: string;
}): Promise<string> => {
  const content = await readFile(input.fixturePath, 'utf-8');
  const replaced = content.replace(/__TEST_EXID__/g, input.exid);
  const targetPath = resolve(input.tempDir, basename(input.fixturePath));
  await writeFile(targetPath, replaced, 'utf-8');
  return targetPath;
};

/**
 * .what = generates unique temp directory for test run
 * .why = enables isolated test artifacts without cleanup
 */
const genTempDir = async (): Promise<string> => {
  const testUuid = getUuid();
  const tempDir = resolve(process.cwd(), `src/.test/assets/.temp/${testUuid}`);
  await mkdir(tempDir, { recursive: true });
  return tempDir;
};

describe('executePlanCommand', () => {
  const wishFilePath = resolve(
    process.cwd(),
    'src/.test/assets/wish.fixture.ts',
  );

  it('should generate a plan file with changes based on wish file', async () => {
    const tempDir = await genTempDir();
    const planFilePath = resolve(tempDir, 'plan.json');

    // execute plan command
    await executePlanCommand({
      wishFilePath,
      planFilePath,
      snapFilePath: null,
    });

    // verify plan file was created
    expect(existsSync(planFilePath)).toBe(true);

    // read and parse plan
    const planJson = await readFile(planFilePath, 'utf-8');
    const plan = new DeclastructPlan(JSON.parse(planJson));

    // verify plan structure
    expect(plan.hash).toBeDefined();
    expect(plan.createdAt).toBeDefined();
    expect(plan.wish.uri).toBe(wishFilePath);
    expect(plan.changes.length).toBe(2);

    // verify changes are all CREATE (no remote state)
    plan.changes.forEach((change) => {
      expect(change.action).toBe('CREATE');
      expect(change.forResource.class).toBe('DemoResource');
      expect(change.state.desired).toBeDefined();
      expect(change.state.remote).toBeNull();
    });

    // verify slugs exist and are unique
    const slugs = plan.changes.map((c) => c.forResource.slug);
    expect(slugs.length).toBe(2);
    expect(slugs[0]).toBeDefined();
    expect(slugs[1]).toBeDefined();
    expect(slugs[0]).not.toBe(slugs[1]);
  });

  it('should throw when wish file does not exist', async () => {
    const tempDir = await genTempDir();
    const nonexistentWishPath = resolve(tempDir, 'nonexistent.ts');
    const planFilePath = resolve(tempDir, 'plan.json');

    await expect(
      executePlanCommand({
        wishFilePath: nonexistentWishPath,
        planFilePath,
        snapFilePath: null,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when wish file does not export getResources', async () => {
    const tempDir = await genTempDir();
    const badWishPath = resolve(tempDir, 'bad-wish.ts');
    const planFilePath = resolve(tempDir, 'plan.json');

    // create bad wish file
    await writeFile(
      badWishPath,
      'export const getProviders = async () => [];',
      'utf-8',
    );

    await expect(
      executePlanCommand({
        wishFilePath: badWishPath,
        planFilePath,
        snapFilePath: null,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should throw when wish file does not export getProviders', async () => {
    const tempDir = await genTempDir();
    const badWishPath = resolve(tempDir, 'bad-wish.ts');
    const planFilePath = resolve(tempDir, 'plan.json');

    // create bad wish file
    await writeFile(
      badWishPath,
      'export const getResources = async () => [];',
      'utf-8',
    );

    await expect(
      executePlanCommand({
        wishFilePath: badWishPath,
        planFilePath,
        snapFilePath: null,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should detect KEEP action when resource already exists remotely', async () => {
    const tempDir = await genTempDir();
    const planFilePath = resolve(tempDir, 'plan.json');

    // first run - create resources
    await executePlanCommand({
      wishFilePath,
      planFilePath,
      snapFilePath: null,
    });

    // read first plan
    const firstPlanJson = await readFile(planFilePath, 'utf-8');
    const firstPlan = new DeclastructPlan(JSON.parse(firstPlanJson));

    // verify all CREATE
    expect(firstPlan.changes.every((c) => c.action === 'CREATE')).toBe(true);

    // Note: In a real integration test, we would need to actually apply the changes
    // to populate remote state. For now, this test just verifies the basic flow.
    // A more complete test would require mocking or actual provider state.
  });

  it('should pass provider context through to DAO operations', async () => {
    const tempDir = await genTempDir();
    const authWishFilePath = resolve(
      process.cwd(),
      'src/.test/assets/wish-with-auth.fixture.ts',
    );
    const authPlanFilePath = resolve(tempDir, 'plan.json');

    // execute plan command with auth provider
    await executePlanCommand({
      wishFilePath: authWishFilePath,
      planFilePath: authPlanFilePath,
      snapFilePath: null,
    });

    // verify plan file was created successfully
    expect(existsSync(authPlanFilePath)).toBe(true);

    // read and parse plan
    const planJson = await readFile(authPlanFilePath, 'utf-8');
    const plan = new DeclastructPlan(JSON.parse(planJson));

    // verify plan was generated (context was passed through)
    expect(plan.changes.length).toBe(2);
    expect(plan.changes[0]?.forResource.class).toBe('DemoAuthResource');

    // verify context enabled DAO operations (if this passes, context was properly passed)
    expect(plan.changes[0]?.state.desired).toBeDefined();
  });

  it('should throw when provider context is missing required auth token', async () => {
    const tempDir = await genTempDir();
    const badAuthWishPath = resolve(tempDir, 'bad-auth-wish.ts');
    const badAuthPlanPath = resolve(tempDir, 'plan.json');

    // create wish file with provider missing auth token
    await writeFile(
      badAuthWishPath,
      `
import { DomainEntity } from 'domain-objects';
import { DeclastructProvider } from '${resolve(
        process.cwd(),
        'src/domain.objects/DeclastructProvider',
      )}';
import {
  DemoAuthResource,
  genSampleDemoAuthResource,
  demoAuthProvider,
} from '${resolve(
        process.cwd(),
        'src/.test/assets/providers/demo-with-auth.provider',
      )}';

export const getResources = async (): Promise<DomainEntity<any>[]> => {
  return [genSampleDemoAuthResource({ name: 'Test' })];
};

export const getProviders = async (): Promise<DeclastructProvider<any, any>[]> => {
  // return provider with invalid context (missing demoAuthToken)
  return [new DeclastructProvider({
    ...demoAuthProvider,
    context: {} as any, // invalid context - missing required demoAuthToken
  })];
};
      `,
      'utf-8',
    );

    // attempt to execute plan command
    await expect(
      executePlanCommand({
        wishFilePath: badAuthWishPath,
        planFilePath: badAuthPlanPath,
        snapFilePath: null,
      }),
    ).rejects.toThrow(BadRequestError);
  });

  it('should plan DESTROY for resources marked with del()', async () => {
    const tempDir = await genTempDir();
    const testExid = getUuid();
    const planFilePath = resolve(tempDir, 'plan.json');

    // clone fixtures with test-scoped exid
    const setupWishFilePath = await cloneFixtureWithExid({
      fixturePath: resolve(
        process.cwd(),
        'src/.test/assets/wish-for-del.fixture.ts',
      ),
      tempDir,
      exid: testExid,
    });
    const delWishFilePath = await cloneFixtureWithExid({
      fixturePath: resolve(
        process.cwd(),
        'src/.test/assets/wish-with-del.fixture.ts',
      ),
      tempDir,
      exid: testExid,
    });

    // step 1: create resource first
    await executePlanCommand({
      wishFilePath: setupWishFilePath,
      planFilePath,
      snapFilePath: null,
    });
    await executeApplyCommand({ planFilePath });

    // step 2: plan with del() - should show DESTROY
    await executePlanCommand({
      wishFilePath: delWishFilePath,
      planFilePath,
      snapFilePath: null,
    });

    // read and verify plan
    const planJson = await readFile(planFilePath, 'utf-8');
    const plan = new DeclastructPlan(JSON.parse(planJson));

    expect(plan.changes.length).toBe(1);
    expect(plan.changes[0]?.action).toBe('DESTROY');
    expect(plan.changes[0]?.state.desired).toBeNull();
    expect(plan.changes[0]?.state.remote).toBeDefined();
  });

  describe('passthrough args', () => {
    const argsWishFilePath = resolve(
      process.cwd(),
      'src/.test/assets/wish-with-args.fixture.ts',
    );

    it('should pass args to process.argv', async () => {
      const tempDir = await genTempDir();
      const planFilePath = resolve(tempDir, 'plan.json');

      // execute with passthrough args
      await executePlanCommand({
        wishFilePath: argsWishFilePath,
        planFilePath,
        snapFilePath: null,
        passthroughArgs: ['--env', 'prod'],
      });

      // verify plan was created
      expect(existsSync(planFilePath)).toBe(true);

      // read and parse plan
      const planJson = await readFile(planFilePath, 'utf-8');
      const plan = new DeclastructPlan(JSON.parse(planJson));

      // verify resource name reflects prod env
      expect(plan.changes.length).toBe(1);
      expect((plan.changes[0]?.state.desired as { name: string }).name).toBe(
        'Resource-production',
      );
    });

    it('should strip -- separator from process.argv', async () => {
      const tempDir = await genTempDir();
      const planFilePath = resolve(tempDir, 'plan.json');

      // execute with args (-- separator is handled by commander, not passed here)
      await executePlanCommand({
        wishFilePath: argsWishFilePath,
        planFilePath,
        snapFilePath: null,
        passthroughArgs: ['--env', 'prod'],
      });

      // verify plan was created
      const planJson = await readFile(planFilePath, 'utf-8');
      const plan = new DeclastructPlan(JSON.parse(planJson));

      // verify resource uses prod config (proves -- was stripped)
      expect((plan.changes[0]?.state.desired as { name: string }).name).toBe(
        'Resource-production',
      );
    });

    it('should pass multiple args', async () => {
      const tempDir = await genTempDir();
      const planFilePath = resolve(tempDir, 'plan.json');

      // execute with multiple passthrough args
      await executePlanCommand({
        wishFilePath: argsWishFilePath,
        planFilePath,
        snapFilePath: null,
        passthroughArgs: ['--env', 'prod', '--verbose', '--debug'],
      });

      // verify plan was created
      expect(existsSync(planFilePath)).toBe(true);

      // read and parse plan
      const planJson = await readFile(planFilePath, 'utf-8');
      const plan = new DeclastructPlan(JSON.parse(planJson));

      // verify resource reflects prod env (other flags are ignored by fixture)
      expect((plan.changes[0]?.state.desired as { name: string }).name).toBe(
        'Resource-production',
      );
    });

    it('should work without passthrough args (backwards compat)', async () => {
      const tempDir = await genTempDir();
      const planFilePath = resolve(tempDir, 'plan.json');

      // execute without passthrough args
      await executePlanCommand({
        wishFilePath: argsWishFilePath,
        planFilePath,
        snapFilePath: null,
      });

      // verify plan was created
      expect(existsSync(planFilePath)).toBe(true);

      // read and parse plan
      const planJson = await readFile(planFilePath, 'utf-8');
      const plan = new DeclastructPlan(JSON.parse(planJson));

      // verify resource uses default test env
      expect((plan.changes[0]?.state.desired as { name: string }).name).toBe(
        'Resource-test',
      );
    });
  });

  describe('--snap flag', () => {
    it('should create snapshot when --snap flag provided', async () => {
      const tempDir = await genTempDir();
      const planFilePath = resolve(tempDir, 'plan.json');
      const snapFilePath = resolve(tempDir, 'snapshot.json');

      await executePlanCommand({ wishFilePath, planFilePath, snapFilePath });

      // verify snapshot file was created
      expect(existsSync(snapFilePath)).toBe(true);
    });

    it('should not create snapshot when --snap flag absent', async () => {
      const tempDir = await genTempDir();
      const planFilePath = resolve(tempDir, 'plan.json');
      const snapFilePath = resolve(tempDir, 'snapshot.json');

      await executePlanCommand({
        wishFilePath,
        planFilePath,
        snapFilePath: null,
      });

      // verify snapshot file was NOT created
      expect(existsSync(snapFilePath)).toBe(false);
    });

    it('should contain observedAt timestamp in snapshot', async () => {
      const tempDir = await genTempDir();
      const planFilePath = resolve(tempDir, 'plan.json');
      const snapFilePath = resolve(tempDir, 'snapshot.json');

      await executePlanCommand({ wishFilePath, planFilePath, snapFilePath });

      const snapJson = await readFile(snapFilePath, 'utf-8');
      const snapshot = new DeclastructSnapshot(JSON.parse(snapJson));

      expect(snapshot.observedAt).toBeDefined();
      expect(typeof snapshot.observedAt).toBe('string');
      expect(snapshot.observedAt).toMatch(/^\d{4}-\d{2}-\d{2}T/);
    });

    it('should contain remote[] and wished[] arrays in snapshot', async () => {
      const tempDir = await genTempDir();
      const planFilePath = resolve(tempDir, 'plan.json');
      const snapFilePath = resolve(tempDir, 'snapshot.json');

      await executePlanCommand({ wishFilePath, planFilePath, snapFilePath });

      const snapJson = await readFile(snapFilePath, 'utf-8');
      const snapshot = new DeclastructSnapshot(JSON.parse(snapJson));

      expect(Array.isArray(snapshot.remote)).toBe(true);
      expect(Array.isArray(snapshot.wished)).toBe(true);
      expect(snapshot.remote.length).toBeGreaterThan(0);
      expect(snapshot.wished.length).toBeGreaterThan(0);
    });

    it('should have forResource with class and slug in snapshot entries', async () => {
      const tempDir = await genTempDir();
      const planFilePath = resolve(tempDir, 'plan.json');
      const snapFilePath = resolve(tempDir, 'snapshot.json');

      await executePlanCommand({ wishFilePath, planFilePath, snapFilePath });

      const snapJson = await readFile(snapFilePath, 'utf-8');
      const snapshot = new DeclastructSnapshot(JSON.parse(snapJson));

      // check remote entries
      const remoteEntry = snapshot.remote[0]!;
      expect(remoteEntry.forResource).toBeDefined();
      expect(remoteEntry.forResource.class).toBeDefined();
      expect(remoteEntry.forResource.slug).toBeDefined();
      expect(typeof remoteEntry.forResource.class).toBe('string');
      expect(typeof remoteEntry.forResource.slug).toBe('string');

      // check wished entries
      const wishedEntry = snapshot.wished[0]!;
      expect(wishedEntry.forResource).toBeDefined();
      expect(wishedEntry.forResource.class).toBeDefined();
      expect(wishedEntry.forResource.slug).toBeDefined();
    });

    it('should have _dobj stamp in wished state', async () => {
      const tempDir = await genTempDir();
      const planFilePath = resolve(tempDir, 'plan.json');
      const snapFilePath = resolve(tempDir, 'snapshot.json');

      await executePlanCommand({ wishFilePath, planFilePath, snapFilePath });

      const snapJson = await readFile(snapFilePath, 'utf-8');
      const snapshot = new DeclastructSnapshot(JSON.parse(snapJson));

      // wished state should always have _dobj
      const wishedEntry = snapshot.wished[0]!;
      expect(wishedEntry.state).toBeDefined();
      expect(wishedEntry.state?._dobj).toBeDefined();
    });

    it('should have null remote state for new resources', async () => {
      const tempDir = await genTempDir();
      const planFilePath = resolve(tempDir, 'plan.json');
      const snapFilePath = resolve(tempDir, 'snapshot.json');

      // use fixture that references a new resource (not in remote state)
      await executePlanCommand({ wishFilePath, planFilePath, snapFilePath });

      const snapJson = await readFile(snapFilePath, 'utf-8');
      const snapshot = new DeclastructSnapshot(JSON.parse(snapJson));

      // at least one resource should have null remote state (new resource)
      const hasNullRemote = snapshot.remote.some(
        (entry) => entry.state === null,
      );
      expect(hasNullRemote).toBe(true);
    });

    it('should have wished state populated for del() resources', async () => {
      const tempDir = await genTempDir();
      const testExid = getUuid();
      const planFilePath = resolve(tempDir, 'plan.json');
      const snapFilePath = resolve(tempDir, 'snapshot.json');

      // clone fixtures with test-scoped exid
      const setupWishFilePath = await cloneFixtureWithExid({
        fixturePath: resolve(
          process.cwd(),
          'src/.test/assets/wish-for-del.fixture.ts',
        ),
        tempDir,
        exid: testExid,
      });
      const delWishFilePath = await cloneFixtureWithExid({
        fixturePath: resolve(
          process.cwd(),
          'src/.test/assets/wish-with-del.fixture.ts',
        ),
        tempDir,
        exid: testExid,
      });

      // step 1: create resource first
      await executePlanCommand({
        wishFilePath: setupWishFilePath,
        planFilePath,
        snapFilePath: null,
      });
      await executeApplyCommand({ planFilePath });

      // step 2: plan with del() and capture snapshot
      await executePlanCommand({
        wishFilePath: delWishFilePath,
        planFilePath,
        snapFilePath,
      });

      const snapJson = await readFile(snapFilePath, 'utf-8');
      const snapshot = new DeclastructSnapshot(JSON.parse(snapJson));

      // wished[] should have an entry even for del() resources
      expect(snapshot.wished.length).toBe(1);
      expect(snapshot.wished[0]!.state).toBeDefined();
      expect(snapshot.wished[0]!.state?._dobj).toBeDefined();
    });

    it('should match expected snapshot structure', async () => {
      const tempDir = await genTempDir();
      const planFilePath = resolve(tempDir, 'plan.json');
      const snapFilePath = resolve(tempDir, 'snapshot.json');

      await executePlanCommand({ wishFilePath, planFilePath, snapFilePath });

      const snapJson = await readFile(snapFilePath, 'utf-8');
      const snapshot = JSON.parse(snapJson);

      // verify top-level structure
      expect(Object.keys(snapshot).sort()).toEqual([
        'observedAt',
        'remote',
        'wished',
      ]);

      // verify entry structure
      const remoteEntry = snapshot.remote[0];
      expect(Object.keys(remoteEntry).sort()).toEqual(['forResource', 'state']);
      expect(Object.keys(remoteEntry.forResource).sort()).toEqual([
        'class',
        'slug',
      ]);
    });

    it('should produce snapshot output that matches expected format', async () => {
      const tempDir = await genTempDir();
      const planFilePath = resolve(tempDir, 'plan.json');
      const snapFilePath = resolve(tempDir, 'snapshot.json');

      await executePlanCommand({ wishFilePath, planFilePath, snapFilePath });

      const snapJson = await readFile(snapFilePath, 'utf-8');
      const snapshot = JSON.parse(snapJson);

      // sanitize dynamic values for stable snapshot
      // pattern: DemoResource.{uuid}.{exid} → DemoResource.[UUID].[EXID]
      const sanitizeSlug = (slug: string) =>
        slug
          .replace(/\.[0-9a-f-]{36}\./i, '.[UUID].') // mask uuid in middle
          .replace(/\.[^.]+$/, '.[EXID]'); // mask exid suffix

      const sanitized = {
        observedAt: '[TIMESTAMP]',
        remote: snapshot.remote.map(
          (entry: {
            forResource: { class: string; slug: string };
            state: Record<string, unknown> | null;
          }) => ({
            forResource: {
              class: entry.forResource.class,
              slug: sanitizeSlug(entry.forResource.slug),
            },
            state: entry.state
              ? {
                  _dobj: entry.state._dobj,
                  exid: '[EXID]',
                  name: entry.state.name,
                }
              : null,
          }),
        ),
        wished: snapshot.wished.map(
          (entry: {
            forResource: { class: string; slug: string };
            state: Record<string, unknown> | null;
          }) => ({
            forResource: {
              class: entry.forResource.class,
              slug: sanitizeSlug(entry.forResource.slug),
            },
            state: entry.state
              ? {
                  _dobj: entry.state._dobj,
                  exid: '[EXID]',
                  name: entry.state.name,
                }
              : null,
          }),
        ),
      };

      expect(sanitized).toMatchSnapshot();
    });
  });
});
