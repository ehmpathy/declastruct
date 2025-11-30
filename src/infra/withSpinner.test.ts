import { given, when, then } from 'test-fns';

import { withSpinner } from './withSpinner';

describe('withSpinner', () => {
  given('a simple async operation', () => {
    when('the operation completes successfully', () => {
      then('it should return the result and duration', async () => {
        const { result, durationMs } = await withSpinner({
          message: 'test operation',
          operation: async () => {
            await new Promise((resolve) => setTimeout(resolve, 100));
            return 'success';
          },
        });

        expect(result).toEqual('success');
        expect(durationMs).toBeGreaterThanOrEqual(100);
        expect(durationMs).toBeLessThan(500);
      });
    });

    when('the operation throws an error', () => {
      then('it should propagate the error', async () => {
        await expect(
          withSpinner({
            message: 'failing operation',
            operation: async () => {
              throw new Error('test error');
            },
          }),
        ).rejects.toThrow('test error');
      });
    });
  });

  given('stdout output tracking', () => {
    when('spinner renders multiple frames', () => {
      then('it should overwrite previous frames after the first', async () => {
        const writes: string[] = [];
        const originalWrite = process.stdout.write.bind(process.stdout);

        // capture all writes
        process.stdout.write = ((chunk: string | Uint8Array): boolean => {
          const str = typeof chunk === 'string' ? chunk : chunk.toString();
          writes.push(str);
          return true;
        }) as typeof process.stdout.write;

        try {
          await withSpinner({
            message: 'test',
            operation: async () => {
              // wait long enough for multiple spinner frames
              await new Promise((resolve) => setTimeout(resolve, 200));
              return 'done';
            },
          });
        } finally {
          process.stdout.write = originalWrite;
        }

        // should have multiple writes (spinner frames)
        expect(writes.length).toBeGreaterThan(1);

        // first spinner frame should not start with \r (it's the first render)
        const spinnerFrames = writes.filter((w) => w.includes('test'));
        expect(spinnerFrames.length).toBeGreaterThan(0);
        expect(spinnerFrames[0]!.startsWith('\r')).toBe(false);

        // subsequent frames should use move-up + carriage-return to overwrite
        // the implementation uses \x1b[A (move up) then \r (carriage return)
        spinnerFrames.slice(1).forEach((frame) => {
          expect(frame.startsWith('\x1b[A\r')).toBe(true);
        });

        // last write should clear the line
        const lastWrite = writes[writes.length - 1];
        expect(lastWrite).toContain('\x1b[K'); // ANSI clear line
      });
    });

    when('other output occurs during spinner', () => {
      then('it should detect the interruption', async () => {
        const writes: string[] = [];
        const originalWrite = process.stdout.write.bind(process.stdout);

        process.stdout.write = ((chunk: string | Uint8Array): boolean => {
          const str = typeof chunk === 'string' ? chunk : chunk.toString();
          writes.push(str);
          return true;
        }) as typeof process.stdout.write;

        try {
          await withSpinner({
            message: 'test',
            operation: async () => {
              // simulate other output during operation
              await new Promise((resolve) => setTimeout(resolve, 50));
              console.log('interrupting output');
              await new Promise((resolve) => setTimeout(resolve, 100));
              return 'done';
            },
          });
        } finally {
          process.stdout.write = originalWrite;
        }

        // should have captured the interrupting output
        const hasInterrupt = writes.some((w) => w.includes('interrupting'));
        expect(hasInterrupt).toBe(true);

        // spinner should still complete and clear
        const lastWrite = writes[writes.length - 1];
        expect(lastWrite).toContain('\x1b[K');
      });
    });
  });

  given('spinner line replacement', () => {
    when('spinner completes successfully', () => {
      then(
        'it should clear the spinner line so done line can replace it',
        async () => {
          const writes: string[] = [];
          const originalWrite = process.stdout.write.bind(process.stdout);

          process.stdout.write = ((chunk: string | Uint8Array): boolean => {
            const str = typeof chunk === 'string' ? chunk : chunk.toString();
            writes.push(str);
            return true;
          }) as typeof process.stdout.write;

          try {
            await withSpinner({
              message: 'inflight',
              operation: async () => {
                await new Promise((resolve) => setTimeout(resolve, 100));
                return 'done';
              },
            });
          } finally {
            process.stdout.write = originalWrite;
          }

          // find spinner frames containing 'inflight'
          const spinnerFrames = writes.filter((w) => w.includes('inflight'));
          expect(spinnerFrames.length).toBeGreaterThan(0);

          // the final write should clear the line (contains \x1b[K)
          const lastWrite = writes[writes.length - 1];
          expect(lastWrite).toContain('\x1b[K');

          // spinner frames after the first should use move-up + carriage-return to overwrite
          // the implementation uses \x1b[A (move up) then \r (carriage return)
          const framesAfterFirst = spinnerFrames.slice(1);
          framesAfterFirst.forEach((frame) => {
            expect(frame.startsWith('\x1b[A\r')).toBe(true);
          });

          // verify the line is cleared at end, leaving space for "done" line
          // the clear happens via \r\x1b[K which moves cursor to start and clears
          const clearWrites = writes.filter(
            (w) => w.includes('\r') && w.includes('\x1b[K'),
          );
          expect(clearWrites.length).toBeGreaterThan(0);
        },
      );
    });
  });

  given('elapsed time formatting', () => {
    when('operation takes less than 60 seconds', () => {
      then('it should show seconds with one decimal', async () => {
        const writes: string[] = [];
        const originalWrite = process.stdout.write.bind(process.stdout);

        process.stdout.write = ((chunk: string | Uint8Array): boolean => {
          const str = typeof chunk === 'string' ? chunk : chunk.toString();
          writes.push(str);
          return true;
        }) as typeof process.stdout.write;

        try {
          await withSpinner({
            message: 'test',
            operation: async () => {
              await new Promise((resolve) => setTimeout(resolve, 100));
              return 'done';
            },
          });
        } finally {
          process.stdout.write = originalWrite;
        }

        // check that elapsed time format is like "0.1s"
        const hasSecondsFormat = writes.some((w) => /\d+\.\ds/.test(w));
        expect(hasSecondsFormat).toBe(true);
      });
    });
  });
});
