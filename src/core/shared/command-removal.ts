import * as fs from 'fs';
import { FileSystemUtils } from '../../utils/file-system.js';
import { CommandAdapterRegistry, generateCommand } from '../command-generation/index.js';
import { getCommandContents } from './skill-generation.js';

export interface CommandRemovalResult {
  removed: number;
  /** Project-relative paths that were left in place, with the reason. */
  kept: Array<{ path: string; reason: 'edited' | 'symlink' | 'unverifiable' | 'outside-project' }>;
}

function normalizeEol(text: string): string {
  return text.replace(/^﻿/, '').replace(/\r\n/g, '\n');
}

/**
 * Deletes a tool's command files for the given workflows, but only the ones
 * whose content still equals what OpenSpec would generate today (compared
 * after CRLF/LF and BOM normalization). Edited files, symlinks and files with
 * no current template to compare against are kept so no user edit is lost.
 */
export async function removeUneditedCommandFiles(
  projectPath: string,
  toolId: string,
  workflows: readonly string[]
): Promise<CommandRemovalResult> {
  const result: CommandRemovalResult = { removed: 0, kept: [] };
  const adapter = CommandAdapterRegistry.get(toolId);
  if (!adapter) return result;

  const contents = new Map(getCommandContents(workflows).map((c) => [c.id, c]));

  for (const workflow of workflows) {
    const relPath = adapter.getFilePath(workflow);
    // A path that escapes the project must not abort the rest of the batch.
    let fullPath: string;
    try {
      fullPath = FileSystemUtils.resolveProjectArtifactPath(projectPath, relPath);
    } catch (error) {
      const isFsError = typeof (error as NodeJS.ErrnoException).code === 'string';
      result.kept.push({ path: relPath, reason: isFsError ? 'unverifiable' : 'outside-project' });
      continue;
    }

    let stat: fs.Stats;
    try {
      stat = fs.lstatSync(fullPath);
    } catch {
      continue; // nothing there
    }

    if (stat.isSymbolicLink()) {
      result.kept.push({ path: relPath, reason: 'symlink' });
      continue;
    }

    const content = contents.get(workflow);
    if (!content) {
      result.kept.push({ path: relPath, reason: 'unverifiable' });
      continue;
    }

    try {
      const onDisk = fs.readFileSync(fullPath, 'utf-8');
      const expected = generateCommand(content, adapter).fileContent;
      if (normalizeEol(onDisk) !== normalizeEol(expected)) {
        result.kept.push({ path: relPath, reason: 'edited' });
        continue;
      }
      // The user may save an edit between the read above and the delete. Re-stat
      // right before unlinking and keep the file if it is no longer the one we
      // compared (size/mtime moved, or it became a symlink).
      const latest = fs.lstatSync(fullPath);
      if (latest.isSymbolicLink() || latest.size !== stat.size || latest.mtimeMs !== stat.mtimeMs) {
        result.kept.push({ path: relPath, reason: 'edited' });
        continue;
      }
      await fs.promises.unlink(fullPath);
      result.removed++;
    } catch {
      result.kept.push({ path: relPath, reason: 'unverifiable' });
    }
  }

  return result;
}

export function formatKeptCommandWarning(kept: CommandRemovalResult['kept']): string {
  const lines = kept.map((k) => `  ${k.path} (${k.reason})`);
  return `Kept ${kept.length} command file(s) that OpenSpec did not generate or that you changed; delete them yourself if unwanted:\n${lines.join('\n')}`;
}
