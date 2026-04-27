import { spawn } from 'child_process';
import { existsSync } from 'fs';
import { mkdir, readFile } from 'fs/promises';
import { resolve } from 'path';
import { getUuid } from 'uuid-fns';

import { DeclastructPlan } from '@src/domain.objects/DeclastructPlan';

/**
 * .what = executes CLI command and captures stdout/stderr
 * .why = enables acceptance tests of CLI behavior
 */
const execCli = async (
  args: string[],
): Promise<{ stdout: string; stderr: string; exitCode: number | null }> => {
  return new Promise((resolve) => {
    const proc = spawn('npx', ['tsx', 'bin/run', ...args], {
      cwd: process.cwd(),
      env: { ...process.env, FORCE_COLOR: '0' },
    });

    let stdout = '';
    let stderr = '';

    proc.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    proc.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    proc.on('close', (exitCode) => {
      resolve({ stdout, stderr, exitCode });
    });
  });
};

/**
 * .what = generates unique temp directory for test run
 * .why = enables isolated test artifacts without cleanup
 */
const genTempDir = async (): Promise<string> => {
  const testUuid = getUuid();
  const tempDir = resolve(process.cwd(), `src/.test/assets/.temp/${testUuid}`);
  await mkdir(tempDir, { recursive: true });
  return tempDir;
};

describe('invoke CLI', () => {
  describe('plan success output', () => {
    it('should show apply hint after plan completes', async () => {
      const tempDir = await genTempDir();
      const planFilePath = resolve(tempDir, 'plan.json');
      const wishFilePath = resolve(
        process.cwd(),
        'src/.test/assets/wish.fixture.ts',
      );

      const { stdout, exitCode } = await execCli([
        'plan',
        '--wish',
        wishFilePath,
        '--into',
        planFilePath,
      ]);

      expect(exitCode).toBe(0);
      expect(stdout).toContain('🥥 did you know?');
      expect(stdout).toContain('to apply, run');
      expect(stdout).toContain('declastruct apply --plan');

      // sanitize dynamic values for stable snapshot
      const sanitized = stdout
        // strip ANSI escape sequences (cursor movement, colors, etc)
        // biome-ignore lint/suspicious/noControlCharactersInRegex: ANSI escape sequences use control chars
        .replace(/\x1b\[[0-9;]*[A-Za-z]/g, '')
        // strip carriage returns
        .replace(/\r/g, '')
        // strip whitespace at end of lines
        .replace(/[ \t]+$/gm, '')
        .replace(/\.temp\/[a-f0-9-]+\//g, '.temp/[UUID]/')
        .replace(/\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z/g, '[TIMESTAMP]')
        // sanitize resource slugs: DemoResource.uuid.hash → DemoResource.[UUID].[HASH]
        .replace(
          /DemoResource\.[a-f0-9-]{36}\.[a-f0-9]+/g,
          'DemoResource.[UUID].[HASH]',
        )
        // sanitize exid values: "exid": "uuid" → "exid": "[UUID]"
        .replace(/"exid": "[a-f0-9-]{36}"/g, '"exid": "[UUID]"');
      expect(sanitized).toMatchSnapshot();
    });
  });

  describe('plan --help', () => {
    it('should show passthrough args in plan help text', async () => {
      const { stdout, exitCode } = await execCli(['plan', '--help']);

      expect(exitCode).toBe(0);
      expect(stdout).toContain('[-- <wish-args>]');
      expect(stdout).toMatchSnapshot();
    });
  });

  describe('plan with unknown option', () => {
    it('should guide user to use -- when unknown option passed', async () => {
      const tempDir = await genTempDir();
      const planFilePath = resolve(tempDir, 'plan.json');
      const wishFilePath = resolve(
        process.cwd(),
        'src/.test/assets/wish.fixture.ts',
      );

      const { stderr, exitCode } = await execCli([
        'plan',
        '--wish',
        wishFilePath,
        '--into',
        planFilePath,
        '--env',
        'prod',
      ]);

      expect(exitCode).toBe(1);
      expect(stderr).toContain("error: unknown option '--env'");
      expect(stderr).toContain(
        'hint: to pass args to your wish file, use: -- --env',
      );
      expect(stderr).toMatchSnapshot();
    });

    it('should catch typos on declastruct flags', async () => {
      const tempDir = await genTempDir();
      const planFilePath = resolve(tempDir, 'plan.json');

      const { stderr, exitCode } = await execCli([
        'plan',
        '--wishe',
        'resources.ts',
        '--into',
        planFilePath,
      ]);

      // typo on declastruct flag: commander sees --wishe as unknown, so --wish remains unspecified
      expect(exitCode).toBe(1);
      expect(stderr).toContain(
        "error: required option '--wish <file>' not specified",
      );
    });
  });

  describe('plan with passthrough args', () => {
    it('should pass args after -- to wish file', async () => {
      const tempDir = await genTempDir();
      const planFilePath = resolve(tempDir, 'plan.json');
      const wishFilePath = resolve(
        process.cwd(),
        'src/.test/assets/wish-with-args.fixture.ts',
      );

      const { exitCode } = await execCli([
        'plan',
        '--wish',
        wishFilePath,
        '--into',
        planFilePath,
        '--',
        '--env',
        'prod',
      ]);

      expect(exitCode).toBe(0);
      expect(existsSync(planFilePath)).toBe(true);

      // verify resource name reflects prod env
      const planJson = await readFile(planFilePath, 'utf-8');
      const plan = new DeclastructPlan(JSON.parse(planJson));
      expect((plan.changes[0]?.state.desired as { name: string }).name).toBe(
        'Resource-production',
      );
    });

    it('should pass --wish after -- to wish file (user owns namespace)', async () => {
      const tempDir = await genTempDir();
      const planFilePath = resolve(tempDir, 'plan.json');
      const wishFilePath = resolve(
        process.cwd(),
        'src/.test/assets/wish-with-args.fixture.ts',
      );

      // user passes --wish after -- (wish file arg, not declastruct flag)
      const { exitCode } = await execCli([
        'plan',
        '--wish',
        wishFilePath,
        '--into',
        planFilePath,
        '--',
        '--env',
        'prod',
        '--wish',
        'custom-value',
      ]);

      // should succeed - --wish after -- is user's problem
      expect(exitCode).toBe(0);
    });
  });

  describe('apply with passthrough args', () => {
    it('should ignore passthrough args in yolo mode', async () => {
      const wishFilePath = resolve(
        process.cwd(),
        'src/.test/assets/wish-with-args.fixture.ts',
      );

      // run apply in yolo mode with -- --env prod (should be ignored)
      // yolo mode skips staleness validation, appropriate for this test
      const { exitCode, stdout } = await execCli([
        'apply',
        '--plan',
        'yolo',
        '--wish',
        wishFilePath,
        '--',
        '--env',
        'prod',
      ]);

      // apply should succeed (args after -- are ignored)
      expect(exitCode).toBe(0);

      // verify resource used test env (default), not prod
      // since apply clears process.argv, passthrough args are ignored
      expect(stdout).toContain('Resource-test');
      expect(stdout).not.toContain('Resource-production');
    });
  });
});
