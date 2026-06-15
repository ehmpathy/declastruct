import type { DomainEntity } from 'domain-objects';
import { resolve } from 'path';

import type { DeclastructProvider } from '../../domain.objects/DeclastructProvider';

// use dynamic require with absolute path since this file may be cloned to temp dir
// eslint-disable-next-line @typescript-eslint/no-require-imports
const { DemoResource, demoProvider } = require(
  resolve(process.cwd(), 'src/.test/assets/providers/demo.provider'),
);

/**
 * .what = template wish file that creates a resource
 * .why = enables integration testing of del() functionality
 * .note = uses placeholder exid '__TEST_EXID__' to be replaced per-test
 */
export const getResources = async (): Promise<DomainEntity<any>[]> => {
  return [DemoResource.as({ exid: '__TEST_EXID__', name: 'To Be Deleted' })];
};

/**
 * .what = returns demo providers for wish file
 */
export const getProviders = async (): Promise<
  DeclastructProvider<any, any>[]
> => {
  return [demoProvider];
};

export { DemoResource };
