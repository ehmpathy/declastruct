#!/usr/bin/env tsx
import Bottleneck from 'bottleneck';
import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { BadRequestError } from 'helpful-errors';
import { resolve } from 'path';

import { DeclastructPlan } from '../../domain.objects/DeclastructPlan';
import { applyChanges } from '../../domain.operations/apply/applyChanges';

const log = console;

/**
 * .what = executes the apply command to apply an infrastructure change plan
 * .why = provides CLI interface for applying infrastructure changes
 * .note = loads plan from file and wish file from plan.wish.uri
 */
export const executeApplyCommand = async ({
  planFilePath,
}: {
  planFilePath: string;
}): Promise<void> => {
  // resolve path
  const resolvedPlanPath = resolve(process.cwd(), planFilePath);

  // validate plan file exists
  if (!existsSync(resolvedPlanPath)) {
    throw new BadRequestError(`Plan file not found: ${resolvedPlanPath}`);
  }

  log.info('🌊 declastruct apply');
  log.info(`   plan: ${resolvedPlanPath}`);
  log.info('');

  // load plan from file
  const planJson = await readFile(resolvedPlanPath, 'utf-8');
  const plan = new DeclastructPlan(JSON.parse(planJson));

  // import wish file from plan
  const wishPath = plan.wish.uri;
  const wish = await import(wishPath);

  // validate exports
  if (typeof wish.getProviders !== 'function') {
    throw new BadRequestError('Wish file must export getProviders() function');
  }
  if (typeof wish.getResources !== 'function') {
    throw new BadRequestError('Wish file must export getResources() function');
  }

  // get resources and providers from wish file
  const resources = await wish.getResources();
  const providers = await wish.getProviders();

  // initialize providers
  log.info('✨ start providers...');
  await Promise.all(providers.map((p: any) => p.hooks.beforeAll()));

  // create context
  const context = {
    bottleneck: new Bottleneck({ maxConcurrent: 1 }),
    log,
  };

  // apply changes (logs emitted in real-time by applyChanges)
  const result = await applyChanges({ plan, resources, providers }, context);

  // cleanup providers
  log.info('');
  log.info('✨ stop providers...');
  await Promise.all(providers.map((p: any) => p.hooks.afterAll()));

  // log summary
  log.info('');
  log.info(`🌊 applied ${result.appliedChanges.length} changes`);
  log.info('');
};
