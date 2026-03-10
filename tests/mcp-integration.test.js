import { jest } from '@jest/globals';
import { createMcpClient } from '../src/mcp/index.js';
import { McpClient } from '../src/mcp/mcp-client.js';
import { join } from 'node:path';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';

let tempDir;

beforeAll(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'mcp-int-'));
  await mkdir(join(tempDir, 'logs'), { recursive: true });
  await writeFile(join(tempDir, 'logs', 'test.log'), 'ERROR something broke\nINFO ok');
});

afterAll(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

describe('createMcpClient', () => {
  it('creates client with all four default providers', async () => {
    const client = await createMcpClient({
      repoRoot: process.cwd(),
      logsDir: join(tempDir, 'logs'),
      schemaDir: tempDir,
      metricsDir: tempDir
    });
    expect(client).toBeInstanceOf(McpClient);
    expect(client.listProviders()).toEqual(['repo', 'logs', 'schema', 'metrics']);
  });

  it('degrades gracefully without MCP transport', async () => {
    const client = await createMcpClient();
    expect(client.isConnected()).toBe(false);
    // Still can fetch from file-based providers
    const repo = await client.fetchContext('repo', { type: 'structure' });
    expect(repo).not.toBeNull();
    expect(repo.type).toBe('repo');
  });

  it('connects when transport is provided', async () => {
    const transport = {
      connect: jest.fn(),
      disconnect: jest.fn()
    };
    const client = await createMcpClient({ transport });
    expect(client.isConnected()).toBe(true);
    await client.disconnect();
  });
});

describe('Pipeline integration (retriever fallback)', () => {
  it('fetches evidence from logs provider', async () => {
    const client = await createMcpClient({
      logsDir: join(tempDir, 'logs')
    });
    const result = await client.fetchContext('logs', { file: 'test.log', level: 'error' });
    expect(result.data.lineCount).toBe(1);
    expect(result.data.lines[0]).toContain('ERROR');
  });

  it('returns null for unavailable context', async () => {
    const client = await createMcpClient();
    const result = await client.fetchContext('nonexistent');
    expect(result).toBeNull();
  });

  it('caches repeated requests', async () => {
    const client = await createMcpClient({
      logsDir: join(tempDir, 'logs')
    });
    const r1 = await client.fetchContext('logs', { file: 'test.log' });
    const r2 = await client.fetchContext('logs', { file: 'test.log' });
    expect(r1).toBe(r2); // Same reference (cached)
  });

  it('fetches multiple contexts in parallel', async () => {
    const client = await createMcpClient({
      repoRoot: process.cwd(),
      logsDir: join(tempDir, 'logs')
    });
    const results = await client.fetchMultiple([
      { name: 'repo', params: { type: 'history', limit: 3 } },
      { name: 'logs', params: { file: 'test.log' } }
    ]);
    expect(results.size).toBe(2);
    expect(results.get('repo').type).toBe('repo');
    expect(results.get('logs').type).toBe('logs');
  });
});
