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

describe('delta spec capability shape (#2173)', () => {
  const workflows = [
    {
      name: 'sync',
      bodies: [
        ['skill', getSyncSpecsSkillTemplate().instructions],
        ['command', getOpsxSyncCommandTemplate().content],
      ],
      stopPhrase: 'stop before writing any main spec',
    },
    {
      name: 'archive',
      bodies: [
        ['skill', getArchiveChangeSkillTemplate().instructions],
        ['command', getOpsxArchiveCommandTemplate().content],
      ],
      stopPhrase: 'stop without syncing or archiving',
    },
    {
      name: 'bulk-archive',
      bodies: [
        ['skill', getBulkArchiveChangeSkillTemplate().instructions],
        ['command', getOpsxBulkArchiveCommandTemplate().content],
      ],
      stopPhrase: 'Delta outside a capability spec.md',
    },
  ];

  for (const { name, bodies, stopPhrase } of workflows) {
    describe(name, () => {
      for (const [surface, body] of bodies) {
        it(`${surface} restricts delta specs to capability spec.md`, () => {
          expect(body).toContain('specs/<capability-path>/spec.md');
        });

        it(`${surface} stops on stray files with delta sections`, () => {
          expect(body).toContain(stopPhrase);
          expect(body).toContain("report the offending file's path");
        });

        it(`${surface} leaves non-delta notes out of the sync without stopping`, () => {
          expect(body).toMatch(/Entries without those sections are notes|leave them out of the sync/);
        });
      }
    });
  }
});
