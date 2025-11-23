#!/usr/bin/env tsx
import Bottleneck from 'bottleneck';
import { existsSync } from 'fs';
import { writeFile } from 'fs/promises';
import { BadRequestError } from 'helpful-errors';
import { resolve } from 'path';

import { planChanges } from '../../domain.operations/plan/planChanges';

const log = console;

/**
 * .what = executes the plan command to generate an infrastructure change plan
 * .why = provides CLI interface for planning infrastructure changes
 * .note = requires wish file with getResources() and getProviders() exports
 */
export const executePlanCommand = async ({
  wishFilePath,
  planFilePath,
}: {
  wishFilePath: string;
  planFilePath: string;
}): Promise<void> => {
  // resolve paths
  const resolvedWishPath = resolve(process.cwd(), wishFilePath);
  const resolvedPlanPath = resolve(process.cwd(), planFilePath);

  // validate wish file exists
  if (!existsSync(resolvedWishPath)) {
    throw new BadRequestError(`Wish file not found: ${resolvedWishPath}`);
  }

  log.info('🌊 declastruct plan');
  log.info(`   wish: ${resolvedWishPath}`);
  log.info(`   plan: ${resolvedPlanPath}`);
  log.info('');

  // import wish file
  const wish = await import(resolvedWishPath);

  // validate exports
  if (typeof wish.getResources !== 'function') {
    throw new BadRequestError('Wish file must export getResources() function');
  }
  if (typeof wish.getProviders !== 'function') {
    throw new BadRequestError('Wish file must export getProviders() function');
  }

  // get resources and providers
  const resources = await wish.getResources();
  const providers = await wish.getProviders();

  // initialize providers
  log.info('✨ start providers...');
  await Promise.all(providers.map((p: any) => p.hooks.beforeAll()));

  // create context
  const context = {
    bottleneck: new Bottleneck({ maxConcurrent: 10 }),
    log,
  };

  // plan changes (logs emitted in real-time by planChanges)
  log.info('🔮 plan changes...');
  log.info('');
  const plan = await planChanges(
    {
      resources,
      providers,
      wishFilePath: resolvedWishPath,
    },
    context,
  );

  // write plan to file
  await writeFile(resolvedPlanPath, JSON.stringify(plan, null, 2), 'utf-8');

  // cleanup providers
  log.info('✨ stop providers...');
  await Promise.all(providers.map((p: any) => p.hooks.afterAll()));

  // log summary
  log.info('');
  log.info(`🌊 planned for ${plan.changes.length} resources`);
  log.info(`   into ${resolvedPlanPath}`);
};
