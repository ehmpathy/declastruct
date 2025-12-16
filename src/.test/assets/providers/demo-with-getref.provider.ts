import { DomainEntity } from 'domain-objects';
import { existsSync, readdirSync } from 'fs';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { resolve } from 'path';
import type { HasMetadata } from 'type-fns';
import { getUuid } from 'uuid-fns';

import type { DeclastructDao } from '@src/domain.objects/DeclastructDao';
import { DeclastructProvider } from '@src/domain.objects/DeclastructProvider';
import { genDeclastructDao } from '@src/domain.objects/genDeclastructDao';

/**
 * .what = demo resource with both primary and unique keys
 * .why = tests ref resolution utilities with full key support
 */
interface DemoRefResource {
  uuid?: string;
  exid: string;
  name: string;
}
class DemoRefResource
  extends DomainEntity<DemoRefResource>
  implements DemoRefResource
{
  public static primary = ['uuid'] as const;
  public static unique = ['exid'] as const;
}

/**
 * .what = resolves temp directory path
 * .why = centralizes directory location
 */
const getTempDir = (): string => {
  return resolve(process.cwd(), '.test/demo/getref-provider/.temp');
};

/**
 * .what = resolves file path for a resource on disk by exid
 * .why = centralizes file naming logic for persistence
 */
const getResourceFilePath = (exid: string): string => {
  return resolve(getTempDir(), `${exid}.json`);
};

/**
 * .what = scans disk to find resource by uuid
 * .why = enables byPrimary lookup without in-memory store
 */
const findResourceByUuid = async (
  uuid: string,
): Promise<DemoRefResource | null> => {
  const tempDir = getTempDir();
  if (!existsSync(tempDir)) return null;

  // scan all json files in temp directory
  const files = readdirSync(tempDir).filter((f) => f.endsWith('.json'));

  for (const file of files) {
    const filePath = resolve(tempDir, file);
    const json = await readFile(filePath, 'utf-8');
    const data = JSON.parse(json);
    if (data.uuid === uuid) {
      return DemoRefResource.as(data);
    }
  }

  return null;
};

/**
 * .what = demo DAO with both primary and unique key support
 * .why = enables testing getRefByPrimary and getRefByUnique utilities
 */
// biome-ignore lint/complexity/noBannedTypes: empty context type for demo
const demoRefDao = genDeclastructDao<typeof DemoRefResource, {}>({
  dobj: DemoRefResource,
  get: {
    one: {
      byUnique: async (input) => {
        const filePath = getResourceFilePath(input.exid);

        // check if file exists
        if (!existsSync(filePath)) return null;

        // read and parse file
        const json = await readFile(filePath, 'utf-8');
        const data = JSON.parse(json);

        return DemoRefResource.as(data);
      },
      byPrimary: async (input) => {
        // scan disk to find by uuid
        return findResourceByUuid(input.uuid);
      },
    },
  },
  set: {
    findsert: async (resource): Promise<HasMetadata<DemoRefResource>> => {
      // assign uuid if not present
      const uuid = resource.uuid ?? getUuid();
      const resourceWithUuid = DemoRefResource.as({
        ...resource,
        uuid,
      }) as HasMetadata<DemoRefResource>;

      const filePath = getResourceFilePath(resourceWithUuid.exid);

      // write resource to disk
      await writeFile(
        filePath,
        JSON.stringify(resourceWithUuid, null, 2),
        'utf-8',
      );

      return resourceWithUuid;
    },
    upsert: async (resource): Promise<HasMetadata<DemoRefResource>> => {
      // assign uuid if not present
      const uuid = resource.uuid ?? getUuid();
      const resourceWithUuid = DemoRefResource.as({
        ...resource,
        uuid,
      }) as HasMetadata<DemoRefResource>;

      const filePath = getResourceFilePath(resourceWithUuid.exid);

      // write resource to disk (overwrite if exists)
      await writeFile(
        filePath,
        JSON.stringify(resourceWithUuid, null, 2),
        'utf-8',
      );

      return resourceWithUuid;
    },
    delete: async (ref) => {
      const resource = await demoRefDao.get.one.byRef(ref, {});
      if (!resource) return;

      const filePath = getResourceFilePath(resource.exid);

      // remove file if it exists
      if (existsSync(filePath)) {
        await rm(filePath);
      }
    },
  },
});

/**
 * .what = demo provider with full ref resolution support
 * .why = enables integration testing of getRefByPrimary and getRefByUnique
 */
export const demoGetRefProvider = new DeclastructProvider({
  name: 'demo-getref-provider',
  daos: {
    DemoRefResource: demoRefDao as DeclastructDao<any, any>,
  },
  context: {},
  hooks: {
    beforeAll: async () => {
      // ensure temp directory exists
      const tempDir = getTempDir();
      if (!existsSync(tempDir)) {
        await mkdir(tempDir, { recursive: true });
      }
    },
    afterAll: async () => {},
  },
});

/**
 * .what = generates a sample DemoRefResource with automatic unique ID
 * .why = simplifies test resource creation without managing IDs manually
 */
export const genSampleDemoRefResource = (input: { name: string }) => {
  return DemoRefResource.as({
    exid: getUuid(),
    name: input.name,
  });
};

/**
 * .what = clears temp directory for test isolation
 * .why = enables test isolation between test cases
 */
export const clearDemoRefStore = async () => {
  const tempDir = getTempDir();
  if (!existsSync(tempDir)) return;

  // remove all json files
  const files = readdirSync(tempDir).filter((f) => f.endsWith('.json'));
  for (const file of files) {
    await rm(resolve(tempDir, file));
  }
};

/**
 * .what = export DemoRefResource class and DAO for test usage
 */
export { DemoRefResource, demoRefDao };
