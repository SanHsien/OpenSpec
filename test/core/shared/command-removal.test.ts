import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import path from 'path';
import nodeFs from 'node:fs';
import { syncBuiltinESMExports } from 'node:module';
import fs from 'fs/promises';
import os from 'os';
import { removeUneditedCommandFiles } from '../../../src/core/shared/command-removal.js';
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
});
