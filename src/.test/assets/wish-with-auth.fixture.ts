import { DomainEntity } from 'domain-objects';

import { DeclastructProvider } from '../../domain.objects/DeclastructProvider';
import {
  DemoAuthResource,
  demoAuthProvider,
  genSampleDemoAuthResource,
} from './providers/demo-with-auth.provider';

/**
 * .what = returns demo auth resources for wish file
 * .why = tests that provider context is passed through to DAOs
 * .note = generates fresh resources with unique IDs on each call
 */
export const getResources = async (): Promise<DomainEntity<any>[]> => {
  return [
    genSampleDemoAuthResource({ name: 'Authenticated Resource 1' }),
    genSampleDemoAuthResource({ name: 'Authenticated Resource 2' }),
  ];
};

/**
 * .what = returns demo auth provider for wish file
 * .why = tests that provider context flows through to all DAO operations
 */
export const getProviders = async (): Promise<
  DeclastructProvider<any, any>[]
> => {
  return [demoAuthProvider];
};

/**
 * .what = export DemoAuthResource for test usage
 */
export { DemoAuthResource };
