import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';
import nodeFs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import fs from 'fs/promises';
import os from 'os';
import {
  removeUneditedCommandFiles,
  recordGeneratedCommandFiles,
  formatKeptCommandWarning,
  COMMAND_MANIFEST_PATH,
} from '../../../src/core/shared/command-removal.js';
import { CommandAdapterRegistry, generateCommand } from '../../../src/core/command-generation/index.js';
import { getCommandContents } from '../../../src/core/shared/skill-generation.js';
import { ALL_WORKFLOWS } from '../../../src/core/profiles.js';

const TOOL = 'claude';

describe('removeUneditedCommandFiles', () => {
  let dir: string;
  const adapter = () => CommandAdapterRegistry.get(TOOL)!;
  const target = (wf: string) => path.join(dir, adapter().getFilePath(wf));
  const generated = (wf: string) =>
    generateCommand(getCommandContents([wf])[0], adapter()).fileContent;

  async function write(wf: string, content: string) {
    await fs.mkdir(path.dirname(target(wf)), { recursive: true });
    await fs.writeFile(target(wf), content);
  }
  const exists = (p: string) => fs.lstat(p).then(() => true, () => false);

  beforeEach(async () => {
    dir = await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-cmdrm-'));
  });
  afterEach(async () => {
    await fs.rm(dir, { recursive: true, force: true });
  });

  it('keeps a command file the user edited and reports it', async () => {
    await write('explore', generated('explore') + '\nOur team step.\n');
    const result = await removeUneditedCommandFiles(dir, TOOL, ALL_WORKFLOWS);
    expect(result.removed).toBe(0);
    expect(result.kept).toEqual([{ path: adapter().getFilePath('explore'), reason: 'edited' }]);
    expect(await fs.readFile(target('explore'), 'utf-8')).toContain('Our team step.');
  });

  it('still deletes a command file that matches what OpenSpec generates', async () => {
    await write('explore', generated('explore'));
    const result = await removeUneditedCommandFiles(dir, TOOL, ALL_WORKFLOWS);
    expect(result).toEqual({ removed: 1, kept: [] });
    expect(await exists(target('explore'))).toBe(false);
  });

  it('treats a CRLF checkout of an unedited file as unedited', async () => {
    await write('explore', generated('explore').replace(/\n/g, '\r\n'));
    const result = await removeUneditedCommandFiles(dir, TOOL, ALL_WORKFLOWS);
    expect(result.removed).toBe(1);
    expect(await exists(target('explore'))).toBe(false);
  });

  it('keeps a symlinked command file and does not follow it', async (ctx) => {
    const real = path.join(dir, 'real.md');
    await fs.writeFile(real, generated('explore'));
    await fs.mkdir(path.dirname(target('explore')), { recursive: true });
    try {
      await fs.symlink(real, target('explore'), 'file');
    } catch {
      // symlinks need privileges on some Windows setups: report skipped, not a silent pass
      ctx.skip();
    }
    const result = await removeUneditedCommandFiles(dir, TOOL, ALL_WORKFLOWS);
    expect(result.removed).toBe(0);
    expect(result.kept[0].reason).toBe('symlink');
    expect(await exists(target('explore'))).toBe(true);
    expect(await exists(real)).toBe(true);
  });

  it('removes unedited files and keeps edited ones in the same pass', async () => {
    await write('explore', generated('explore'));
    await write('propose', generated('propose') + '\nlocal\n');
    const result = await removeUneditedCommandFiles(dir, TOOL, ALL_WORKFLOWS);
    expect(result.removed).toBe(1);
    expect(result.kept.map((k) => k.reason)).toEqual(['edited']);
  });

  it('keeps a file that changes between the comparison and the delete (TOCTOU)', async () => {
    await write('explore', generated('explore'));
    const realRead = nodeFs.readFileSync;
    const spy = vi.spyOn(nodeFs, 'readFileSync').mockImplementation(((...args: Parameters<typeof realRead>) => {
      const data = realRead(...args);
      spy.mockRestore();
      syncBuiltinESMExports();
      // The user saves an edit right after we read the unedited content.
      nodeFs.writeFileSync(target('explore'), 'user rewrote this after we read it, with a different size');
      return data;
    }) as typeof realRead);
    syncBuiltinESMExports();
    try {
      const result = await removeUneditedCommandFiles(dir, TOOL, ALL_WORKFLOWS);
      expect(result.removed).toBe(0);
      expect(result.kept).toEqual([{ path: adapter().getFilePath('explore'), reason: 'edited' }]);
      expect(await fs.readFile(target('explore'), 'utf-8')).toContain('user rewrote this');
    } finally {
      spy.mockRestore();
      syncBuiltinESMExports();
    }
  });

  describe('paths that escape the project', () => {
    function useAdapterPaths(paths: Record<string, string>) {
      const real = adapter();
      return vi.spyOn(CommandAdapterRegistry, 'get').mockReturnValue({
        ...real,
        toolId: real.toolId,
        getFilePath: (id: string) => paths[id] ?? real.getFilePath(id),
        formatFile: real.formatFile.bind(real),
      });
    }

    afterEach(() => {
      vi.restoreAllMocks();
    });

    it('keeps a parent-directory escape as outside-project and still handles the rest', async () => {
      const outside = path.join(path.dirname(dir), `${path.basename(dir)}-outside.md`);
      await fs.writeFile(outside, generated('explore'));
      try {
        useAdapterPaths({ explore: `..${path.sep}${path.basename(outside)}` });
        await write('propose', generated('propose'));
        const result = await removeUneditedCommandFiles(dir, TOOL, ALL_WORKFLOWS);
        expect(result.kept).toEqual([
          { path: `..${path.sep}${path.basename(outside)}`, reason: 'outside-project' },
        ]);
        expect(result.removed).toBe(1);
        expect(await exists(outside)).toBe(true);
        expect(await exists(target('propose'))).toBe(false);
      } finally {
        await fs.rm(outside, { force: true });
      }
    });

    it('keeps an absolute path as outside-project without aborting the batch', async () => {
      const outside = path.join(os.tmpdir(), `openspec-cmdrm-abs-${process.pid}.md`);
      await fs.writeFile(outside, generated('explore'));
      try {
        useAdapterPaths({ explore: outside });
        await write('propose', generated('propose'));
        const result = await removeUneditedCommandFiles(dir, TOOL, ALL_WORKFLOWS);
        expect(result.kept).toEqual([{ path: outside, reason: 'outside-project' }]);
        expect(result.removed).toBe(1);
        expect(await exists(outside)).toBe(true);
      } finally {
        await fs.rm(outside, { force: true });
      }
    });
  });

  it('treats a UTF-8 BOM on an otherwise unedited file as unedited', async () => {
    await write('explore', '﻿' + generated('explore'));
    const result = await removeUneditedCommandFiles(dir, TOOL, ALL_WORKFLOWS);
    expect(result).toEqual({ removed: 1, kept: [] });
    expect(await exists(target('explore'))).toBe(false);
  });

  it('keeps a directory sitting where a command file should be (EISDIR) without throwing', async () => {
    await fs.mkdir(target('explore'), { recursive: true });
    const result = await removeUneditedCommandFiles(dir, TOOL, ALL_WORKFLOWS);
    expect(result.removed).toBe(0);
    expect(result.kept).toEqual([{ path: adapter().getFilePath('explore'), reason: 'unverifiable' }]);
    expect(await exists(target('explore'))).toBe(true);
  });

  describe('manifest of generated command files', () => {
    const rel = (wf: string) => adapter().getFilePath(wf);
    const manifestFile = () => path.join(dir, COMMAND_MANIFEST_PATH);

    beforeEach(async () => {
      await fs.mkdir(path.join(dir, 'openspec'), { recursive: true });
    });

    it('removes an unedited file written by an older template once its hash is recorded', async () => {
      const oldOutput = '---\nold template\n---\nbody from a previous OpenSpec version\n';
      await write('explore', oldOutput);
      await recordGeneratedCommandFiles(dir, [{ path: rel('explore'), fileContent: oldOutput }]);
      expect(oldOutput).not.toBe(generated('explore'));

      const result = await removeUneditedCommandFiles(dir, TOOL, ALL_WORKFLOWS);
      expect(result).toEqual({ removed: 1, kept: [] });
      expect(await exists(target('explore'))).toBe(false);
    });

    it('drops the manifest entry of a removed file', async () => {
      const oldOutput = 'old output\n';
      await write('explore', oldOutput);
      await recordGeneratedCommandFiles(dir, [{ path: rel('explore'), fileContent: oldOutput }]);
      await removeUneditedCommandFiles(dir, TOOL, ALL_WORKFLOWS);
      const manifest = JSON.parse(await fs.readFile(manifestFile(), 'utf-8'));
      expect(Object.keys(manifest.files)).not.toContain(rel('explore').split(path.sep).join('/'));
    });

    it('keeps a recorded file the user edited afterwards', async () => {
      const oldOutput = 'old output\n';
      await recordGeneratedCommandFiles(dir, [{ path: rel('explore'), fileContent: oldOutput }]);
      await write('explore', oldOutput + 'my team step\n');
      const result = await removeUneditedCommandFiles(dir, TOOL, ALL_WORKFLOWS);
      expect(result.removed).toBe(0);
      expect(result.kept).toEqual([{ path: rel('explore'), reason: 'edited' }]);
    });

    it('recognises a recorded file after a CRLF checkout', async () => {
      const oldOutput = 'line one\nline two\n';
      await recordGeneratedCommandFiles(dir, [{ path: rel('explore'), fileContent: oldOutput }]);
      await write('explore', oldOutput.replace(/\n/g, '\r\n'));
      const result = await removeUneditedCommandFiles(dir, TOOL, ALL_WORKFLOWS);
      expect(result.removed).toBe(1);
    });

    it('keeps an old file with no manifest record', async () => {
      await write('explore', 'written by an OpenSpec that kept no manifest\n');
      const result = await removeUneditedCommandFiles(dir, TOOL, ALL_WORKFLOWS);
      expect(result.removed).toBe(0);
      expect(result.kept).toHaveLength(1);
    });

    it('survives a corrupt manifest by falling back to the current-template comparison', async () => {
      await fs.writeFile(manifestFile(), '{ not json');
      await write('explore', generated('explore'));
      const result = await removeUneditedCommandFiles(dir, TOOL, ALL_WORKFLOWS);
      expect(result.removed).toBe(1);
    });

    it('does not create the manifest when the project has no openspec directory', async () => {
      await fs.rm(path.join(dir, 'openspec'), { recursive: true, force: true });
      await recordGeneratedCommandFiles(dir, [{ path: rel('explore'), fileContent: 'x' }]);
      expect(await exists(manifestFile())).toBe(false);
    });

    it('overwrites the recorded hash when a file is regenerated', async () => {
      await recordGeneratedCommandFiles(dir, [{ path: rel('explore'), fileContent: 'v1\n' }]);
      await recordGeneratedCommandFiles(dir, [{ path: rel('explore'), fileContent: 'v2\n' }]);
      await write('explore', 'v1\n');
      const result = await removeUneditedCommandFiles(dir, TOOL, ALL_WORKFLOWS);
      expect(result.removed).toBe(0);
    });
  });

  describe('formatKeptCommandWarning', () => {
    it('does not claim OpenSpec did not generate a file it cannot judge', () => {
      const text = formatKeptCommandWarning([{ path: '.claude/commands/opsx/explore.md', reason: 'edited' }]);
      expect(text).not.toMatch(/did not generate/i);
      expect(text).toMatch(/cannot confirm/i);
      expect(text).toContain('.claude/commands/opsx/explore.md (edited)');
    });
  });
});
