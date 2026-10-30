import { describe, it, expect } from 'vitest';
import {
  getSyncSpecsSkillTemplate,
  getOpsxSyncCommandTemplate,
} from '../../../src/core/templates/workflows/sync-specs.js';
import {
  getArchiveChangeSkillTemplate,
  getOpsxArchiveCommandTemplate,
} from '../../../src/core/templates/workflows/archive-change.js';
import {
  getBulkArchiveChangeSkillTemplate,
  getOpsxBulkArchiveCommandTemplate,
} from '../../../src/core/templates/workflows/bulk-archive-change.js';

describe('containment check before every main-spec write (#2164)', () => {
  it('checks containment before reading, creating, or updating in sync', () => {
    const sync = getSyncSpecsSkillTemplate().instructions;
    expect(sync).toContain('**Check containment first, before any read, create, or update.**');
    expect(sync).toContain('every existing parent directory up to');
    expect(sync).toContain('do not read, create, or modify it');
    expect(sync).toContain('Never create a missing directory under a parent');
  });

  it('checks containment in guardrails across all sync and archive variants', () => {
    const templates = [
      getSyncSpecsSkillTemplate().instructions,
      getOpsxSyncCommandTemplate().content,
      getArchiveChangeSkillTemplate().instructions,
      getOpsxArchiveCommandTemplate().content,
      getBulkArchiveChangeSkillTemplate().instructions,
      getOpsxBulkArchiveCommandTemplate().content,
    ];
    for (const text of templates) {
      expect(text).toContain(
        'Write, create, or delete a main spec only where it and every parent resolve inside the real `<planningHome.root>/openspec/specs/` root; never follow a symlink'
      );
    }
  });
});

describe('custom delta-spec artifact id (#2163)', () => {
  const templates = [
    getSyncSpecsSkillTemplate().instructions,
    getOpsxSyncCommandTemplate().content,
    getArchiveChangeSkillTemplate().instructions,
    getOpsxArchiveCommandTemplate().content,
    getBulkArchiveChangeSkillTemplate().instructions,
    getOpsxBulkArchiveCommandTemplate().content,
  ];

  it('does not hardcode artifactPaths.specs or openspec instructions specs', () => {
    for (const text of templates) {
      expect(text).not.toContain('artifactPaths.specs');
      expect(text).not.toContain('openspec instructions specs');
    }
  });

  it('disallows operation instructions (apply, archive) as artifact rules', () => {
    for (const text of templates) {
      expect(text).toContain('The ids `apply` and `archive` cannot be looked up this way');
    }
  });
});
