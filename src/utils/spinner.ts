import ora, { type Ora, type Options as OraOptions } from 'ora';
import { canRenderSpinner } from './interactive.js';

/**
 * Creates an ora spinner that cannot hang on a zero-column TTY.
 *
 * ora erases `ceil(width / columns)` lines on every frame and on stop, so a TTY
 * that reports zero columns (a pty inherited from lefthook, `script -qec`)
 * makes `clear()` loop forever. When the target stream cannot render a
 * spinner this turns the animation off; ora then prints its start text and
 * final succeed/fail/warn/info lines as plain output, so callers need no
 * other change. An explicit `isEnabled` from the caller still wins.
 */
export function createSpinner(options?: string | OraOptions): Ora {
  const resolved: OraOptions = typeof options === 'string' ? { text: options } : { ...(options ?? {}) };
  const stream = (resolved.stream ?? process.stderr) as { isTTY?: boolean; columns?: number };
  if (resolved.isEnabled === undefined && !canRenderSpinner(stream)) {
    return ora({ ...resolved, isEnabled: false });
  }
  return ora(resolved);
}
