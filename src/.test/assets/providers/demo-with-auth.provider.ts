import { DomainEntity } from 'domain-objects';
import { existsSync } from 'fs';
import { mkdir, readFile, rm, writeFile } from 'fs/promises';
import { BadRequestError, UnexpectedCodePathError } from 'helpful-errors';
import { resolve } from 'path';
import { getUuid } from 'uuid-fns';

import { DeclastructProvider } from '../../../domain.objects/DeclastructProvider';
import { genDeclastructDao } from '../../../domain.objects/genDeclastructDao';

/**
 * .what = demo resource requiring authentication
 * .why = tests that provider context is passed through to DAOs
 */
interface DemoAuthResource {
  exid: string;
  name: string;
}
class DemoAuthResource
  extends DomainEntity<DemoAuthResource>
  implements DemoAuthResource
{
  public static unique = ['exid'] as const;
}

/**
 * .what = context shape requiring authentication token
 * .why = enables verification that context flows through to DAO operations
 */
interface DemoAuthContext {
  demoAuthToken: string;
}

/**
 * .what = resolves file path for a resource on disk
 * .why = centralizes file naming logic
 */
const getResourceFilePath = (id: string): string => {
  return resolve(process.cwd(), `.test/demo/auth-provider/.temp/${id}.json`);
};

/**
 * .what = validates auth token is present in context
 * .why = fail-fast if context not properly passed through
 */
const validateAuthContext = (context: DemoAuthContext): void => {
  if (!context)
    throw new UnexpectedCodePathError(
      'context must be provided to demoAuthDao',
    );

  if (!context.demoAuthToken)
    throw new BadRequestError('demoAuthToken required in context');
};

/**
 * .what = demo DAO requiring authentication context
 * .why = verifies provider context is properly passed to all DAO operations
 */
const demoAuthDao = genDeclastructDao<typeof DemoAuthResource, DemoAuthContext>(
  {
    dobj: DemoAuthResource,
    get: {
      one: {
        byUnique: async (input, context) => {
          // verify context is passed and contains auth token
          validateAuthContext(context);

          const filePath = getResourceFilePath(input.exid);

          // check if file exists
          if (!existsSync(filePath)) return null;

          // read and parse file
          const json = await readFile(filePath, 'utf-8');
          const data = JSON.parse(json);

          return DemoAuthResource.as(data);
        },
        byPrimary: null,
      },
    },
    set: {
      finsert: async (resource, context) => {
        // verify context is passed
        validateAuthContext(context);

        const filePath = getResourceFilePath(resource.exid);

        // write resource to disk
        await writeFile(filePath, JSON.stringify(resource, null, 2), 'utf-8');

        return resource;
      },
      upsert: async (resource, context) => {
        // verify context is passed
        validateAuthContext(context);

        const filePath = getResourceFilePath(resource.exid);

        // write resource to disk (overwrite if exists)
        await writeFile(filePath, JSON.stringify(resource, null, 2), 'utf-8');

        return resource;
      },
      delete: async (ref, context) => {
        // verify context is passed
        validateAuthContext(context);

        const resource = await demoAuthDao.get.one.byRef(ref, context);
        if (!resource) return;

        const filePath = getResourceFilePath(resource.exid);

        // remove file if it exists
        if (existsSync(filePath)) {
          await rm(filePath);
        }
      },
    },
  },
);

/**
 * .what = demo provider requiring authentication context
 * .why = enables testing that provider context flows through to DAOs
 */
export const demoAuthProvider = new DeclastructProvider<
  { DemoAuthResource: typeof demoAuthDao },
  DemoAuthContext
>({
  name: 'demo-auth-provider',
  daos: { DemoAuthResource: demoAuthDao },
  context: {
    demoAuthToken: 'test-token-12345',
  },
  hooks: {
    beforeAll: async () => {
      // ensure temp directory exists
      const tempDir = resolve(process.cwd(), '.test/demo/auth-provider/.temp');
      if (!existsSync(tempDir)) {
        await mkdir(tempDir, { recursive: true });
      }
    },
    afterAll: async () => {},
  },
});

/**
 * .what = generates a sample DemoAuthResource with automatic unique ID
 * .why = simplifies test resource creation without managing IDs manually
 */
export const genSampleDemoAuthResource = (input: { name: string }) => {
  return DemoAuthResource.as({
    exid: getUuid(),
    name: input.name,
  });
};

/**
 * .what = export DemoAuthResource class for test usage
 */
export { DemoAuthResource };
