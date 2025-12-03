import { DomainEntity } from 'domain-objects';
import { existsSync } from 'fs';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { resolve } from 'path';
import { getUuid } from 'uuid-fns';

import type { DeclastructDao } from '../../../domain.objects/DeclastructDao';
import { DeclastructProvider } from '../../../domain.objects/DeclastructProvider';

/**
 * .what = demo resource for integration testing
 */
interface DemoResource {
  exid: string;
  name: string;
}
class DemoResource extends DomainEntity<DemoResource> implements DemoResource {
  public static unique = ['exid'] as const;
}

/**
 * .what = resolves file path for a resource on disk
 * .why = centralizes file naming logic
 */
const getResourceFilePath = (id: string): string => {
  return resolve(process.cwd(), `.test/demo/provider/.temp/${id}.json`);
};

/**
 * .what = demo DAO with on-disk JSON persistence
 * .why = provides real persistence for integration tests
 */
const demoDao: DeclastructDao<DemoResource, typeof DemoResource, any> = {
  get: {
    byUnique: async (input) => {
      const filePath = getResourceFilePath(input.exid);

      // check if file exists
      if (!existsSync(filePath)) return null;

      // read and parse file
      const json = await readFile(filePath, 'utf-8');
      const data = JSON.parse(json);

      return DemoResource.as(data);
    },
    byRef: async (ref) => {
      // extract exid from ref
      const exid = (ref as any).exid;
      if (!exid) return null;

      return demoDao.get.byUnique({ exid } as any, {});
    },
  },
  set: {
    finsert: async (resource) => {
      const filePath = getResourceFilePath(resource.exid);

      // write resource to disk
      await writeFile(filePath, JSON.stringify(resource, null, 2), 'utf-8');

      return resource;
    },
    upsert: async (resource) => {
      const filePath = getResourceFilePath(resource.exid);

      // write resource to disk (overwrite if exists)
      await writeFile(filePath, JSON.stringify(resource, null, 2), 'utf-8');

      return resource;
    },
    delete: async (ref) => {
      const resource = await demoDao.get.byRef(ref, {});
      if (!resource) return;

      const filePath = getResourceFilePath(resource.exid);

      // remove file if it exists
      if (existsSync(filePath)) {
        await rm(filePath);
      }
    },
  },
};

/**
 * .what = demo provider with on-disk persistence
 * .why = enables full integration testing with real CRUD operations
 */
export const demoProvider = new DeclastructProvider({
  name: 'demo-provider',
  daos: { DemoResource: demoDao },
  context: {},
  hooks: {
    beforeAll: async () => {
      // ensure temp directory exists
      const tempDir = resolve(process.cwd(), '.test/demo/provider/.temp');
      if (!existsSync(tempDir)) {
        await mkdir(tempDir, { recursive: true });
      }
    },
    afterAll: async () => {},
  },
});

/**
 * .what = generates a sample DemoResource with automatic unique ID
 * .why = simplifies test resource creation without managing IDs manually
 * .note = use resource.clone({ name: 'New Name' }) to update properties while keeping same exid
 */
export const genSampleDemoResource = (input: { name: string }) => {
  return DemoResource.as({
    exid: getUuid(),
    name: input.name,
  });
};

/**
 * .what = export DemoResource class for test usage
 */
export { DemoResource };
