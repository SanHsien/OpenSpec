import { describe, expect, it } from 'vitest';
import { readFileSync } from 'node:fs';
import path from 'node:path';

// The cli-completion spec once promised $ZDOTDIR handling (from upstream #2172)
// that this fork defers and the zsh installer does not implement. A spec is the
// authority readers trust, so it must not claim behavior the code lacks.
const repoRoot = path.resolve(__dirname, '../../..');
const spec = readFileSync(path.join(repoRoot, 'openspec/specs/cli-completion/spec.md'), 'utf-8');
const installer = readFileSync(
  path.join(repoRoot, 'src/core/completions/installers/zsh-installer.ts'),
  'utf-8'
);

describe('cli-completion spec vs zsh installer', () => {
  it('only promises $ZDOTDIR-relative .zshrc handling if the installer reads ZDOTDIR', () => {
    const installerReadsZdotdir = installer.includes('ZDOTDIR');
    const specPromisesZdotdir = /\$\{ZDOTDIR|never create or edit `~\/\.zshrc` when `\$ZDOTDIR`/.test(spec);
    expect(specPromisesZdotdir).toBe(installerReadsZdotdir);
  });
});
