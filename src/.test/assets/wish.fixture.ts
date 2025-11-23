import { DomainEntity } from 'domain-objects';

import { DeclastructProvider } from '../../domain.objects/DeclastructProvider';
import {
  genSampleDemoResource,
  DemoResource,
  demoProvider,
} from './providers/demo.provider';

/**
 * .what = returns demo resources for wish file
 * .note = generates fresh resources with unique IDs on each call
 */
export const getResources = async (): Promise<DomainEntity<any>[]> => {
  return [
    genSampleDemoResource({ name: 'First Resource' }),
    genSampleDemoResource({ name: 'Second Resource' }),
  ];
};

/**
 * .what = returns demo providers for wish file
 */
export const getProviders = async (): Promise<
  DeclastructProvider<any, any>[]
> => {
  return [demoProvider];
};

/**
 * .what = export DemoResource for test usage
 */
export { DemoResource };
