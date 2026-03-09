import { jest } from '@jest/globals';
import { join } from 'node:path';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { RepoContextProvider } from '../src/mcp/context-providers/repo-context-provider.js';
import { LogContextProvider } from '../src/mcp/context-providers/log-context-provider.js';
import { SchemaContextProvider } from '../src/mcp/context-providers/schema-context-provider.js';
import { MetricsContextProvider } from '../src/mcp/context-providers/metrics-context-provider.js';

let tempDir;

beforeAll(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'mcp-test-'));
});

afterAll(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe('RepoContextProvider', () => {
  let provider;

  beforeEach(() => {
    // Use the actual project root for structure tests
    provider = new RepoContextProvider({
      repoRoot: join(process.cwd()),
      maxDepth: 2,
      maxFiles: 20
    });
  });

  it('fetches repository structure', async () => {
    const result = await provider.fetch({ type: 'structure' });
    expect(result.type).toBe('repo');
    expect(result.source).toBe('RepoContextProvider');
    expect(Array.isArray(result.data)).toBe(true);
    expect(result.data.length).toBeGreaterThan(0);
  });

  it('excludes node_modules and dotfiles', async () => {
    const result = await provider.fetch({ type: 'structure' });
    const paths = result.data.map((e) => e.path);
    expect(paths).not.toContain('node_modules');
    expect(paths.every((p) => !p.startsWith('.'))).toBe(true);
  });

  it('fetches git history', async () => {
    const result = await provider.fetch({ type: 'history', limit: 5 });
    expect(result.type).toBe('repo');
    expect(result.data.commits).toBeDefined();
    expect(Array.isArray(result.data.commits)).toBe(true);
  });

  it('fetches recent files', async () => {
    const result = await provider.fetch({ type: 'recent', limit: 5 });
    expect(result.type).toBe('repo');
    expect(result.data.files).toBeDefined();
  });

  it('handles unknown type', async () => {
    const result = await provider.fetch({ type: 'invalid' });
    expect(result.data.error).toContain('Unknown type');
  });
});

describe('LogContextProvider', () => {
  let logsDir;
  let provider;

  beforeAll(async () => {
    logsDir = join(tempDir, 'logs');
    await mkdir(logsDir, { recursive: true });
    await writeFile(join(logsDir, 'app.log'), [
      '2026-01-01 INFO  Application started',
      '2026-01-01 WARN  Slow query detected',
      '2026-01-01 ERROR Connection timeout on db-primary',
      '2026-01-01 INFO  Request completed 200',
      '2026-01-01 ERROR Null pointer in UserService'
    ].join('\n'));
    await writeFile(join(logsDir, 'notes.md'), 'not a log file');
  });

  beforeEach(() => {
    provider = new LogContextProvider({ logsDir });
  });

  it('reads a specific log file', async () => {
    const result = await provider.fetch({ file: 'app.log' });
    expect(result.type).toBe('logs');
    expect(result.data.lineCount).toBe(5);
  });

  it('filters by level', async () => {
    const result = await provider.fetch({ file: 'app.log', level: 'error' });
    expect(result.data.lines.every((l) => l.includes('ERROR'))).toBe(true);
    expect(result.data.lineCount).toBe(2);
  });

  it('filters by pattern', async () => {
    const result = await provider.fetch({ file: 'app.log', pattern: 'timeout' });
    expect(result.data.lineCount).toBe(1);
  });

  it('lists all log files (excluding non-log extensions)', async () => {
    const result = await provider.fetch({});
    expect(result.data.totalFiles).toBe(1); // only .log, not .md
  });

  it('handles missing file gracefully', async () => {
    const result = await provider.fetch({ file: 'nonexistent.log' });
    expect(result.data.error).toBe('File not readable');
  });

  it('handles missing directory gracefully', async () => {
    const p = new LogContextProvider({ logsDir: '/nonexistent/path' });
    const result = await p.fetch({});
    expect(result.data.error).toBe('Logs directory not readable');
  });
});

describe('SchemaContextProvider', () => {
  let schemaDir;
  let provider;

  beforeAll(async () => {
    schemaDir = join(tempDir, 'schemas');
    await mkdir(schemaDir, { recursive: true });
    await writeFile(join(schemaDir, 'tables.sql'), [
      'CREATE TABLE users (',
      '  id SERIAL PRIMARY KEY,',
      '  email VARCHAR(255) NOT NULL',
      ');',
      '',
      'CREATE TABLE orders (',
      '  id SERIAL PRIMARY KEY,',
      '  user_id INT REFERENCES users(id)',
      ');'
    ].join('\n'));
  });

  beforeEach(() => {
    provider = new SchemaContextProvider({ schemaDir });
  });

  it('reads a specific schema file', async () => {
    const result = await provider.fetch({ file: 'tables.sql' });
    expect(result.type).toBe('schema');
    expect(result.data.content).toContain('CREATE TABLE');
  });

  it('filters by table name', async () => {
    const result = await provider.fetch({ file: 'tables.sql', table: 'users' });
    expect(result.data.content).toContain('users');
    expect(result.data.content).not.toContain('orders');
  });

  it('lists all schema files', async () => {
    const result = await provider.fetch({});
    expect(result.data.totalFiles).toBe(1);
  });

  it('handles missing directory gracefully', async () => {
    const p = new SchemaContextProvider({ schemaDir: '/nonexistent/path' });
    const result = await p.fetch({});
    expect(result.data.error).toBe('Schema directory not readable');
  });
});

describe('MetricsContextProvider', () => {
  let metricsDir;
  let provider;

  beforeAll(async () => {
    metricsDir = join(tempDir, 'metrics');
    await mkdir(metricsDir, { recursive: true });
    await writeFile(join(metricsDir, 'perf.json'), JSON.stringify([
      { name: 'latency_p99', value: 250, timestamp: '2026-01-01T00:00:00Z' },
      { name: 'latency_p99', value: 310, timestamp: '2026-01-02T00:00:00Z' },
      { name: 'error_rate', value: 0.05, timestamp: '2026-01-01T00:00:00Z' }
    ]));
    await writeFile(join(metricsDir, 'bad.json'), 'not json');
  });

  beforeEach(() => {
    provider = new MetricsContextProvider({ metricsDir });
  });

  it('reads a specific metrics file', async () => {
    const result = await provider.fetch({ file: 'perf.json' });
    expect(result.type).toBe('metrics');
    expect(result.data.count).toBe(3);
  });

  it('filters by metric name', async () => {
    const result = await provider.fetch({ file: 'perf.json', metric: 'latency_p99' });
    expect(result.data.count).toBe(2);
  });

  it('filters by since timestamp', async () => {
    const result = await provider.fetch({ file: 'perf.json', since: '2026-01-02T00:00:00Z' });
    expect(result.data.count).toBe(1);
  });

  it('handles invalid JSON gracefully', async () => {
    const result = await provider.fetch({ file: 'bad.json' });
    expect(result.data.error).toBeDefined();
  });

  it('lists all metrics files', async () => {
    const result = await provider.fetch({});
    expect(result.data.totalFiles).toBe(2);
  });

  it('handles missing directory gracefully', async () => {
    const p = new MetricsContextProvider({ metricsDir: '/nonexistent/path' });
    const result = await p.fetch({});
    expect(result.data.error).toBe('Metrics directory not readable');
  });
});
