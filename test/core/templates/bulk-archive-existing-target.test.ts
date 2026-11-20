import { describe, expect, it } from 'vitest';

import {
  getBulkArchiveChangeSkillTemplate,
  getOpsxBulkArchiveCommandTemplate,
} from '../../../src/core/templates/skill-templates.js';

// Same defect class as upstream #2276 (fixed for archive by #2277): a bulk
// archive must find an existing archive target before it writes any main spec
// for that change, not after the sync when only the move can fail.
const bodies: Array<[string, string]> = [
  ['skill', getBulkArchiveChangeSkillTemplate().instructions],
  ['command', getOpsxBulkArchiveCommandTemplate().content],
];

function section(body: string, start: string, end: string): string {
  const from = body.indexOf(start);
  const to = body.indexOf(end, from);
  expect(from).toBeGreaterThanOrEqual(0);
  expect(to).toBeGreaterThan(from);
  return body.slice(from, to);
}

describe('bulk-archive target check (same class as upstream #2276)', () => {
  it('finds an existing archive target before any main spec of that change is synced', () => {
    for (const [label, body] of bodies) {
      const step = section(body, '8. **Execute archive for each confirmed change**', '9. **Display summary**');
      const check = step.indexOf('**Check every archive target first:**');
      const stop = step.indexOf('already exists, do not sync any of its delta specs');
      const sync = step.indexOf('a. **Sync included delta specs**');
      const recheck = step.indexOf("Check that change's archive target again");
      // skill names the sync skill, command names /opsx:sync
      const runSync = step.search(/Run the `(openspec-sync-specs|\/opsx:sync)` workflow inline/);

      expect(check, label).toBeGreaterThanOrEqual(0);
      expect(stop, label).toBeGreaterThan(check);
      expect(stop, label).toBeLessThan(sync);
      expect(recheck, label).toBeGreaterThan(sync);
      expect(recheck, label).toBeLessThan(runSync);
    }
  });

  it('moves to the recorded target only after checking it again', () => {
    for (const [label, body] of bodies) {
      const step = section(body, 'c. **Perform the archive**', 'd. **Track outcome**');
      const reuse = step.indexOf('Use the `<target-name>` recorded before step 8a');
      const recheck = step.indexOf('**Check again immediately before the move:**');
      const move = step.indexOf('mv "<changeRoot>"');

      expect(reuse, label).toBeGreaterThanOrEqual(0);
      expect(recheck, label).toBeGreaterThan(reuse);
      expect(move, label).toBeGreaterThan(recheck);
      expect(step, label).toContain('report any main specs step 8a synced for it');
      expect(step, label).not.toMatch(/^\s*Target name: use the change name/m);
    }
  });

  it('says in the guardrails that a taken target fails the change before its specs are synced', () => {
    for (const [label, body] of bodies) {
      expect(body, label).toContain(
        'If an archive target exists, fail that change before syncing any of its specs and continue with others'
      );
      expect(body, label).not.toContain('If archive target exists, fail that change but continue with others');
    }
  });
});
