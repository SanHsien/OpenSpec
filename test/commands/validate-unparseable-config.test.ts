import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { promises as fs } from 'fs';
import os from 'os';
import path from 'path';
import { runCLI, terminateActiveCliChildren } from '../helpers/run-cli.js';

// Every case spawns the real CLI. A cold Node start on Windows can push one past
// the default 10s, so give them more room there (same as store-git/store-remote).
// The CLI timeout stays below the test timeout so runCLI kills a slow child and
// reports it, instead of vitest abandoning the test with the child still running.
const CLI_TEST_TIMEOUT_MS = process.platform === 'win32' ? 30_000 : 10_000;
const CLI_TIMEOUT_MS = CLI_TEST_TIMEOUT_MS - 5_000;

// Every command but `validate` ignores a config.yaml that is not valid YAML
// with a warning, which silently drops every rule in it. `validate` is the gate
// CI runs, so it has to fail on such a file (upstream #1892).
describe('validate with an unparseable config.yaml', { timeout: CLI_TEST_TIMEOUT_MS }, () => {
  let testDir: string;
  let configPath: string;

  beforeEach(async () => {
    testDir = await fs.mkdtemp(path.join(os.tmpdir(), 'openspec-validate-config-'));
    const specDir = path.join(testDir, 'openspec', 'specs', 'alpha');
    await fs.mkdir(specDir, { recursive: true });
    await fs.mkdir(path.join(testDir, 'openspec', 'changes'), { recursive: true });
    await fs.writeFile(
      path.join(specDir, 'spec.md'),
      [
        '## Purpose',
        'This spec gives the validator one well-formed capability to check in this test.',
        '',
        '## Requirements',
        '',
        '### Requirement: Alpha SHALL respond',
        'The alpha module SHALL respond to every request.',
        '',
        '#### Scenario: Request handled',
        '- **WHEN** a request arrives',
        '- **THEN** alpha responds',
        '',
      ].join('\n')
    );
    configPath = path.join(testDir, 'openspec', 'config.yaml');
    // An unterminated quote in a rules item.
    await fs.writeFile(
      configPath,
      "rules:\n  proposal:\n    - 'Keep the \"Why\" section concrete: what breaks today\n"
    );
  });

  afterEach(async () => {
    // A child left running (failed assertion, aborted test) holds the temp dir
    // open on Windows and turns cleanup into EBUSY; stop it first.
    terminateActiveCliChildren();
    await fs.rm(testDir, { recursive: true, force: true, maxRetries: 5, retryDelay: 200 });
  });

  it.each([[['--all']], [['--specs']], [['--archived']], [['alpha']]])(
    'fails `validate %s` with the parse error',
    async (args) => {
      const result = await runCLI(['validate', ...args], { cwd: testDir, timeoutMs: CLI_TIMEOUT_MS });

      expect(result.exitCode).toBe(1);
      expect(result.stderr).toContain('Error: Could not parse');
      expect(result.stderr).toContain('Fix: Fix the YAML syntax in');
    }
  );

  it('names the config file in the error', async () => {
    const result = await runCLI(['validate', '--all'], { cwd: testDir, timeoutMs: CLI_TIMEOUT_MS });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain(path.join('openspec', 'config.yaml'));
  });

  it('fails the same way when the config is spelled config.yml', async () => {
    const ymlPath = path.join(testDir, 'openspec', 'config.yml');
    await fs.rename(configPath, ymlPath);

    const result = await runCLI(['validate', '--all'], { cwd: testDir, timeoutMs: CLI_TIMEOUT_MS });

    expect(result.exitCode).toBe(1);
    expect(result.stderr).toContain(path.join('openspec', 'config.yml'));
  });

  // `list` does not load config.yaml, so it neither warns nor fails on the broken file.
  it('leaves commands that do not read the config working', async () => {
    const result = await runCLI(['list', '--specs'], { cwd: testDir, timeoutMs: CLI_TIMEOUT_MS });

    expect(result.exitCode).toBe(0);
    expect(result.stdout).toContain('alpha');
    expect(result.stderr).not.toMatch(/could not parse/i);
  });

  it('reports the parse error in the JSON status envelope', async () => {
    const result = await runCLI(['validate', '--all', '--json'], { cwd: testDir, timeoutMs: CLI_TIMEOUT_MS });

    expect(result.exitCode).toBe(1);
    const output = JSON.parse(result.stdout);
    expect(output.status).toHaveLength(1);
    expect(output.status[0]).toMatchObject({ severity: 'error', code: 'unparseable_config' });
    expect(output.status[0].message).toContain('Could not parse');
  });

  it('still passes once the YAML is fixed', async () => {
    await fs.writeFile(configPath, 'schema: spec-driven\n');

    const result = await runCLI(['validate', '--all'], { cwd: testDir, timeoutMs: CLI_TIMEOUT_MS });

    expect(result.exitCode).toBe(0);
  });

  it('still passes when the YAML parses but a field is invalid (that stays a warning)', async () => {
    await fs.writeFile(configPath, 'schema: spec-driven\ncontext: 5\n');

    const result = await runCLI(['validate', '--all'], { cwd: testDir, timeoutMs: CLI_TIMEOUT_MS });

    expect(result.exitCode).toBe(0);
  });

  it('does not require a config file at all', async () => {
    await fs.rm(configPath);

    const result = await runCLI(['validate', '--all'], { cwd: testDir, timeoutMs: CLI_TIMEOUT_MS });

    expect(result.exitCode).toBe(0);
  });
});
