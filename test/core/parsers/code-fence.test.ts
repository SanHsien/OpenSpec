import { describe, it, expect } from 'vitest';
import { buildCodeFenceMask } from '../../../src/core/parsers/code-fence.js';
import { MarkdownParser } from '../../../src/core/parsers/markdown-parser.js';
import { extractRequirementsSection } from '../../../src/core/parsers/requirement-blocks.js';

// CommonMark: the info string of a backtick fence may not contain a backtick,
// so a line such as "```npm test``` must pass" is inline code, not a fence
// opener. Treating it as one masks every following line, which hides later
// requirements from validate, list and archive (upstream #2130).
describe('buildCodeFenceMask', () => {
  it('does not open a fence on a backtick line whose info string has a backtick', () => {
    const lines = ['Run ```npm test``` first.', '```npm test``` must pass.', '### Requirement: B', 'text'];
    expect(buildCodeFenceMask(lines)).toEqual([false, false, false, false]);
  });

  it('does not open a fence on a longer backtick run with backticks in the info string', () => {
    const lines = ['````a`b', '### Requirement: B', 'text'];
    expect(buildCodeFenceMask(lines)).toEqual([false, false, false]);
  });

  it('still opens a tilde fence whose info string contains a backtick', () => {
    const lines = ['~~~ `x`', '### Requirement: hidden', '~~~', 'after'];
    expect(buildCodeFenceMask(lines)).toEqual([true, true, true, false]);
  });

  it('still opens a plain backtick fence, with or without an info string', () => {
    expect(buildCodeFenceMask(['```ts', 'code', '```', 'after'])).toEqual([true, true, true, false]);
    expect(buildCodeFenceMask(['```', 'code', '```', 'after'])).toEqual([true, true, true, false]);
    expect(buildCodeFenceMask(['  ```ts title="x y"', 'code', '```', 'after'])).toEqual([
      true,
      true,
      true,
      false,
    ]);
  });

  it('handles CRLF-terminated lines', () => {
    const lines = ['```ts\r', 'code\r', '```\r', 'after\r'];
    expect(buildCodeFenceMask(lines)).toEqual([true, true, true, false]);
    const inline = ['```npm test``` first\r', '### Requirement: B\r'];
    expect(buildCodeFenceMask(inline)).toEqual([false, false]);
  });

  it('keeps every requirement after a line that starts with triple-backtick inline code', () => {
    const content = [
      '# Spec',
      '',
      '## Purpose',
      'Purpose text.',
      '',
      '## Requirements',
      '',
      '### Requirement: First',
      '```openspec validate``` SHALL exit 0 on a valid change.',
      '',
      '#### Scenario: ok',
      '- **WHEN** valid',
      '- **THEN** exit 0',
      '',
      '### Requirement: Second',
      'The system SHALL keep this requirement.',
      '',
      '#### Scenario: kept',
      '- **WHEN** parsed',
      '- **THEN** present',
      '',
    ].join('\n');

    const spec = new MarkdownParser(content).parseSpec('s');
    expect(spec.requirements).toHaveLength(2);
    expect(extractRequirementsSection(content).bodyBlocks.map((block) => block.name)).toEqual([
      'First',
      'Second',
    ]);
  });
});
