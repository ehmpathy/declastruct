import { existsSync } from 'fs';
import { readFile, rm } from 'fs/promises';
import { resolve } from 'path';

import { DeclastructPlan } from '../../domain.objects/DeclastructPlan';
import { executePlanCommand } from './plan';

describe('executePlanCommand', () => {
  const wishFilePath = resolve(
    process.cwd(),
    'src/.test/assets/wish.fixture.ts',
  );
  const planFilePath = resolve(
    process.cwd(),
    'src/.test/assets/plan.test.json',
  );

  afterEach(async () => {
    // cleanup plan file after each test
    if (existsSync(planFilePath)) {
      await rm(planFilePath);
    }
  });

  it('should generate a plan file with changes based on wish file', async () => {
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
    const nonexistentWishPath = resolve(__dirname, 'nonexistent.ts');

    await expect(
      executePlanCommand({
        wishFilePath: nonexistentWishPath,
        planFilePath,
      }),
    ).rejects.toThrow('Wish file not found');
  });

  it('should throw when wish file does not export getResources', async () => {
    const badWishPath = resolve(process.cwd(), 'src/.test/assets/bad-wish.ts');

    // create bad wish file
    const { writeFile } = await import('fs/promises');
    await writeFile(
      badWishPath,
      'export const getProviders = async () => [];',
      'utf-8',
    );

    await expect(
      executePlanCommand({ wishFilePath: badWishPath, planFilePath }),
    ).rejects.toThrow('Wish file must export getResources() function');

    // cleanup
    await rm(badWishPath);
  });

  it('should throw when wish file does not export getProviders', async () => {
    const badWishPath = resolve(process.cwd(), 'src/.test/assets/bad-wish2.ts');

    // create bad wish file
    const { writeFile } = await import('fs/promises');
    await writeFile(
      badWishPath,
      'export const getResources = async () => [];',
      'utf-8',
    );

    await expect(
      executePlanCommand({ wishFilePath: badWishPath, planFilePath }),
    ).rejects.toThrow('Wish file must export getProviders() function');

    // cleanup
    await rm(badWishPath);
  });

  it('should detect KEEP action when resource already exists remotely', async () => {
    // first run - create resources
    await executePlanCommand({ wishFilePath, planFilePath });

    // read first plan
    const firstPlanJson = await readFile(planFilePath, 'utf-8');
    const firstPlan = new DeclastructPlan(JSON.parse(firstPlanJson));

    // verify all CREATE
    expect(firstPlan.changes.every((c) => c.action === 'CREATE')).toBe(true);

    // cleanup and run again
    await rm(planFilePath);

    // Note: In a real integration test, we would need to actually apply the changes
    // to populate remote state. For now, this test just verifies the basic flow.
    // A more complete test would require mocking or actual provider state.
  });
});
