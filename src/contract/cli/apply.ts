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
 * .what = executes the apply command to apply infrastructure changes
 * .why = provides CLI interface for applying infrastructure changes
 * .note = supports two modes:
 *   - standard: load plan from file, validate staleness, apply
 *   - yolo: plan from wish directly, skip validation, apply immediately
 */
export const executeApplyCommand = async (input: {
  planFilePath?: string;
  wishFilePath?: string;
}): Promise<void> => {
  // determine mode and validate input
  const isYoloMode = input.planFilePath === 'yolo';
  if (isYoloMode) {
    // yolo mode requires --wish
    if (!input.wishFilePath)
      throw new BadRequestError('--wish required when --plan yolo');
  } else {
    // standard mode requires --plan (not "yolo")
    if (!input.planFilePath) throw new BadRequestError('--plan required');
  }

  // resolve plan path (null for yolo mode)
  const resolvedPlanPath = isYoloMode
    ? null
    : resolve(process.cwd(), input.planFilePath!);

  // load plan from file (standard mode only)
  const plan = await (async (): Promise<DeclastructPlan | null> => {
    if (!resolvedPlanPath) return null;
    if (!existsSync(resolvedPlanPath))
      throw new BadRequestError(`Plan file not found: ${resolvedPlanPath}`);
    const planJson = await readFile(resolvedPlanPath, 'utf-8');
    return new DeclastructPlan(JSON.parse(planJson));
  })();

  // resolve wish path (from input or from plan file)
  const resolvedWishPath = isYoloMode
    ? resolve(process.cwd(), input.wishFilePath!)
    : plan!.wish.uri;

  // validate wish file exists
  if (!existsSync(resolvedWishPath))
    throw new BadRequestError(`Wish file not found: ${resolvedWishPath}`);

  // log header
  log.info('');
  log.info('🌊 declastruct apply');
  if (resolvedPlanPath) log.info(`   plan: ${resolvedPlanPath}`);
  log.info(`   wish: ${resolvedWishPath}`);
  log.info('');

  // import wish file
  const wish = await import(resolvedWishPath);

  // validate exports
  if (typeof wish.getResources !== 'function')
    throw new BadRequestError('Wish file must export getResources() function');
  if (typeof wish.getProviders !== 'function')
    throw new BadRequestError('Wish file must export getProviders() function');

  // get resources and providers
  const resources = await wish.getResources();
  const providers = await wish.getProviders();

  // initialize providers
  // log.info('✨ start providers...');
  await Promise.all(providers.map((p: any) => p.hooks.beforeAll()));

  // create context
  const context = {
    bottleneck: new Bottleneck({ maxConcurrent: 1 }),
    log,
  };

  // apply changes (plan=null triggers yolo mode, skipping validation)
  const result = await applyChanges(
    {
      plan,
      resources,
      providers,
    },
    context,
  );

  // cleanup providers
  // log.info('');
  // log.info('✨ stop providers...');
  await Promise.all(providers.map((p: any) => p.hooks.afterAll()));

  // log summary
  log.info('');
  log.info(`🌊 applied ${result.appliedChanges.length} changes`);
  log.info('');
};
