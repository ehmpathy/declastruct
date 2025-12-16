import Bottleneck from 'bottleneck';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { resolve } from 'path';

import {
  demoProvider,
  genSampleDemoResource,
} from '@src/.test/assets/providers/demo.provider';
import { DeclastructChangeAction } from '@src/domain.objects/DeclastructChange';
import { planChanges } from '@src/domain.operations/plan/planChanges';

import { applyChanges } from './applyChanges';

describe('applyChanges', () => {
  const wishFilePath = resolve(
    process.cwd(),
    'src/.test/assets/wish.fixture.ts',
  );

  beforeAll(async () => {
    // initialize provider (creates temp directory)
    await demoProvider.hooks.beforeAll();
  });

  const createContext = () => ({
    bottleneck: new Bottleneck({ maxConcurrent: 1 }),
    log: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    },
  });

  it('should apply CREATE changes and verify files created on disk', async () => {
    // define desired resources with automatic unique IDs
    const resources = [
      genSampleDemoResource({ name: 'First Test' }),
      genSampleDemoResource({ name: 'Second Test' }),
    ];

    // plan changes
    const plan = await planChanges(
      {
        resources,
        providers: [demoProvider],
        wishFilePath,
      },
      createContext(),
    );

    // verify plan has CREATE actions
    expect(
      plan.changes.every((c) => c.action === DeclastructChangeAction.CREATE),
    ).toBe(true);

    // apply changes
    const result = await applyChanges(
      {
        plan,
        resources,
        providers: [demoProvider],
      },
      createContext(),
    );

    // verify changes were applied
    expect(result.appliedChanges.length).toBe(2);
    result.appliedChanges.forEach((change) => {
      expect(change.action).toBe(DeclastructChangeAction.CREATE);
    });

    // verify files exist on disk
    const file1Path = resolve(
      process.cwd(),
      `.test/demo/provider/.temp/${resources[0]!.exid}.json`,
    );
    const file2Path = resolve(
      process.cwd(),
      `.test/demo/provider/.temp/${resources[1]!.exid}.json`,
    );

    expect(existsSync(file1Path)).toBe(true);
    expect(existsSync(file2Path)).toBe(true);

    // verify file contents
    const file1Json = await readFile(file1Path, 'utf-8');
    const file1Data = JSON.parse(file1Json);
    expect(file1Data.exid).toBe(resources[0]!.exid);
    expect(file1Data.name).toBe('First Test');

    const file2Json = await readFile(file2Path, 'utf-8');
    const file2Data = JSON.parse(file2Json);
    expect(file2Data.exid).toBe(resources[1]!.exid);
    expect(file2Data.name).toBe('Second Test');
  });

  it('should apply UPDATE changes and verify files modified on disk', async () => {
    // create initial resource
    const initialResource = genSampleDemoResource({ name: 'Old Name' });

    // create initial remote state
    const dao = demoProvider.daos.DemoResource;
    await dao.set.findsert(initialResource, {});

    // define desired resource with updated name (same exid)
    const resources = [initialResource.clone({ name: 'New Name' })];

    // plan changes
    const plan = await planChanges(
      {
        resources,
        providers: [demoProvider],
        wishFilePath,
      },
      createContext(),
    );

    // verify plan has UPDATE action
    expect(plan.changes.length).toBe(1);
    expect(plan.changes[0]!.action).toBe(DeclastructChangeAction.UPDATE);

    // apply changes
    const result = await applyChanges(
      {
        plan,
        resources,
        providers: [demoProvider],
      },
      createContext(),
    );

    // verify update was applied
    expect(result.appliedChanges.length).toBe(1);
    expect(result.appliedChanges[0]!.action).toBe(
      DeclastructChangeAction.UPDATE,
    );

    // verify file was updated on disk
    const filePath = resolve(
      process.cwd(),
      `.test/demo/provider/.temp/${initialResource.exid}.json`,
    );
    const fileJson = await readFile(filePath, 'utf-8');
    const fileData = JSON.parse(fileJson);
    expect(fileData.name).toBe('New Name');
  });

  it('should skip KEEP changes without making modifications', async () => {
    // create resource
    const resource = genSampleDemoResource({ name: 'Unchanged' });

    // create remote state
    const dao = demoProvider.daos.DemoResource;
    await dao.set.findsert(resource, {});

    // define same resource (no changes)
    const resources = [resource];

    // plan changes
    const plan = await planChanges(
      {
        resources,
        providers: [demoProvider],
        wishFilePath,
      },
      createContext(),
    );

    // verify plan has KEEP action
    expect(plan.changes.length).toBe(1);
    expect(plan.changes[0]!.action).toBe(DeclastructChangeAction.KEEP);

    // apply changes
    const context = createContext();
    const result = await applyChanges(
      {
        plan,
        resources,
        providers: [demoProvider],
      },
      context,
    );

    // verify KEEP was not included in applied changes
    expect(result.appliedChanges.length).toBe(0);

    // verify log was emitted for KEEP (format: ↓ [KEEP] slug)
    expect(context.log.info).toHaveBeenCalledWith(
      expect.stringContaining('[KEEP]'),
    );

    // verify file still exists with same content
    const filePath = resolve(
      process.cwd(),
      `.test/demo/provider/.temp/${resource.exid}.json`,
    );
    const fileJson = await readFile(filePath, 'utf-8');
    const fileData = JSON.parse(fileJson);
    expect(fileData.name).toBe('Unchanged');
  });

  it('should emit real-time logs as changes are applied', async () => {
    // define resources
    const resources = [
      genSampleDemoResource({ name: 'First Test' }),
      genSampleDemoResource({ name: 'Second Test' }),
    ];

    // plan changes
    const plan = await planChanges(
      {
        resources,
        providers: [demoProvider],
        wishFilePath,
      },
      createContext(),
    );

    // apply with spy on log
    const context = createContext();
    await applyChanges(
      {
        plan,
        resources,
        providers: [demoProvider],
      },
      context,
    );

    // verify logs were emitted (format: ○ [CREATE] slug)
    expect(context.log.info).toHaveBeenCalledWith(
      expect.stringContaining(`[CREATE]`),
    );
    expect(context.log.info).toHaveBeenCalledWith(
      expect.stringContaining(`DemoResource.`),
    );
    expect(context.log.info).toHaveBeenCalled();
  });

  it('should handle mixed CREATE, UPDATE, and KEEP actions in single apply', async () => {
    // create initial resources for remote state
    const resource1 = genSampleDemoResource({ name: 'Unchanged' });
    const resource2 = genSampleDemoResource({ name: 'Old Name' });

    // create remote state for some resources
    const dao = demoProvider.daos.DemoResource;
    await dao.set.findsert(resource1, {});
    await dao.set.findsert(resource2, {});

    // define desired resources
    const resources = [
      resource1, // KEEP (unchanged)
      resource2.clone({ name: 'New Name' }), // UPDATE
      genSampleDemoResource({ name: 'Brand New' }), // CREATE
    ];

    // plan changes
    const plan = await planChanges(
      {
        resources,
        providers: [demoProvider],
        wishFilePath,
      },
      createContext(),
    );

    // verify mixed actions in plan
    expect(plan.changes.length).toBe(3);

    // apply changes
    const result = await applyChanges(
      {
        plan,
        resources,
        providers: [demoProvider],
      },
      createContext(),
    );

    // verify only CREATE and UPDATE were applied (not KEEP)
    expect(result.appliedChanges.length).toBe(2);

    const appliedActions = result.appliedChanges.map((c) => c.action);
    expect(appliedActions).toContain(DeclastructChangeAction.UPDATE);
    expect(appliedActions).toContain(DeclastructChangeAction.CREATE);

    // verify all files exist with correct content
    const file1Path = resolve(
      process.cwd(),
      `.test/demo/provider/.temp/${resources[0]!.exid}.json`,
    );
    const file2Path = resolve(
      process.cwd(),
      `.test/demo/provider/.temp/${resources[1]!.exid}.json`,
    );
    const file3Path = resolve(
      process.cwd(),
      `.test/demo/provider/.temp/${resources[2]!.exid}.json`,
    );

    expect(existsSync(file1Path)).toBe(true);
    expect(existsSync(file2Path)).toBe(true);
    expect(existsSync(file3Path)).toBe(true);

    const file2Json = await readFile(file2Path, 'utf-8');
    const file2Data = JSON.parse(file2Json);
    expect(file2Data.name).toBe('New Name');
  });

  it('should detect and reject stale plans', async () => {
    // define initial resource
    const initialResources = [genSampleDemoResource({ name: 'Original Name' })];

    // plan changes
    const plan = await planChanges(
      {
        resources: initialResources,
        providers: [demoProvider],
        wishFilePath,
      },
      createContext(),
    );

    // apply the plan (creates the resource)
    await applyChanges(
      {
        plan,
        resources: initialResources,
        providers: [demoProvider],
      },
      createContext(),
    );

    // externally modify the resource
    const dao = demoProvider.daos.DemoResource!;
    await dao.set.upsert!(
      initialResources[0]!.clone({ name: 'Externally Modified' }),
      {},
    );

    // try to reapply the stale plan
    await expect(
      applyChanges(
        {
          plan, // stale plan still shows "Original Name"
          resources: initialResources,
          providers: [demoProvider],
        },
        createContext(),
      ),
    ).rejects.toThrow();
  });

  it('should be idempotent - reapplying same plan is safe', async () => {
    // define resource
    const resources = [genSampleDemoResource({ name: 'Test Resource' })];

    // plan changes
    const plan = await planChanges(
      {
        resources,
        providers: [demoProvider],
        wishFilePath,
      },
      createContext(),
    );

    // apply first time
    const result1 = await applyChanges(
      {
        plan,
        resources,
        providers: [demoProvider],
      },
      createContext(),
    );

    expect(result1.appliedChanges.length).toBe(1);
    expect(result1.appliedChanges[0]!.action).toBe(
      DeclastructChangeAction.CREATE,
    );

    // replan with same resources
    const plan2 = await planChanges(
      {
        resources,
        providers: [demoProvider],
        wishFilePath,
      },
      createContext(),
    );

    // apply second time
    const result2 = await applyChanges(
      {
        plan: plan2,
        resources,
        providers: [demoProvider],
      },
      createContext(),
    );

    // verify second apply was KEEP (no changes)
    expect(result2.appliedChanges.length).toBe(0);
    expect(plan2.changes[0]!.action).toBe(DeclastructChangeAction.KEEP);

    // verify file exists with correct content
    const filePath = resolve(
      process.cwd(),
      `.test/demo/provider/.temp/${resources[0]!.exid}.json`,
    );
    const fileJson = await readFile(filePath, 'utf-8');
    const fileData = JSON.parse(fileJson);
    expect(fileData.name).toBe('Test Resource');
  });

  it('should validate plan before applying to ensure it is still valid', async () => {
    // define resource
    const resources = [genSampleDemoResource({ name: 'Test Resource' })];

    // plan changes
    const originalPlan = await planChanges(
      {
        resources,
        providers: [demoProvider],
        wishFilePath,
      },
      createContext(),
    );

    // apply the plan (creates the resource)
    await applyChanges(
      {
        plan: originalPlan,
        resources,
        providers: [demoProvider],
      },
      createContext(),
    );

    // externally modify the remote resource to make original plan stale
    const dao = demoProvider.daos.DemoResource!;
    await dao.set.upsert!(
      resources[0]!.clone({ name: 'Externally Modified' }),
      {},
    );

    // try to apply the stale plan again
    await expect(
      applyChanges(
        {
          plan: originalPlan, // stale - remote state changed
          resources,
          providers: [demoProvider],
        },
        createContext(),
      ),
    ).rejects.toThrow('plan is stale');
  });
});
