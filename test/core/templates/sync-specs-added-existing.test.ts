import { describe, expect, it } from 'vitest';

import {
  getOpsxSyncCommandTemplate,
  getSyncSpecsSkillTemplate,
} from '../../../src/core/templates/skill-templates.js';

const bodies: Array<[string, string]> = [
  ['skill', getSyncSpecsSkillTemplate().instructions],
  ['command', getOpsxSyncCommandTemplate().content],
];

function addedRules(body: string): string {
  const start = body.indexOf('**ADDED Requirements:**');
  const end = body.indexOf('**MODIFIED Requirements:**', start);
  expect(start).toBeGreaterThanOrEqual(0);
  expect(end).toBeGreaterThan(start);
  return body.slice(start, end);
}

// Upstream issue #2289: the sync skill told the agent to overwrite an ADDED
// requirement that already exists, while the CLI (specs-apply.ts) skips an
// identical one and refuses a differing one. Re-syncing an early-synced
// change would silently revert a later change's edits.
describe('sync-specs ADDED rule matches the CLI (upstream issue #2289)', () => {
  it('never tells the agent to overwrite an existing requirement from an ADDED block', () => {
    for (const [label, body] of bodies) {
      const rules = addedRules(body);
      expect(rules, label).not.toContain('update it to match');
      expect(rules, label).not.toContain('implicit MODIFIED');
    }
  });

  it('treats identical content as a no-op and differing content as a conflict to report', () => {
    for (const [label, body] of bodies) {
      const rules = addedRules(body);
      expect(rules, label).toContain('identical content → leave it unchanged');
      expect(rules, label).toContain('different content → do not overwrite');
      expect(rules, label).toContain('report the conflict');
    }
  });
});
