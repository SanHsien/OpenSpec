import { describe, expect, it } from 'vitest';
import ora from 'ora';
import { createSpinner } from '../../src/utils/spinner.js';

function fakeStream(columns: number | undefined, isTTY = true) {
  const output: string[] = [];
  const stream = {
    isTTY,
    columns,
    write(chunk: string) {
      output.push(String(chunk));
      return true;
    },
    cursorTo() {},
    moveCursor() {},
    clearLine() {},
    on() { return stream; },
    once() { return stream; },
    removeListener() { return stream; },
  };
  return { stream: stream as unknown as NodeJS.WriteStream, output };
}

// A plain ora spinner on a TTY reporting zero columns never returns from
// stop()/succeed(): its clear() loops `ceil(width / 0) = Infinity` times. The
// commands that show a spinner (status, instructions, new change, init, update,
// ...) all go through createSpinner so they cannot hang there.
describe('createSpinner', () => {
  it('turns the animation off on a zero-column TTY so start and succeed return', () => {
    const { stream, output } = fakeStream(0);
    const spinner = createSpinner({ text: 'Loading change status...', stream });

    expect(spinner.isEnabled).toBe(false);
    spinner.start();
    spinner.succeed('Loaded');

    expect(output.join('')).toContain('Loading change status...');
    expect(output.join('')).toContain('Loaded');
  });

  it('treats a TTY with no reported width like a zero-column one', () => {
    const { stream } = fakeStream(undefined);
    expect(createSpinner({ text: 'x', stream }).isEnabled).toBe(false);
  });

  it('leaves the decision to ora on a TTY that has columns', () => {
    // ora itself turns the animation off under CI or TERM=dumb, so the
    // property is "the helper does not override ora here", not "enabled".
    const { stream } = fakeStream(80);
    expect(createSpinner({ text: 'x', stream }).isEnabled).toBe(ora({ text: 'x', stream }).isEnabled);
  });

  it('keeps the animation on a TTY that has columns outside CI', () => {
    const savedCi = process.env.CI;
    const savedTerm = process.env.TERM;
    delete process.env.CI;
    process.env.TERM = 'xterm-256color';
    try {
      const { stream } = fakeStream(80);
      expect(createSpinner({ text: 'x', stream }).isEnabled).toBe(true);
    } finally {
      if (savedCi === undefined) delete process.env.CI;
      else process.env.CI = savedCi;
      if (savedTerm === undefined) delete process.env.TERM;
      else process.env.TERM = savedTerm;
    }
  });

  it('leaves an explicit isEnabled from the caller alone', () => {
    const { stream } = fakeStream(0);
    expect(createSpinner({ text: 'x', stream, isEnabled: true }).isEnabled).toBe(true);
  });

  it('accepts plain text like ora does', () => {
    expect(createSpinner('Generating instructions...').text).toBe('Generating instructions...');
  });
});
