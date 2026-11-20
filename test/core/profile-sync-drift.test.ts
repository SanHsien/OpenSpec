import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import * as fs from 'node:fs';
import * as path from 'node:path';
import * as os from 'node:os';
import {
  hasProjectConfigDrift,
  hasToolProfileOrDeliveryDrift,
  WORKFLOW_TO_SKILL_DIR,
} from '../../src/core/profile-sync-drift.js';
import { CORE_WORKFLOWS } from '../../src/core/profiles.js';
import { CommandAdapterRegistry, generateCommand } from '../../src/core/command-generation/index.js';
import { getCommandContents } from '../../src/core/shared/skill-generation.js';

function writeSkill(projectDir: string, workflowId: string): void {
  const skillDirName = WORKFLOW_TO_SKILL_DIR[workflowId as keyof typeof WORKFLOW_TO_SKILL_DIR];
  const skillPath = path.join(projectDir, '.claude', 'skills', skillDirName, 'SKILL.md');
  fs.mkdirSync(path.dirname(skillPath), { recursive: true });
  fs.writeFileSync(skillPath, `name: ${skillDirName}\n`);
}

// Writes the command file OpenSpec itself generates (unedited), unless `content`
// stands in for a file the user edited.
function writeCommand(projectDir: string, workflowId: string, content?: string): void {
  const adapter = CommandAdapterRegistry.get('claude');
  if (!adapter) throw new Error('Claude adapter unavailable in test environment');
  const cmdPath = adapter.getFilePath(workflowId);
  const fullPath = path.isAbsolute(cmdPath) ? cmdPath : path.join(projectDir, cmdPath);
  fs.mkdirSync(path.dirname(fullPath), { recursive: true });
  fs.writeFileSync(
    fullPath,
    content ?? generateCommand(getCommandContents([workflowId])[0], adapter).fileContent
  );
}

function setupCoreSkills(projectDir: string): void {
  for (const workflow of CORE_WORKFLOWS) {
    writeSkill(projectDir, workflow);
  }
}

function setupCoreCommands(projectDir: string): void {
  for (const workflow of CORE_WORKFLOWS) {
    writeCommand(projectDir, workflow);
  }
}

function setupCodexCoreSkills(projectDir: string): string {
  const skillsDir = path.join(projectDir, '.agents', 'skills');
  for (const workflow of CORE_WORKFLOWS) {
    const skillDirName = WORKFLOW_TO_SKILL_DIR[workflow];
    const skillPath = path.join(skillsDir, skillDirName, 'SKILL.md');
    fs.mkdirSync(path.dirname(skillPath), { recursive: true });
    fs.writeFileSync(skillPath, `name: ${skillDirName}\n`);
  }
  fs.writeFileSync(path.join(skillsDir, '.openspec-target'), 'codex\n');
  return skillsDir;
}

describe('profile sync drift detection', () => {
  let tempDir: string;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'openspec-profile-sync-drift-test-'));
    fs.mkdirSync(path.join(tempDir, 'openspec'), { recursive: true });
    vi.stubEnv('HOME', path.join(tempDir, 'home'));
    vi.stubEnv('USERPROFILE', path.join(tempDir, 'home'));
  });

  afterEach(() => {
    vi.unstubAllEnvs();
    fs.rmSync(tempDir, { recursive: true, force: true });
  });

  it('detects drift for skills-only delivery when commands still exist', () => {
    setupCoreSkills(tempDir);
    setupCoreCommands(tempDir);

    const hasDrift = hasProjectConfigDrift(tempDir, CORE_WORKFLOWS, 'skills');
    expect(hasDrift).toBe(true);
  });

  it('does not count a command file the user edited (kept by removal on purpose) as drift', () => {
    // Removal keeps an edited command file, so reporting it as drift made every
    // update re-run config sync and rewrite the skills without ever converging.
    setupCoreSkills(tempDir);
    writeCommand(tempDir, 'explore', '# explore\nOur team step.\n');

    expect(hasToolProfileOrDeliveryDrift(tempDir, 'claude', CORE_WORKFLOWS, 'skills')).toBe(false);
    expect(hasProjectConfigDrift(tempDir, CORE_WORKFLOWS, 'skills')).toBe(false);
  });

  it('does not count an edited command file of a deselected workflow as drift', () => {
    setupCoreSkills(tempDir);
    setupCoreCommands(tempDir);
    writeSkill(tempDir, 'new');
    fs.rmSync(path.join(tempDir, '.claude', 'skills', WORKFLOW_TO_SKILL_DIR.new), { recursive: true });
    writeCommand(tempDir, 'new', '# new\nlocal tweak\n');

    expect(hasToolProfileOrDeliveryDrift(tempDir, 'claude', CORE_WORKFLOWS, 'both')).toBe(false);
    expect(hasProjectConfigDrift(tempDir, CORE_WORKFLOWS, 'both')).toBe(false);
  });

  it('detects drift for commands-only delivery when skills still exist', () => {
    setupCoreCommands(tempDir);
    setupCoreSkills(tempDir);

    const hasDrift = hasProjectConfigDrift(tempDir, CORE_WORKFLOWS, 'commands');
    expect(hasDrift).toBe(true);
  });

  it('does not remove global MiniMax Code skills for commands-only delivery', () => {
    const skillPath = path.join(
      tempDir,
      'home',
      '.minimax',
      'skills',
      'openspec-explore',
      'SKILL.md'
    );
    fs.mkdirSync(path.dirname(skillPath), { recursive: true });
    fs.writeFileSync(skillPath, 'name: openspec-explore\n');

    expect(hasProjectConfigDrift(tempDir, CORE_WORKFLOWS, 'commands')).toBe(false);
  });

  it('detects drift when required profile workflow files are missing', () => {
    writeSkill(tempDir, 'explore');

    const hasDrift = hasProjectConfigDrift(tempDir, CORE_WORKFLOWS, 'both');
    expect(hasDrift).toBe(true);
  });

  it('returns false when project files match core profile and delivery', () => {
    setupCoreSkills(tempDir);
    setupCoreCommands(tempDir);

    const hasDrift = hasProjectConfigDrift(tempDir, CORE_WORKFLOWS, 'both');
    expect(hasDrift).toBe(false);
  });

  it('detects drift when extra workflows are installed for both delivery', () => {
    setupCoreSkills(tempDir);
    setupCoreCommands(tempDir);
    writeSkill(tempDir, 'new');
    writeCommand(tempDir, 'new');

    const hasDrift = hasProjectConfigDrift(tempDir, CORE_WORKFLOWS, 'both');
    expect(hasDrift).toBe(true);
  });

  it('does not report legacy Codex drift when both roots resolve to the same files', () => {
    setupCodexCoreSkills(tempDir);
    fs.symlinkSync(
      process.platform === 'win32' ? path.join(tempDir, '.agents') : '.agents',
      path.join(tempDir, '.codex'),
      process.platform === 'win32' ? 'junction' : 'dir'
    );

    expect(
      hasToolProfileOrDeliveryDrift(tempDir, 'codex', CORE_WORKFLOWS, 'skills')
    ).toBe(false);
  });

  it('reports an equal distinct legacy Codex copy that migration can remove', () => {
    const skillsDir = setupCodexCoreSkills(tempDir);
    const currentSkill = path.join(skillsDir, 'openspec-explore', 'SKILL.md');
    const legacySkill = path.join(
      tempDir,
      '.codex',
      'skills',
      'openspec-explore',
      'SKILL.md'
    );
    fs.mkdirSync(path.dirname(legacySkill), { recursive: true });
    fs.copyFileSync(currentSkill, legacySkill);

    expect(
      hasToolProfileOrDeliveryDrift(tempDir, 'codex', CORE_WORKFLOWS, 'skills')
    ).toBe(true);
  });

  it('reports generated-only Codex differences that migration can remove', () => {
    const skillsDir = setupCodexCoreSkills(tempDir);
    const currentSkill = path.join(skillsDir, 'openspec-explore', 'SKILL.md');
    const legacySkill = path.join(
      tempDir,
      '.codex',
      'skills',
      'openspec-explore',
      'SKILL.md'
    );
    fs.writeFileSync(
      currentSkill,
      '---\nmetadata:\n  generatedBy: "1.7.0"\n---\nUse $openspec-apply-change (Codex) or /openspec-apply-change (other agents).\n'
    );
    fs.mkdirSync(path.dirname(legacySkill), { recursive: true });
    fs.writeFileSync(
      legacySkill,
      '\uFEFF---\r\nmetadata:\r\n  generatedBy: "0.1.0"\r\n---\r\nUse $openspec-apply-change.\r\n'
    );

    expect(
      hasToolProfileOrDeliveryDrift(tempDir, 'codex', CORE_WORKFLOWS, 'skills')
    ).toBe(true);
  });

  it('does not repeatedly report a divergent legacy Codex copy', () => {
    setupCodexCoreSkills(tempDir);
    const legacySkill = path.join(
      tempDir,
      '.codex',
      'skills',
      'openspec-explore',
      'SKILL.md'
    );
    fs.mkdirSync(path.dirname(legacySkill), { recursive: true });
    fs.writeFileSync(legacySkill, 'user customization\n');

    expect(
      hasToolProfileOrDeliveryDrift(tempDir, 'codex', CORE_WORKFLOWS, 'skills')
    ).toBe(false);
  });
});
