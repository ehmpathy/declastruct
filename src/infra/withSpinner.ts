/**
 * .what = wraps an async operation with a CLI spinner showing elapsed time
 * .why = provides visual feedback during long-running operations
 * .note = spinner renders on its own line below the action, cleared on completion
 */
export const withSpinner = async <T>(input: {
  message: string;
  operation: () => Promise<T>;
}): Promise<{ result: T; durationMs: number }> => {
  // spinner frames (braille pattern)
  const frames = ['⠋', '⠙', '⠹', '⠸', '⠼', '⠴', '⠦', '⠧', '⠇', '⠏'];
  let frameIndex = 0;
  const startMs = Date.now();

  // track if we own the current line (no other output since last render)
  let ownsCurrentLine = false; // start false since we haven't rendered yet
  let isSpinnerWriting = false;

  // intercept stdout to detect if other output occurred
  const originalWrite = process.stdout.write.bind(process.stdout);
  process.stdout.write = ((
    chunk: string | Uint8Array,
    ...args: unknown[]
  ): boolean => {
    // if this write is not from the spinner, mark that we lost ownership
    if (!isSpinnerWriting) {
      ownsCurrentLine = false;
    }

    return originalWrite(chunk, ...(args as [BufferEncoding]));
  }) as typeof process.stdout.write;

  // format elapsed time as human readable
  const formatElapsed = (ms: number): string => {
    const seconds = ms / 1000;
    if (seconds < 60) return `${seconds.toFixed(1)}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds.toFixed(0)}s`;
  };

  // render the current spinner state
  const render = (): void => {
    const elapsed = formatElapsed(Date.now() - startMs);
    const frame = frames[frameIndex % frames.length];
    const line = `   └─ ${frame} ${input.message} ${elapsed}`;

    // mark that we're the ones writing
    isSpinnerWriting = true;

    if (ownsCurrentLine) {
      // move up, clear line, write new frame, newline
      process.stdout.write(`\x1b[A\r\x1b[K${line}\n`);
    } else {
      // first render with trailing newline for whitespace
      process.stdout.write(`${line}\n`);
      ownsCurrentLine = true;
    }

    isSpinnerWriting = false;
    frameIndex++;
  };

  // start spinner interval (80ms for smooth animation)
  const interval = setInterval(render, 80);
  render(); // render immediately

  try {
    // execute the operation
    const result = await input.operation();
    const durationMs = Date.now() - startMs;

    // stop spinner
    clearInterval(interval);

    // restore original stdout.write
    process.stdout.write = originalWrite;

    // move up to spinner line, clear it
    if (ownsCurrentLine) {
      originalWrite('\x1b[A\r\x1b[K'); // move up + clear line
    } else {
      originalWrite('\n'); // newline if other output occurred
    }

    return { result, durationMs };
  } catch (error) {
    // stop spinner on error
    clearInterval(interval);

    // restore original stdout.write
    process.stdout.write = originalWrite;

    // move up to spinner line, clear it
    if (ownsCurrentLine) {
      originalWrite('\x1b[A\r\x1b[K');
    } else {
      originalWrite('\n');
    }

    throw error;
  }
};
