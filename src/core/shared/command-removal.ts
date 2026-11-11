import * as fs from 'fs';
import * as path from 'path';
import { createHash } from 'crypto';
import { OPENSPEC_DIR_NAME } from '../config.js';
import { FileSystemUtils } from '../../utils/file-system.js';
import { CommandAdapterRegistry, generateCommand } from '../command-generation/index.js';
import { getCommandContents } from './skill-generation.js';

export interface CommandRemovalResult {
  removed: number;
  /** Project-relative paths that were left in place, with the reason. */
  kept: Array<{ path: string; reason: 'edited' | 'symlink' | 'unverifiable' | 'outside-project' }>;
}

/**
 * Project-relative location of the manifest recording a SHA-256 for every
 * command file OpenSpec wrote. It lives in the project's `openspec/` state
 * directory so it travels with the repo and survives a template change: a file
 * an older OpenSpec wrote, never edited, no longer equals today's output but
 * still equals the hash recorded when it was written.
 */
export const COMMAND_MANIFEST_PATH = `${OPENSPEC_DIR_NAME}/.generated-commands.json`;

interface CommandManifest {
  version: 1;
  /** Project-relative path (forward slashes) to SHA-256 of the EOL/BOM-normalized content. */
  files: Record<string, string>;
}

function manifestKey(relPath: string): string {
  return relPath.replace(/[\\/]+/g, '/');
}

function hashContent(text: string): string {
  return createHash('sha256').update(normalizeEol(text)).digest('hex');
}

/** Reads the manifest; any problem (missing, unreadable, malformed) yields an empty one. */
function readManifest(projectPath: string): CommandManifest {
  const empty: CommandManifest = { version: 1, files: {} };
  try {
    const parsed = JSON.parse(fs.readFileSync(path.join(projectPath, COMMAND_MANIFEST_PATH), 'utf-8'));
    if (parsed && parsed.version === 1 && parsed.files && typeof parsed.files === 'object') {
      const files: Record<string, string> = {};
      for (const [key, value] of Object.entries(parsed.files)) {
        if (typeof value === 'string') files[key] = value;
      }
      return { version: 1, files };
    }
  } catch {
    // fall through
  }
  return empty;
}

function writeManifest(projectPath: string, manifest: CommandManifest): void {
  const sorted = Object.fromEntries(Object.entries(manifest.files).sort(([a], [b]) => (a < b ? -1 : 1)));
  fs.writeFileSync(
    path.join(projectPath, COMMAND_MANIFEST_PATH),
    JSON.stringify({ version: 1, files: sorted }, null, 2) + '\n'
  );
}

/**
 * Records the hash of each command file OpenSpec just wrote. Best effort: it
 * never throws (a missing manifest only means a later removal keeps the file),
 * and it does nothing in a directory that has no `openspec/` folder.
 */
export async function recordGeneratedCommandFiles(
  projectPath: string,
  files: ReadonlyArray<{ path: string; fileContent: string }>
): Promise<void> {
  try {
    if (files.length === 0) return;
    if (!fs.statSync(path.join(projectPath, OPENSPEC_DIR_NAME), { throwIfNoEntry: false })?.isDirectory()) return;
    const manifest = readManifest(projectPath);
    for (const file of files) {
      manifest.files[manifestKey(file.path)] = hashContent(file.fileContent);
    }
    writeManifest(projectPath, manifest);
  } catch {
    // best effort
  }
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

  const manifest = readManifest(projectPath);
  let manifestChanged = false;
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
      const key = manifestKey(relPath);
      const matchesToday = normalizeEol(onDisk) === normalizeEol(expected);
      const matchesRecorded = manifest.files[key] === hashContent(onDisk);
      if (!matchesToday && !matchesRecorded) {
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
      if (key in manifest.files) {
        delete manifest.files[key];
        manifestChanged = true;
      }
    } catch {
      result.kept.push({ path: relPath, reason: 'unverifiable' });
    }
  }

  if (manifestChanged) {
    try {
      writeManifest(projectPath, manifest);
    } catch {
      // a stale entry is harmless: the next removal pass re-checks the hash
    }
  }

  return result;
}

export function formatKeptCommandWarning(kept: CommandRemovalResult['kept']): string {
  const lines = kept.map((k) => `  ${k.path} (${k.reason})`);
  return `Kept ${kept.length} command file(s) because OpenSpec cannot confirm it generated them unchanged (you may have edited them, they may come from an older OpenSpec, or they sit outside the project); delete them yourself if unwanted:\n${lines.join('\n')}`;
}
