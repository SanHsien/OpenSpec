import * as fs from 'node:fs';
import * as path from 'node:path';
import { Glob, globSync } from 'glob';
import { FileSystemUtils } from '../../utils/file-system.js';

const MAX_BRACE_NESTING = 16;
const MAX_BRACE_EXPANSIONS = 10_000;

function assertBraceNesting(pattern: string): void {
  let depth = 0;
  for (const char of pattern) {
    if (char === '{') depth += 1;
    else if (char === '}' && depth > 0) depth -= 1;
    if (depth > MAX_BRACE_NESTING) {
      throw new Error(
        `Artifact output pattern nests braces more than ${MAX_BRACE_NESTING} levels deep: ${pattern}`
      );
    }
  }
}

/**
 * Checks if a path contains glob pattern characters.
 */
export function isGlobPattern(pattern: string): boolean {
  const normalized = FileSystemUtils.toPosixPath(pattern);
  return normalized.includes('*') || normalized.includes('?') || normalized.includes('[');
}

/**
 * Returns whether an artifact generates files under the change's specs/ tree.
 */
export function isSpecsArtifactPath(generates: string): boolean {
  const normalized = path.posix.normalize(FileSystemUtils.toPosixPath(generates));
  return normalized.startsWith('specs/');
}

export function resolveArtifactOutputPath(changeDir: string, generates: string): string {
  const outputPath = path.join(changeDir, generates);
  FileSystemUtils.assertPathWithin(changeDir, outputPath);
  return outputPath;
}

function assertGlobDirectoryTraversal(
  changeDir: string,
  currentDir: string,
  directorySegments: string[],
  segmentIndex = 0,
  visited = new Set<string>(),
  canonicalChangeDir = FileSystemUtils.canonicalizeExistingPath(changeDir),
  ancestors = new Set<string>()
): void {
  if (segmentIndex >= directorySegments.length) return;
  const canonicalDir = FileSystemUtils.canonicalizeExistingPath(currentDir);
  FileSystemUtils.assertPathWithin(canonicalChangeDir, canonicalDir);
  const visitKey = `${canonicalDir}\0${segmentIndex}`;
  if (ancestors.has(visitKey)) {
    throw new Error(`Cannot resolve artifact outputs through a linked directory cycle: ${currentDir}`);
  }
  if (visited.has(visitKey)) return;
  visited.add(visitKey);
  ancestors.add(visitKey);

  try {
    const segment = directorySegments[segmentIndex];
    if (segment === '**') {
      // `**` may consume no directory at all.
      assertGlobDirectoryTraversal(
        changeDir,
        canonicalDir,
        directorySegments,
        segmentIndex + 1,
        visited,
        canonicalChangeDir,
        ancestors
      );
    }

    const matches = globSync(segment === '**' ? '*' : segment, {
      cwd: canonicalDir,
      nodir: false,
      follow: false,
      maxDepth: 1,
      nobrace: true,
    });
    for (const match of matches) {
      const candidate = path.join(canonicalDir, match);
      try {
        if (!fs.statSync(candidate).isDirectory()) continue;
      } catch (error) {
        if ((error as NodeJS.ErrnoException).code === 'ENOENT') continue;
        throw error;
      }
      const canonicalCandidate = FileSystemUtils.canonicalizeExistingPath(candidate);
      FileSystemUtils.assertPathWithin(canonicalChangeDir, canonicalCandidate);
      assertGlobDirectoryTraversal(
        changeDir,
        canonicalCandidate,
        directorySegments,
        segment === '**' ? segmentIndex : segmentIndex + 1,
        visited,
        canonicalChangeDir,
        ancestors
      );
    }
  } finally {
    ancestors.delete(visitKey);
  }
}

/**
 * Resolves an artifact's output path(s) to concrete files that currently exist.
 * Returns absolute file paths. Glob matches are sorted for deterministic output.
 */
export function resolveArtifactOutputs(changeDir: string, generates: string): string[] {
  const isGlob = isGlobPattern(generates);
  if (isGlob) assertBraceNesting(FileSystemUtils.toPosixPath(generates));
  const outputPath = resolveArtifactOutputPath(changeDir, generates);

  if (!isGlob) {
    try {
      return fs.statSync(outputPath).isFile()
        ? [FileSystemUtils.canonicalizeExistingPath(outputPath)]
        : [];
    } catch {
      return [];
    }
  }

  const normalizedPattern = FileSystemUtils.toPosixPath(generates);
  // Glob optimizes away literal `dir/..` components. Encode separators during
  // brace expansion so every unoptimized alternative can be validated first.
  // A prefixed single component also prevents Windows root/drive interpretation.
  const separator = '\u0001';
  if (normalizedPattern.includes(separator)) {
    throw new Error('Artifact output pattern contains an unsupported control character');
  }
  const prefix = 'artifact:';
  const expansion = new Glob(prefix + normalizedPattern.replaceAll('/', separator), {
    cwd: changeDir,
    braceExpandMax: MAX_BRACE_EXPANSIONS + 1,
  });
  // The library truncates at its cap instead of throwing. Request one extra
  // alternative to detect overflow rather than silently omitting unsafe branches.
  if (expansion.patterns.length > MAX_BRACE_EXPANSIONS) {
    throw new Error(`Artifact output pattern expands beyond ${MAX_BRACE_EXPANSIONS} alternatives`);
  }
  const alternatives = expansion.patterns.map((pattern) =>
    pattern.globString().slice(prefix.length).replaceAll(separator, '/')
  );
  // Validate ALL lexical alternatives before any directory matching or traversal.
  for (const alternative of alternatives) {
    if (path.posix.isAbsolute(alternative) || path.win32.isAbsolute(alternative)
      || alternative.split('/').includes('..')) {
      throw new Error(`Artifact output pattern must be relative without .. segments: ${alternative}`);
    }
    FileSystemUtils.assertPathWithin(changeDir, path.join(changeDir, alternative));
  }
  for (const alternative of alternatives) {
    const segments = alternative.split('/');
    // A terminal globstar also visits directories; it is not just a basename.
    const directorySegments = segments.at(-1) === '**' ? segments : segments.slice(0, -1);
    assertGlobDirectoryTraversal(changeDir, changeDir, directorySegments);
  }
  const matches = new Glob(alternatives, {
    cwd: changeDir,
    nodir: true,
    absolute: true,
    nobrace: true,
    // Every reachable directory was canonically confined before following links.
    follow: true,
  }).walkSync()
    .map((match) => {
      const normalizedMatch = path.normalize(match);
      FileSystemUtils.assertPathWithin(changeDir, normalizedMatch);
      return FileSystemUtils.canonicalizeExistingPath(normalizedMatch);
    });

  return Array.from(new Set(matches)).sort();
}

/**
 * Checks if an artifact has at least one resolved output file.
 */
export function artifactOutputExists(changeDir: string, generates: string): boolean {
  return resolveArtifactOutputs(changeDir, generates).length > 0;
}
