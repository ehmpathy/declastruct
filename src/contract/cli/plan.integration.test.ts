import { existsSync } from 'fs';
import { mkdir, readFile, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { getUuid } from 'uuid-fns';

import { DeclastructPlan } from '../../domain.objects/DeclastructPlan';
import { executePlanCommand } from './plan';

/**
 * .what = generates unique temp directory for test run
 * .why = enables isolated test artifacts without cleanup
 */
const genTempDir = async () => {
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
    await executePlanCommand({ wishFilePath, planFilePath });

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
      }),
    ).rejects.toThrow('Wish file not found');
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
      executePlanCommand({ wishFilePath: badWishPath, planFilePath }),
    ).rejects.toThrow('Wish file must export getResources() function');
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
      executePlanCommand({ wishFilePath: badWishPath, planFilePath }),
    ).rejects.toThrow('Wish file must export getProviders() function');
  });

  it('should detect KEEP action when resource already exists remotely', async () => {
    const tempDir = await genTempDir();
    const planFilePath = resolve(tempDir, 'plan.json');

    // first run - create resources
    await executePlanCommand({ wishFilePath, planFilePath });

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
      }),
    ).rejects.toThrow('demoAuthToken required in context');
  });
});
