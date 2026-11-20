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

type KeptReason = CommandRemovalResult['kept'][number]['reason'];

type CommandFileVerdict =
  | { kind: 'absent' }
  | { kind: 'kept'; relPath: string; reason: KeptReason }
  | { kind: 'removable'; relPath: string; fullPath: string; stat: fs.Stats; key: string };

/**
 * Decides, without touching the file, whether a tool's command file for one
 * workflow is one OpenSpec may delete: it must still equal today's output
 * (after CRLF/LF and BOM normalization) or the hash recorded when OpenSpec
 * wrote it. Everything else is kept with a reason. Removal and drift detection
 * share this so a file kept on purpose is never reported as drift.
 */
function classifyCommandFile(
  projectPath: string,
  toolId: string,
  workflow: string,
  manifest: CommandManifest
): CommandFileVerdict {
  const adapter = CommandAdapterRegistry.get(toolId);
  if (!adapter) return { kind: 'absent' };
  const relPath = adapter.getFilePath(workflow);
  // A path that escapes the project must not abort the rest of the batch.
  let fullPath: string;
  try {
    fullPath = FileSystemUtils.resolveProjectArtifactPath(projectPath, relPath);
  } catch (error) {
    const isFsError = typeof (error as NodeJS.ErrnoException).code === 'string';
    return { kind: 'kept', relPath, reason: isFsError ? 'unverifiable' : 'outside-project' };
  }

  let stat: fs.Stats;
  try {
    stat = fs.lstatSync(fullPath);
  } catch {
    return { kind: 'absent' };
  }

  if (stat.isSymbolicLink()) return { kind: 'kept', relPath, reason: 'symlink' };

  const content = getCommandContents([workflow])[0];
  if (!content) return { kind: 'kept', relPath, reason: 'unverifiable' };

  try {
    const onDisk = fs.readFileSync(fullPath, 'utf-8');
    const expected = generateCommand(content, adapter).fileContent;
    const key = manifestKey(relPath);
    const matchesToday = normalizeEol(onDisk) === normalizeEol(expected);
    const matchesRecorded = manifest.files[key] === hashContent(onDisk);
    if (!matchesToday && !matchesRecorded) return { kind: 'kept', relPath, reason: 'edited' };
    return { kind: 'removable', relPath, fullPath, stat, key };
  } catch {
    return { kind: 'kept', relPath, reason: 'unverifiable' };
  }
}

/**
 * True when the tool's command file for this workflow exists and removal
 * would delete it. A file removal would keep (edited, symlink, unverifiable,
 * outside the project) returns false: it stays by design, so it is not drift.
 */
export function isRemovableCommandFile(projectPath: string, toolId: string, workflow: string): boolean {
  return classifyCommandFile(projectPath, toolId, workflow, readManifest(projectPath)).kind === 'removable';
}

/**
 * Deletes a tool's command files for the given workflows, but only the ones
 * whose content still equals what OpenSpec would generate today (compared
 * after CRLF/LF and BOM normalization) or the hash recorded when OpenSpec wrote
 * them. Edited files, symlinks and files with no current template to compare
 * against are kept so no user edit is lost.
 */
export async function removeUneditedCommandFiles(
  projectPath: string,
  toolId: string,
  workflows: readonly string[]
): Promise<CommandRemovalResult> {
  const result: CommandRemovalResult = { removed: 0, kept: [] };
  if (!CommandAdapterRegistry.get(toolId)) return result;

  const manifest = readManifest(projectPath);
  let manifestChanged = false;

  for (const workflow of workflows) {
    const verdict = classifyCommandFile(projectPath, toolId, workflow, manifest);
    if (verdict.kind === 'absent') continue;
    if (verdict.kind === 'kept') {
      result.kept.push({ path: verdict.relPath, reason: verdict.reason });
      continue;
    }
    const { relPath, fullPath, stat, key } = verdict;
    try {
      // The user may save an edit between the read above and the delete. That
      // window cannot be closed without an atomic compare-and-delete, so this
      // only narrows it: re-stat right before unlinking and keep the file if it
      // is no longer the one we compared (size/mtime moved, or it became a
      // symlink). An edit that keeps the size and lands within the filesystem's
      // mtime granularity, or lands between this check and the unlink, can
      // still be lost.
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
