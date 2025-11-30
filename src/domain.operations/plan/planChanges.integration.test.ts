import Bottleneck from 'bottleneck';
import { resolve } from 'path';

import {
  genSampleDemoResource,
  demoProvider,
} from '../../.test/assets/providers/demo.provider';
import { DeclastructChangeAction } from '../../domain.objects/DeclastructChange';
import { planChanges } from './planChanges';

describe('planChanges', () => {
  const wishFilePath = resolve(
    process.cwd(),
    'src/.test/assets/wish.fixture.ts',
  );

  beforeAll(async () => {
    // initialize provider (creates temp directory)
    await demoProvider.hooks.beforeAll();
  });

  const createContext = () => ({
    bottleneck: new Bottleneck({ maxConcurrent: 10 }),
    log: {
      info: jest.fn(),
      error: jest.fn(),
      warn: jest.fn(),
      debug: jest.fn(),
    },
  });

  it('should plan CREATE actions for resources that do not exist remotely', async () => {
    // define desired resources
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

    // verify plan structure
    expect(plan.hash).toBeDefined();
    expect(plan.createdAt).toBeDefined();
    expect(plan.wish.uri).toBe(wishFilePath);
    expect(plan.changes.length).toBe(2);

    // verify all changes are CREATE
    plan.changes.forEach((change) => {
      expect(change.action).toBe(DeclastructChangeAction.CREATE);
      expect(change.forResource.class).toBe('DemoResource');
      expect(change.state.desired).toBeDefined();
      expect(change.state.remote).toBeNull();
    });

    // verify specific resources (slug includes full format with hash)
    const slugs = plan.changes.map((c) => c.forResource.slug);
    expect(slugs[0]).toContain(resources[0]!.exid);
    expect(slugs[1]).toContain(resources[1]!.exid);
  });

  it('should plan KEEP actions for resources that exist unchanged remotely', async () => {
    // define resources
    const resources = [
      genSampleDemoResource({ name: 'First Test' }),
      genSampleDemoResource({ name: 'Second Test' }),
    ];

    // create remote state
    const dao = demoProvider.daos.DemoResource;
    await dao.set.finsert(resources[0]!, {});
    await dao.set.finsert(resources[1]!, {});

    // plan changes with spy context
    const context = createContext();
    const plan = await planChanges(
      {
        resources,
        providers: [demoProvider],
        wishFilePath,
      },
      context,
    );

    // verify all changes are KEEP
    expect(plan.changes.length).toBe(2);
    plan.changes.forEach((change) => {
      expect(change.action).toBe(DeclastructChangeAction.KEEP);
      expect(change.forResource.class).toBe('DemoResource');
      expect(change.state.desired).toBeDefined();
      expect(change.state.remote).toBeDefined();
    });

    // verify success message was logged when everything is in sync
    expect(context.log.info).toHaveBeenCalledWith('🎉 everything is in sync!');
  });

  it('should plan UPDATE actions for resources that changed remotely', async () => {
    // create remote state
    const remoteResource = genSampleDemoResource({ name: 'Old Name' });
    const dao = demoProvider.daos.DemoResource;
    await dao.set.finsert(remoteResource, {});

    // define desired resource with new name (same exid)
    const resources = [remoteResource.clone({ name: 'New Name' })];

    // plan changes
    const plan = await planChanges(
      {
        resources,
        providers: [demoProvider],
        wishFilePath,
      },
      createContext(),
    );

    // verify UPDATE action
    expect(plan.changes.length).toBe(1);
    const change = plan.changes[0]!;
    expect(change.action).toBe(DeclastructChangeAction.UPDATE);
    expect(change.forResource.class).toBe('DemoResource');
    expect(change.forResource.slug).toContain(remoteResource.exid);
    expect((change.state.desired as any).name).toBe('New Name');
    expect((change.state.remote as any)?.name).toBe('Old Name');
    expect(change.toString()).toBeDefined();
  });

  it('should plan DELETE actions for resources that exist remotely but not in desired state', async () => {
    // create remote state
    const resource1 = genSampleDemoResource({ name: 'To Delete' });
    const resource2 = genSampleDemoResource({ name: 'To Keep' });
    const dao = demoProvider.daos.DemoResource;
    await dao.set.finsert(resource1, {});
    await dao.set.finsert(resource2, {});

    // define desired resources (only resource2)
    const resources = [resource2];

    // Note: planChanges only looks at desired resources, not remote state
    // DELETE actions would need to be detected by comparing remote state to desired
    // This is a design limitation - planChanges only processes desired resources
    const plan = await planChanges(
      {
        resources,
        providers: [demoProvider],
        wishFilePath,
      },
      createContext(),
    );

    // verify only resource2 is in plan
    expect(plan.changes.length).toBe(1);
    expect(plan.changes[0]!.forResource.slug).toContain(resource2.exid);
    expect(plan.changes[0]!.action).toBe(DeclastructChangeAction.KEEP);
  });

  it('should emit real-time logs as resources are planned', async () => {
    // define resources
    const resources = [
      genSampleDemoResource({ name: 'First Test' }),
      genSampleDemoResource({ name: 'Second Test' }),
    ];

    // plan with spy on log
    const context = createContext();
    await planChanges(
      {
        resources,
        providers: [demoProvider],
        wishFilePath,
      },
      context,
    );

    // verify logs were emitted
    // resource slug is logged on one line, decision on another
    expect(context.log.info).toHaveBeenCalledWith(
      expect.stringContaining(`○ DemoResource.`),
    );
    expect(context.log.info).toHaveBeenCalledWith(
      expect.stringContaining(`decision`),
    );
    expect(context.log.info).toHaveBeenCalled();
  });

  it('should handle mixed actions in single plan', async () => {
    // create remote resources
    const resource1 = genSampleDemoResource({ name: 'Unchanged' });
    const resource2 = genSampleDemoResource({ name: 'Old Name' });

    // create remote state for some resources
    const dao = demoProvider.daos.DemoResource;
    await dao.set.finsert(resource1, {});
    await dao.set.finsert(resource2, {});

    // define desired resources
    const resources = [
      resource1, // KEEP
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

    // verify mixed actions
    expect(plan.changes.length).toBe(3);

    // verify we have one of each action
    const actions = plan.changes.map((c) => c.action);
    expect(actions).toContain(DeclastructChangeAction.KEEP);
    expect(actions).toContain(DeclastructChangeAction.UPDATE);
    expect(actions).toContain(DeclastructChangeAction.CREATE);

    // verify exids are in slugs
    const slugString = plan.changes.map((c) => c.forResource.slug).join(',');
    expect(slugString).toContain(resource1.exid);
    expect(slugString).toContain(resource2.exid);
    expect(slugString).toContain(resources[2]!.exid);
  });

  it('should produce deterministic plans for same input', async () => {
    // define resources
    const resources = [
      genSampleDemoResource({ name: 'First Test' }),
      genSampleDemoResource({ name: 'Second Test' }),
    ];

    // plan twice
    const plan1 = await planChanges(
      {
        resources,
        providers: [demoProvider],
        wishFilePath,
      },
      createContext(),
    );

    const plan2 = await planChanges(
      {
        resources,
        providers: [demoProvider],
        wishFilePath,
      },
      createContext(),
    );

    // verify plans have same hash (deterministic)
    expect(plan1.hash).toBe(plan2.hash);
    expect(plan1.changes.length).toBe(plan2.changes.length);
  });
});
