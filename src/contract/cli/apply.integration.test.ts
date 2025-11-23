import { existsSync } from 'fs';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { getUuid } from 'uuid-fns';

import { DeclastructPlan } from '../../domain.objects/DeclastructPlan';
import { executeApplyCommand } from './apply';
import { executePlanCommand } from './plan';

/**
 * .what = creates an isolated wish file for a test
 * .why = ensures stable resources within a single test while maintaining test isolation
 */
const createIsolatedWishFile = async (): Promise<string> => {
  const tempDir = resolve(process.cwd(), '.test/.temp');
  const wishPath = resolve(tempDir, `wish-${getUuid()}.ts`);

  // ensure temp directory exists
  if (!existsSync(tempDir)) {
    await mkdir(tempDir, { recursive: true });
  }

  const exid1 = getUuid();
  const exid2 = getUuid();

  const wishContent = `
import { DomainEntity } from 'domain-objects';
import { DeclastructProvider } from '../../src/domain.objects/DeclastructProvider';
import { DemoResource, demoProvider } from '../../src/.test/assets/providers/demo.provider';

export const getResources = async (): Promise<DomainEntity<any>[]> => {
  return [
    DemoResource.as({ exid: '${exid1}', name: 'First Resource' }),
    DemoResource.as({ exid: '${exid2}', name: 'Second Resource' }),
  ];
};

export const getProviders = async (): Promise<DeclastructProvider<any, any>[]> => {
  return [demoProvider];
};
`;

  await writeFile(wishPath, wishContent, 'utf-8');
  return wishPath;
};

describe('executeApplyCommand', () => {
  const planFilePath = resolve(
    process.cwd(),
    'src/.test/assets/apply.test.json',
  );

  afterEach(async () => {
    // cleanup plan file after each test
    if (existsSync(planFilePath)) {
      await rm(planFilePath);
    }
  });

  it('should apply changes from a valid plan file', async () => {
    // create isolated wish file for this test
    const wishFilePath = await createIsolatedWishFile();

    // first generate a plan
    await executePlanCommand({ wishFilePath, planFilePath });

    // verify plan was created
    expect(existsSync(planFilePath)).toBe(true);

    // now apply the plan
    await executeApplyCommand({ planFilePath });

    // verify plan still exists after apply
    expect(existsSync(planFilePath)).toBe(true);

    // read plan to verify structure
    const planJson = await readFile(planFilePath, 'utf-8');
    const plan = new DeclastructPlan(JSON.parse(planJson));

    // verify plan has changes
    expect(plan.changes.length).toBe(2);
  });

  it('should throw when plan file does not exist', async () => {
    const nonexistentPlanPath = resolve(__dirname, 'nonexistent-plan.json');

    await expect(
      executeApplyCommand({ planFilePath: nonexistentPlanPath }),
    ).rejects.toThrow('Plan file not found');
  });

  it('should throw when wish file referenced in plan does not exist', async () => {
    // create plan with invalid wish path
    const invalidPlan = {
      hash: 'test-hash',
      createdAt: new Date().toISOString(),
      wish: { uri: '/nonexistent/wish.ts' },
      changes: [],
    };

    await writeFile(planFilePath, JSON.stringify(invalidPlan, null, 2));

    await expect(executeApplyCommand({ planFilePath })).rejects.toThrow();
  });

  it('should throw when wish file does not export getProviders', async () => {
    const badWishPath = resolve(
      process.cwd(),
      'src/.test/assets/bad-apply-wish.ts',
    );

    // create bad wish file
    await writeFile(badWishPath, 'export const foo = "bar";', 'utf-8');

    // create plan pointing to bad wish
    const invalidPlan = {
      hash: 'test-hash',
      createdAt: new Date().toISOString(),
      wish: { uri: badWishPath },
      changes: [],
    };

    await writeFile(planFilePath, JSON.stringify(invalidPlan, null, 2));

    await expect(executeApplyCommand({ planFilePath })).rejects.toThrow(
      'Wish file must export getProviders() function',
    );

    // cleanup
    await rm(badWishPath);
  });

  it('should successfully apply multiple CREATE actions', async () => {
    // create isolated wish file for this test
    const wishFilePath = await createIsolatedWishFile();

    // generate plan
    await executePlanCommand({ wishFilePath, planFilePath });

    // spy on console to verify logging
    const logSpy = jest.spyOn(console, 'info');

    // apply changes
    await executeApplyCommand({ planFilePath });

    // verify success logging occurred
    const logCalls = logSpy.mock.calls.map((call) => call.join(' '));
    const successLogs = logCalls.filter((log) => log.includes('✔'));

    // should have logged success for each CREATE action
    expect(successLogs.length).toBeGreaterThan(0);

    // cleanup spy
    logSpy.mockRestore();
  });

  it('should handle KEEP actions without errors', async () => {
    // create isolated wish file for this test
    const wishFilePath = await createIsolatedWishFile();

    // generate initial plan
    await executePlanCommand({ wishFilePath, planFilePath });

    // apply changes
    await executeApplyCommand({ planFilePath });

    // generate new plan (should now show KEEP actions)
    await rm(planFilePath);
    await executePlanCommand({ wishFilePath, planFilePath });

    // read new plan
    const planJson = await readFile(planFilePath, 'utf-8');
    const plan = new DeclastructPlan(JSON.parse(planJson));

    // verify we have KEEP actions
    const keepActions = plan.changes.filter((c) => c.action === 'KEEP');
    expect(keepActions.length).toBe(2);

    // apply again (should handle KEEP without errors)
    await executeApplyCommand({ planFilePath });
  });

  it('should throw when plan is stale', async () => {
    // create isolated wish file for this test
    const wishFilePath = await createIsolatedWishFile();

    // generate initial plan
    await executePlanCommand({ wishFilePath, planFilePath });

    // modify the plan's hash to make it stale
    const planJson = await readFile(planFilePath, 'utf-8');
    const plan = JSON.parse(planJson);
    plan.hash = 'stale-hash-that-wont-match';

    await writeFile(planFilePath, JSON.stringify(plan, null, 2));

    // applying stale plan should throw
    await expect(executeApplyCommand({ planFilePath })).rejects.toThrow(
      'plan is stale',
    );
  });
});
