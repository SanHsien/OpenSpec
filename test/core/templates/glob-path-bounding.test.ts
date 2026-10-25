// Every workflow that turns a glob output into a concrete write path must keep
// that path inside `changeRoot` (upstream #2099). propose, ff-change, continue
// and explore chose a path with no containment rule, so a capability path such
// as `../../x`, or a symlinked directory under `specs/`, would be written
// outside the change. update-change never creates files under a glob here, so
// it is not a write surface in this fork.

import { describe, expect, it } from 'vitest';

import {
  getContinueChangeSkillTemplate,
  getExploreSkillTemplate,
  getFfChangeSkillTemplate,
  getOpsxContinueCommandTemplate,
  getOpsxExploreCommandTemplate,
  getOpsxFfCommandTemplate,
  getOpsxProposeCommandTemplate,
  getOpsxProposeSkillTemplate,
} from '../../../src/core/templates/skill-templates.js';

/** Lines that tell the agent to pick a concrete path for a glob output. */
const PATH_CHOICE = /choose a concrete path/i;

/**
 * The containment rule for a write that may land on an existing file. A
 * destination that is itself a symlink to a file outside `changeRoot` passes a
 * parent-only check, so the file is resolved too.
 */
const BOUND =
  'remains inside `changeRoot` after resolving symlinks, both in its parent directories and in the file itself if it already exists';

/** Every surface that writes glob artifacts, skill and slash-command alike. */
const SURFACES: Array<[label: string, body: string]> = [
  ['propose skill', getOpsxProposeSkillTemplate().instructions],
  ['propose command', getOpsxProposeCommandTemplate().content],
  ['ff-change skill', getFfChangeSkillTemplate().instructions],
  ['ff-change command', getOpsxFfCommandTemplate().content],
  ['continue-change skill', getContinueChangeSkillTemplate().instructions],
  ['continue-change command', getOpsxContinueCommandTemplate().content],
  ['explore skill', getExploreSkillTemplate().instructions],
  ['explore command', getOpsxExploreCommandTemplate().content],
];

const linesOf = (body: string) => body.split(/\r?\n/);

/** Where a line tells the agent to write. The bound must come before it. */
const WRITE = /\b(?:write|Write)\b/;

/**
 * The bound has to be checked before the write, or an escaping path is already
 * written by the time it is verified.
 */
function expectBoundBeforeWrite(label: string, line: string): void {
  const boundAt = line.indexOf(BOUND);
  expect(boundAt, label).toBeGreaterThanOrEqual(0);
  const writeAt = line.search(WRITE);
  if (writeAt !== -1) {
    expect(writeAt, `${label}: writes before checking the bound`).toBeGreaterThan(boundAt);
  }
  expect(line, `${label}: no instruction to refuse an escaping path`).toContain(
    'stop and tell the user'
  );
}

/**
 * A delegated writer is a write too. It may run only after the path it writes
 * to has been chosen and checked, and only if it can write exactly there.
 * Returns each delegation as [offset, the sentence that states it].
 */
function delegations(body: string): Array<[number, string]> {
  return [...body.matchAll(/delegates creation/g)].map((match) => {
    const start = match.index ?? 0;
    const end = body.slice(start).search(/[.\r\n]/);
    return [start, body.slice(start, end === -1 ? undefined : start + end)];
  });
}

describe('glob output paths stay inside changeRoot', () => {
  it.each(SURFACES)('%s bounds every concrete-path choice', (label, body) => {
    const choices = linesOf(body).filter((line) => PATH_CHOICE.test(line));

    expect(choices, `${label}: no concrete-path line found`).toHaveLength(1);
    expectBoundBeforeWrite(label, choices[0]);
  });

  it.each(SURFACES)('%s chooses and checks the path before any delegated writer runs', (label, body) => {
    const choiceAt = body.search(PATH_CHOICE);
    const found = delegations(body);
    expect(found.length, `${label}: no delegated-creation rule found`).toBeGreaterThan(0);

    for (const [at, sentence] of found) {
      // Bound to one path, and refuses rather than letting it write elsewhere.
      expect(sentence, label).toMatch(/only if it can/);
      expect(sentence, label).toMatch(/stop/);
      expect(at, `${label}: delegates before choosing the path`).toBeGreaterThan(choiceAt);
    }
  });

  // A delegated writer has already created the artifact; writing the template
  // over it afterwards would replace what it made.
  it.each(SURFACES)('%s writes the template only when creation was not delegated', (label, body) => {
    const templateWrite = /\b[Ww]rite (?:it|the file|the artifact) to that output path/u;
    const lines = linesOf(body);
    let writes = 0;
    lines.forEach((line, index) => {
      // Judged sentence by sentence: explore states both branches in one
      // paragraph, and the delegation sentence names the same path for the
      // delegated writer.
      for (const sentence of line.split(/(?<=\.)\s+(?=[A-Z])/u)) {
        if (!templateWrite.test(sentence) || /only if it can write/.test(sentence)) continue;
        writes++;
        // Either the sentence itself says "Otherwise ..." before the write, or
        // the write is nested under a bullet that opens the Otherwise branch.
        if (/otherwise/i.test(sentence.slice(0, sentence.search(templateWrite)))) continue;
        const indent = line.search(/\S/u);
        const parent = lines
          .slice(0, index)
          .reverse()
          .find((candidate) => candidate.trim() !== '' && candidate.search(/\S/u) < indent);
        expect(parent, `${label}: template write outside the Otherwise branch`).toMatch(/^\s*- Otherwise/u);
      }
    });
    expect(writes, `${label}: no template write found`).toBeGreaterThan(0);
  });

  it.each([
    ['continue-change skill', getContinueChangeSkillTemplate().instructions],
    ['continue-change command', getOpsxContinueCommandTemplate().content],
  ])('%s verifies the output after either creation branch', (label, body) => {
    const lines = linesOf(body);
    const delegation = lines.findIndex((line) => line.includes('delegates creation to a specific skill'));
    const verify = lines.findIndex((line) =>
      line.includes('Either way, verify the artifact file exists at that output path')
    );
    expect(delegation, label).toBeGreaterThanOrEqual(0);
    expect(verify, label).toBeGreaterThan(delegation);
    // Same depth as the two branches, so it runs after whichever was taken.
    expect(lines[verify].search(/\S/u), label).toBe(lines[delegation].search(/\S/u));
  });

  it.each(SURFACES)('%s never targets the glob itself', (label, body) => {
    // A glob is a pattern, not a file: nothing may be written to, or verified
    // at, `resolvedOutputPath` unless it is a concrete path.
    expect(body, label).not.toContain('exists at `resolvedOutputPath`');
    expect(body, label).not.toContain('write it to `resolvedOutputPath`');
    expect(body, label).not.toContain('write the artifact to `resolvedOutputPath`');
    expect(body, label).not.toContain('Write to the `resolvedOutputPath`');
  });

  it.each(SURFACES)('%s restates delegation only with the same bound', (label, body) => {
    // The artifact-creation guidelines repeat the delegation rule where agents
    // skim; a bare "invoke it instead" there would undo the ordering above.
    const restated = linesOf(body).filter((candidate) =>
      candidate.includes('directs you to use a specific skill or command')
    );
    for (const line of restated) {
      expect(line, label).toContain('only once you have chosen and checked the output path');
    }
  });
});
