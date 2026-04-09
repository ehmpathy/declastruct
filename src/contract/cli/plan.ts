#!/usr/bin/env tsx

import Bottleneck from 'bottleneck';
import { existsSync } from 'fs';
import { mkdir, writeFile } from 'fs/promises';
import { BadRequestError } from 'helpful-errors';
import { dirname, relative, resolve } from 'path';
import { getGitRepoRoot } from 'rhachet-artifact-git';

import type { ContextDeclastructCli } from '@src/domain.objects/ContextDeclastructCli';
import type { DeclaredResource } from '@src/domain.objects/DeclaredResource';
import { planChanges } from '@src/domain.operations/plan/planChanges';
import {
  finalizeProviders,
  initializeProviders,
} from '@src/infra/initializeProviders';

const log = console;

/**
 * .what = executes the plan command to generate an infrastructure change plan
 * .why = provides CLI interface for planning infrastructure changes
 * .note = requires wish file with getResources() and getProviders() exports
 */
export const executePlanCommand = async ({
  wishFilePath,
  planFilePath,
  snapFilePath,
  passthroughArgs = [],
}: {
  wishFilePath: string;
  planFilePath: string;
  snapFilePath: string | null;
  passthroughArgs?: string[];
}): Promise<void> => {
  // resolve paths
  const resolvedWishPath = resolve(process.cwd(), wishFilePath);
  const resolvedPlanPath = resolve(process.cwd(), planFilePath);
  const resolvedSnapPath = snapFilePath
    ? resolve(process.cwd(), snapFilePath)
    : null;

  // get git root for relative path display
  const gitRoot = await getGitRepoRoot({ from: process.cwd() });
  const relativeWishPath = relative(gitRoot, resolvedWishPath);
  const relativePlanPath = relative(gitRoot, resolvedPlanPath);
  const relativeSnapPath = resolvedSnapPath
    ? relative(gitRoot, resolvedSnapPath)
    : null;

  // validate wish file exists
  if (!existsSync(resolvedWishPath)) {
    throw new BadRequestError('wish file not found', {
      path: resolvedWishPath,
      hint: 'check that the --wish path points to an extant file',
    });
  }

  log.info('');
  log.info('🌊 declastruct plan');
  log.info(`   ├─ wish: ${relativeWishPath}`);
  log.info(`   ├─ plan: ${relativePlanPath}`);
  if (relativeSnapPath) log.info(`   └─ snap: ${relativeSnapPath}`);
  else log.info(`   └─ snap: (none)`);
  log.info('');

  // create cli context with passthrough args
  const cliContext: ContextDeclastructCli = {
    passthrough: { argv: passthroughArgs },
  };

  // inject passthrough args into process.argv before import
  process.argv = [
    process.argv[0]!,
    process.argv[1]!,
    ...cliContext.passthrough.argv,
  ];

  // import wish file (now sees passthrough.argv in process.argv)
  const wish = await import(resolvedWishPath);

  // validate exports
  if (typeof wish.getResources !== 'function') {
    throw new BadRequestError('wish file must export getResources() function', {
      path: resolvedWishPath,
      hint: 'add `export const getResources = () => [...]` to the wish file',
    });
  }
  if (typeof wish.getProviders !== 'function') {
    throw new BadRequestError('wish file must export getProviders() function', {
      path: resolvedWishPath,
      hint: 'add `export const getProviders = () => [...]` to the wish file',
    });
  }

  // get resources and providers
  const resources: DeclaredResource[] = await wish.getResources();
  const providers = await wish.getProviders();

  // initialize providers
  await initializeProviders({ providers });

  // create context with passthrough args
  const context = {
    bottleneck: new Bottleneck({ maxConcurrent: 1 }),
    log,
    passthrough: cliContext.passthrough,
  };

  // plan changes (outputs emitted in real-time by planChanges)
  const { plan, snapshot } = await planChanges(
    {
      resources,
      providers,
      wishFilePath: resolvedWishPath,
    },
    context,
  );

  // ensure output directory exists
  const planDir = dirname(resolvedPlanPath);
  await mkdir(planDir, { recursive: true });

  // write plan to file
  await writeFile(resolvedPlanPath, JSON.stringify(plan, null, 2), 'utf-8');

  // write snapshot to file if requested
  if (resolvedSnapPath) {
    const snapDir = dirname(resolvedSnapPath);
    await mkdir(snapDir, { recursive: true });
    await writeFile(
      resolvedSnapPath,
      JSON.stringify(snapshot, null, 2),
      'utf-8',
    );
  }

  // cleanup providers
  await finalizeProviders({ providers });

  // log summary
  log.info('');
  log.info('🌊 declastruct plan');
  log.info(`   ├─ resources: ${plan.changes.length}`);
  log.info(`   ├─ plan: ${relativePlanPath}`);
  if (relativeSnapPath) log.info(`   └─ snap: ${relativeSnapPath}`);
  else log.info(`   └─ snap: (none)`);
  log.info('');
};
