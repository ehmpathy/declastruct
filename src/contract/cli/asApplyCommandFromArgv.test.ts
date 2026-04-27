import { given, then, when } from 'test-fns';

import { asApplyCommandFromArgv } from './asApplyCommandFromArgv';

describe('asApplyCommandFromArgv', () => {
  given('[case1] npx invocation with basic flags', () => {
    when('[t0] transformed', () => {
      then('produces apply command with plan flag', () => {
        const result = asApplyCommandFromArgv({
          argv: [
            '/usr/bin/node',
            '/home/user/.npm/_npx/declastruct/bin/run',
            'plan',
            '--wish',
            'wish.ts',
            '--into',
            'plan.json',
          ],
          planFilePath: 'plan.json',
        });
        expect(result).toEqual('npx declastruct apply --plan plan.json');
        expect(result).toMatchSnapshot();
      });
    });
  });

  given('[case2] pnpm dlx invocation', () => {
    when('[t0] transformed', () => {
      then('preserves pnpm dlx prefix', () => {
        const result = asApplyCommandFromArgv({
          argv: [
            '/usr/bin/node',
            '/home/user/.pnpm/declastruct/bin/run',
            'plan',
            '--wish',
            'wish.ts',
            '--into',
            'plan.json',
          ],
          planFilePath: 'plan.json',
        });
        expect(result).toEqual('pnpm dlx declastruct apply --plan plan.json');
        expect(result).toMatchSnapshot();
      });
    });
  });

  given('[case3] yarn dlx invocation', () => {
    when('[t0] transformed', () => {
      then('preserves yarn dlx prefix', () => {
        const result = asApplyCommandFromArgv({
          argv: [
            '/usr/bin/node',
            '/home/user/.yarn/cache/declastruct/bin/run',
            'plan',
            '--wish',
            'wish.ts',
            '--into',
            'plan.json',
          ],
          planFilePath: 'plan.json',
        });
        expect(result).toEqual('yarn dlx declastruct apply --plan plan.json');
        expect(result).toMatchSnapshot();
      });
    });
  });

  given('[case4] local node_modules invocation', () => {
    when('[t0] transformed', () => {
      then('uses npx prefix', () => {
        const result = asApplyCommandFromArgv({
          argv: [
            '/usr/bin/node',
            '/project/node_modules/.bin/declastruct',
            'plan',
            '--wish',
            'wish.ts',
            '--into',
            'plan.json',
          ],
          planFilePath: 'plan.json',
        });
        expect(result).toEqual('npx declastruct apply --plan plan.json');
        expect(result).toMatchSnapshot();
      });
    });
  });

  given('[case5] command with --snap flag', () => {
    when('[t0] transformed', () => {
      then('removes --snap flag', () => {
        const result = asApplyCommandFromArgv({
          argv: [
            '/usr/bin/node',
            '/home/user/.npm/_npx/declastruct/bin/run',
            'plan',
            '--wish',
            'wish.ts',
            '--into',
            'plan.json',
            '--snap',
            'snap.json',
          ],
          planFilePath: 'plan.json',
        });
        expect(result).toEqual('npx declastruct apply --plan plan.json');
        expect(result).toMatchSnapshot();
      });
    });
  });

  given('[case6] command with passthrough args', () => {
    when('[t0] transformed', () => {
      then('removes passthrough args', () => {
        const result = asApplyCommandFromArgv({
          argv: [
            '/usr/bin/node',
            '/home/user/.npm/_npx/declastruct/bin/run',
            'plan',
            '--wish',
            'wish.ts',
            '--into',
            'plan.json',
            '--',
            '--env',
            'prod',
          ],
          planFilePath: 'plan.json',
        });
        expect(result).toEqual('npx declastruct apply --plan plan.json');
        expect(result).toMatchSnapshot();
      });
    });
  });

  given('[case7] command with other flags to preserve', () => {
    when('[t0] transformed', () => {
      then('preserves other flags', () => {
        const result = asApplyCommandFromArgv({
          argv: [
            '/usr/bin/node',
            '/home/user/.npm/_npx/declastruct/bin/run',
            'plan',
            '--wish',
            'wish.ts',
            '--into',
            'plan.json',
            '--verbose',
            '--debug',
          ],
          planFilePath: 'plan.json',
        });
        expect(result).toEqual(
          'npx declastruct apply --plan plan.json --verbose --debug',
        );
        expect(result).toMatchSnapshot();
      });
    });
  });

  given('[case8] command with --flag=value syntax', () => {
    when('[t0] transformed', () => {
      then('removes --wish=value and --into=value', () => {
        const result = asApplyCommandFromArgv({
          argv: [
            '/usr/bin/node',
            '/home/user/.npm/_npx/declastruct/bin/run',
            'plan',
            '--wish=wish.ts',
            '--into=plan.json',
          ],
          planFilePath: 'plan.json',
        });
        expect(result).toEqual('npx declastruct apply --plan plan.json');
        expect(result).toMatchSnapshot();
      });
    });
  });

  given('[case9] bare invocation (global install)', () => {
    when('[t0] transformed', () => {
      then('produces command without prefix', () => {
        const result = asApplyCommandFromArgv({
          argv: [
            '/usr/bin/node',
            '/usr/local/bin/declastruct',
            'plan',
            '--wish',
            'wish.ts',
            '--into',
            'plan.json',
          ],
          planFilePath: 'plan.json',
        });
        expect(result).toEqual('declastruct apply --plan plan.json');
        expect(result).toMatchSnapshot();
      });
    });
  });

  given('[case10] relative plan path', () => {
    when('[t0] transformed', () => {
      then('uses the provided plan path', () => {
        const result = asApplyCommandFromArgv({
          argv: [
            '/usr/bin/node',
            '/home/user/.npm/_npx/declastruct/bin/run',
            'plan',
            '--wish',
            'provision/aws/wish.ts',
            '--into',
            'provision/aws/.temp/plan.json',
          ],
          planFilePath: 'provision/aws/.temp/plan.json',
        });
        expect(result).toEqual(
          'npx declastruct apply --plan provision/aws/.temp/plan.json',
        );
        expect(result).toMatchSnapshot();
      });
    });
  });

  given('[case11] minimal argv with no flags', () => {
    when('[t0] transformed', () => {
      then('produces minimal apply command', () => {
        const result = asApplyCommandFromArgv({
          argv: ['/usr/bin/node', '/home/user/.npm/_npx/declastruct/bin/run'],
          planFilePath: 'plan.json',
        });
        expect(result).toEqual('npx declastruct apply --plan plan.json');
        expect(result).toMatchSnapshot();
      });
    });
  });

  given('[case12] empty plan file path', () => {
    when('[t0] transformed', () => {
      then('produces command with empty plan path', () => {
        const result = asApplyCommandFromArgv({
          argv: [
            '/usr/bin/node',
            '/home/user/.npm/_npx/declastruct/bin/run',
            'plan',
            '--wish',
            'wish.ts',
            '--into',
            '',
          ],
          planFilePath: '',
        });
        expect(result).toEqual('npx declastruct apply --plan ');
        expect(result).toMatchSnapshot();
      });
    });
  });

  given('[case13] unknown exec path (edge case)', () => {
    when('[t0] transformed', () => {
      then('produces bare command', () => {
        const result = asApplyCommandFromArgv({
          argv: [
            '/usr/bin/node',
            '/some/unknown/path/to/cli',
            'plan',
            '--wish',
            'wish.ts',
            '--into',
            'plan.json',
          ],
          planFilePath: 'plan.json',
        });
        expect(result).toEqual('declastruct apply --plan plan.json');
        expect(result).toMatchSnapshot();
      });
    });
  });

  given('[case14] empty argv', () => {
    when('[t0] transformed', () => {
      then('produces bare apply command', () => {
        const result = asApplyCommandFromArgv({
          argv: [],
          planFilePath: 'plan.json',
        });
        expect(result).toEqual('declastruct apply --plan plan.json');
        expect(result).toMatchSnapshot();
      });
    });
  });
});
