import { describe, it, expect } from 'vitest';
import { MarkdownParser } from '../../../src/core/parsers/markdown-parser.js';
import { extractRequirementsSection } from '../../../src/core/parsers/requirement-blocks.js';
import { findMainSpecStructureIssues } from '../../../src/core/parsers/spec-structure.js';

// CommonMark lets an ATX heading carry a closing run of `#`s preceded by a
// space or tab: `## Purpose ##` is the same heading as `## Purpose`. The
// section readers kept the run in the title, so `validate` rejected such a spec
// with "Spec must have a Purpose section" (upstream #2145).
const SPEC = (purpose: string, requirements: string) =>
  [
    '# Fees',
    '',
    purpose,
    'Late fee rules for overdue invoices.',
    '',
    requirements,
    '',
    '### Requirement: Late Fees',
    'The system SHALL charge late fees.',
    '',
    '#### Scenario: Overdue',
    '- **WHEN** an invoice is overdue',
    '- **THEN** a late fee is charged',
    '',
  ].join('\n');

describe('ATX heading closing sequence', () => {
  it('reads "## Purpose ##" like "## Purpose"', () => {
    const spec = new MarkdownParser(SPEC('## Purpose ##', '## Requirements')).parseSpec('fees');
    expect(spec.overview).toBe('Late fee rules for overdue invoices.');
    expect(spec.requirements).toHaveLength(1);
  });

  it('reads "## Requirements ##" like "## Requirements"', () => {
    const content = SPEC('## Purpose', '## Requirements ##');
    expect(new MarkdownParser(content).parseSpec('fees').requirements).toHaveLength(1);
    expect(extractRequirementsSection(content).bodyBlocks.map((block) => block.name)).toEqual(['Late Fees']);
  });

  it('accepts a single closing # and a tab before the run', () => {
    expect(() => new MarkdownParser(SPEC('## Purpose #', '## Requirements')).parseSpec('fees')).not.toThrow();
    expect(() => new MarkdownParser(SPEC('## Purpose\t##', '## Requirements')).parseSpec('fees')).not.toThrow();
  });

  it('reads "## Why ##" and "## What Changes ##" in a change proposal', () => {
    const proposal = [
      '## Why ##',
      'Late fees were never charged, which costs real money every month.',
      '',
      '## What Changes ##',
      '- **fees:** charge late fees',
      '',
    ].join('\n');
    const change = new MarkdownParser(proposal).parseChange('late-fees');
    expect(change.why).toContain('Late fees were never charged');
    expect(change.whatChanges).toContain('charge late fees');
  });

  it('sees a duplicate requirement under "## Requirements ##" in the structure check', () => {
    const content = [
      '# Fees',
      '',
      '## Requirements ##',
      '',
      '### Requirement: Late Fees',
      'The system SHALL charge late fees.',
      '',
      '### Requirement: Late Fees',
      'The system SHALL charge late fees again.',
      '',
    ].join('\n');
    expect(findMainSpecStructureIssues(content).map((issue) => issue.kind)).toEqual(['duplicate-requirement']);
  });

  it('keeps a "#" that is part of the title text', () => {
    const content = ['## Using C#', 'body', '', '## Using C# ##', 'body', ''].join('\n');
    const titles = (new MarkdownParser(content) as unknown as { parseSections(): Array<{ title: string }> })
      .parseSections()
      .map((section) => section.title);
    expect(titles).toEqual(['Using C#', 'Using C#']);
  });

  it('survives CRLF line endings', () => {
    const content = SPEC('## Purpose ##', '## Requirements ##').replace(/\n/g, '\r\n');
    expect(new MarkdownParser(content).parseSpec('fees').requirements).toHaveLength(1);
    expect(extractRequirementsSection(content).bodyBlocks).toHaveLength(1);
  });
});
