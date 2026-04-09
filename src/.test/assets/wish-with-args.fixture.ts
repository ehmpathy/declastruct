import { parseArgs } from 'util';

import type { DomainEntity } from 'domain-objects';

import type { DeclastructProvider } from '@src/domain.objects/DeclastructProvider';
import {
  DemoResource,
  demoProvider,
  genSampleDemoResource,
} from './providers/demo.provider';

/**
 * .what = returns demo resources configured via process.argv
 * .why = enables test coverage of passthrough args feature
 * .note = parses --env flag from process.argv, defaults to 'test'
 */
export const getResources = async (): Promise<DomainEntity<any>[]> => {
  // parse args inside function so each call sees current process.argv
  // (avoids module cache issues when imported multiple times with different args)
  const { values } = parseArgs({
    args: process.argv.slice(2),
    options: {
      env: { type: 'string', default: 'test' },
    },
    strict: false, // allow unknown flags
  });

  const suffix = values.env === 'prod' ? '-production' : '-test';
  return [genSampleDemoResource({ name: `Resource${suffix}` })];
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
