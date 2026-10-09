import { describe, expect, it } from 'vitest';
import fs from 'fs';
import path from 'path';

const ROOT = process.cwd();

describe('fork maintainer overlay files', () => {
  it('required overlay files exist', () => {
    const required = [
      'FORK.md',
      'NOTICE.md',
      'GEMINI.md',
      'REVIEW.md',
      'SECURITY.md',
      'AGENTS.md',
      'README.md',
      'README.en.md',
      'CONTRIBUTING.md',
      'docs/DEVELOPMENT.md',
      'docs/DECISIONS.md',
      'docs/UPSTREAM.md',
      'tools/dev_check.ps1',
      'tools/bootstrap_dev.ps1',
      'tools/check_links.py',
      'tools/check_upstream_updates.py',
      'tools/check_dependency_freshness.py',
      'tools/upstream_baseline.json',
      '.cursor/rules/no-upstream-pr.mdc',
      '.github/pull_request_template.md',
    ];
    const missing = required.filter(rel => !fs.existsSync(path.join(ROOT, rel)));
    expect(missing).toEqual([]);
  });

  it('README is Traditional Chinese and English lives in README.en.md', () => {
    const readme = fs.readFileSync(path.join(ROOT, 'README.md'), 'utf-8');
    const readmeEn = fs.readFileSync(path.join(ROOT, 'README.en.md'), 'utf-8');
    const fork = fs.readFileSync(path.join(ROOT, 'FORK.md'), 'utf-8');
    const agents = fs.readFileSync(path.join(ROOT, 'AGENTS.md'), 'utf-8');

    expect(readme).toContain('規範驅動開發');
    expect(readme).toContain('SanHsien');
    expect(readmeEn).toContain('spec framework');
    expect(fork).toContain('SanHsien/OpenSpec');
    expect(agents).toContain('Windows 11 + PowerShell');
  });

  it('Cursor rule strictly enforces no upstream PR', () => {
    const cursorRule = fs.readFileSync(path.join(ROOT, '.cursor/rules/no-upstream-pr.mdc'), 'utf-8');
    expect(cursorRule).toContain('SanHsien/OpenSpec');
    expect(cursorRule).toContain('gh repo set-default SanHsien/OpenSpec');
  });

  it('upstream baseline file is complete and valid', () => {
    const baselinePath = path.join(ROOT, 'tools/upstream_baseline.json');
    const baseline = JSON.parse(fs.readFileSync(baselinePath, 'utf-8'));

    expect(baseline.repo).toContain('Fission-AI/OpenSpec');
    expect(baseline.branch).toBe('main');
    expect(baseline.reviewed_through).toHaveLength(40);
    expect(baseline.reviewed_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    expect(typeof baseline.reviewed_pr_through).toBe('number');
    expect(typeof baseline.reviewed_issue_through).toBe('number');
  });
});