import { describe, it, expect } from 'vitest';
import {
  getApplyInstructions,
  getApplyChangeSkillTemplate,
  getOpsxApplyCommandTemplate,
} from '../../../src/core/templates/workflows/apply-change.js';

describe('apply instructions blocked artifact selection (#2165)', () => {
  const instructions = getApplyInstructions();

  it('lists missingPrerequisites in step 3 fields', () => {
    expect(instructions).toContain('`missingPrerequisites` (when present)');
  });

  it('limits choice to ready artifacts that unblock apply', () => {
    expect(instructions).toContain(
      'select a `ready` artifact (not `skipped` or `blocked`) that unblocks apply'
    );
    expect(instructions).toContain(
      'one listed in `missingPrerequisites` from the apply instructions JSON'
    );
    expect(instructions).toContain(
      'Never pick a `ready` artifact outside that set'
    );
  });

  it('stops and creates nothing if no ready artifact is in that set', () => {
    expect(instructions).toContain(
      'If no `ready` artifact is in that set, create nothing'
    );
    expect(instructions).toContain(
      'report `missingArtifacts` and the status of each of their prerequisites, and ask the user how to proceed'
    );
  });

  it('preserves store flag and fallback for older CLI', () => {
    expect(instructions).toContain('use `missingArtifacts` when it is absent');
    expect(instructions).toContain('Keep the selected `--store <id>` on both commands');
  });

  it('carries the same guidance on both the skill and command surfaces', () => {
    const needle = 'that unblocks apply';
    expect(getApplyChangeSkillTemplate().instructions).toContain(needle);
    expect(getOpsxApplyCommandTemplate().content).toContain(needle);
  });
});
