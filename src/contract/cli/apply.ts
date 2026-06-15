#!/usr/bin/env tsx

import { existsSync } from 'fs';
import { readFile } from 'fs/promises';
import { BadRequestError } from 'helpful-errors';
import { relative, resolve } from 'path';
import { getGitRepoRoot } from 'rhachet-artifact-git';
import { LogLevel, type LogMethods } from 'sdk-logs';
import { genBottleneck } from 'with-bottleneck';

// register tsconfig paths for dynamic imports of wish files
import '@src/infra/registerTsconfigPaths';

import type { ContextDeclastructCli } from '@src/domain.objects/ContextDeclastructCli';
import type { DeclaredResource } from '@src/domain.objects/DeclaredResource';
import { DeclastructPlan } from '@src/domain.objects/DeclastructPlan';
import { applyChanges } from '@src/domain.operations/apply/applyChanges';
import { initializeProviders } from '@src/infra/initializeProviders';

/**
 * .what = cli-friendly log methods that output plain strings
 * .why = genLogMethods outputs structured JSON which is not human-readable
 */
const log: LogMethods = {
  info: (...args) => console.info(...args),
  warn: (...args) => console.warn(...args),
  error: (...args) => console.error(...args),
  debug: (...args) => console.debug(...args),
  _: { level: LogLevel.INFO },
};

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
      throw new BadRequestError('--wish required when --plan yolo', {
        hint: 'add --wish <file> to specify the wish file',
      });
  } else {
    // standard mode requires --plan (not "yolo")
    if (!input.planFilePath)
      throw new BadRequestError('--plan required', {
        hint: 'add --plan <file> to specify the plan file',
      });
  }

  // resolve plan path (null for yolo mode)
  const resolvedPlanPath = isYoloMode
    ? null
    : resolve(process.cwd(), input.planFilePath!);

  // load plan from file (standard mode only)
  const plan = await (async (): Promise<DeclastructPlan | null> => {
    if (!resolvedPlanPath) return null;
    if (!existsSync(resolvedPlanPath))
      throw new BadRequestError('plan file not found', {
        path: resolvedPlanPath,
        hint: 'check that the --plan path points to an extant file',
      });
    const planJson = await readFile(resolvedPlanPath, 'utf-8');
    return new DeclastructPlan(JSON.parse(planJson));
  })();

  // resolve wish path (from input or from plan file)
  const resolvedWishPath = isYoloMode
    ? resolve(process.cwd(), input.wishFilePath!)
    : plan!.wish.uri;

  // validate wish file exists
  if (!existsSync(resolvedWishPath))
    throw new BadRequestError('wish file not found', {
      path: resolvedWishPath,
      hint: 'check that the wish file path is correct',
    });

  // get git root for relative path display
  const gitRoot = await getGitRepoRoot({ from: process.cwd() });
  const relativePlanPath = resolvedPlanPath
    ? relative(gitRoot, resolvedPlanPath)
    : null;
  const relativeWishPath = relative(gitRoot, resolvedWishPath);

  // log header
  log.info('');
  log.info('🌊 declastruct apply');
  if (relativePlanPath) {
    log.info(`   ├─ plan: ${relativePlanPath}`);
    log.info(`   └─ wish: ${relativeWishPath}`);
  } else {
    log.info(`   ├─ plan: (yolo)`);
    log.info(`   └─ wish: ${relativeWishPath}`);
  }
  log.info('');

  // create cli context with passthrough args from plan
  const cliContext: ContextDeclastructCli = {
    passthrough: { argv: plan?.wish.argv ?? [] },
  };

  // inject argv from plan so wish file sees same args as plan time
  // this ensures staleness check compares same resources
  process.argv = [
    process.argv[0]!,
    process.argv[1]!,
    ...cliContext.passthrough.argv,
  ];

  // import wish file
  const wishModule = await import(resolvedWishPath);

  // handle ESM/CJS interop - module may have named exports directly or via .default
  // biome-ignore lint/suspicious/noExplicitAny: dynamic import returns unknown shape
  const wish: any = wishModule.default ?? wishModule;

  // validate exports
  if (typeof wish.getResources !== 'function')
    throw new BadRequestError('wish file must export getResources() function', {
      path: resolvedWishPath,
      hint: 'add `export const getResources = () => [...]` to the wish file',
    });
  if (typeof wish.getProviders !== 'function')
    throw new BadRequestError('wish file must export getProviders() function', {
      path: resolvedWishPath,
      hint: 'add `export const getProviders = () => [...]` to the wish file',
    });

  // get resources and providers
  const resources: DeclaredResource[] = await wish.getResources();
  const providers = await wish.getProviders();

  // initialize providers
  await initializeProviders({ providers });

  // create context with passthrough args
  const context = {
    bottleneck: genBottleneck({ concurrency: 1 }),
    log,
    passthrough: cliContext.passthrough,
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
  log.info('🌊 declastruct apply');
  log.info(`   └─ applied: ${result.appliedChanges.length}`);
  log.info('');
};
