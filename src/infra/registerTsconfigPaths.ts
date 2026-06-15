/**
 * .what = registers tsconfig paths for dynamic imports
 * .why = tsx doesn't resolve tsconfig paths for dynamic imports by default
 * .note = must be imported before any dynamic import of TypeScript files
 */

import { existsSync, readFileSync } from 'fs';
import { resolve } from 'path';
import { register } from 'tsconfig-paths';

/**
 * .what = finds and parses tsconfig.json
 * .why = need the paths configuration for registration
 */
const loadTsconfig = (
  cwd: string,
): { baseUrl: string; paths: Record<string, string[]> } | null => {
  const tsconfigPath = resolve(cwd, 'tsconfig.json');
  if (!existsSync(tsconfigPath)) return null;

  try {
    const content = readFileSync(tsconfigPath, 'utf-8');
    // remove comments from JSON (tsconfig allows comments)
    const jsonWithoutComments = content.replace(/\/\*[\s\S]*?\*\/|\/\/.*/g, '');
    const tsconfig = JSON.parse(jsonWithoutComments);
    const compilerOptions = tsconfig.compilerOptions || {};

    return {
      baseUrl: compilerOptions.baseUrl || '.',
      paths: compilerOptions.paths || {},
    };
  } catch {
    return null;
  }
};

/**
 * .what = registers tsconfig paths if available
 * .why = enables @src/ and other aliases to resolve in dynamic imports
 */
export const registerTsconfigPaths = (): void => {
  const cwd = process.cwd();
  const config = loadTsconfig(cwd);

  if (!config || Object.keys(config.paths).length === 0) return;

  register({
    baseUrl: resolve(cwd, config.baseUrl),
    paths: config.paths,
  });
};

// auto-register on import
registerTsconfigPaths();
