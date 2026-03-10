import { jest } from '@jest/globals';
import { join } from 'node:path';
import { mkdtemp, writeFile, mkdir, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { Retriever } from '../src/orchestrator/retriever.js';

let tempDir;

beforeAll(async () => {
  tempDir = await mkdtemp(join(tmpdir(), 'retriever-test-'));
  await mkdir(join(tempDir, 'src'), { recursive: true });
  await writeFile(join(tempDir, 'src', 'app.js'), 'const x = 1;\nconsole.log(x);\n');
  await writeFile(join(tempDir, 'config.json'), '{ "key": "value" }');
});

afterAll(async () => {
  await rm(tempDir, { recursive: true, force: true });
});

function mockMcpClient(overrides = {}) {
  return {
    fetchMultiple: jest.fn(async (requests) => {
      const results = new Map();
      for (const req of requests) {
        results.set(req.name, {
          type: req.name,
          data: { mock: true, params: req.params },
          source: `Mock:${req.name}`,
          timestamp: '2026-01-01T00:00:00Z'
        });
      }
      return results;
    }),
    ...overrides
  };
}

describe('Retriever', () => {
  describe('constructor', () => {
    it('defaults to no MCP client', () => {
      const r = new Retriever();
      expect(r.mcpClient).toBeNull();
    });

    it('accepts MCP client', () => {
      const client = mockMcpClient();
      const r = new Retriever({ mcpClient: client });
      expect(r.mcpClient).toBe(client);
    });

    it('defaults timeout to 5000ms', () => {
      const r = new Retriever();
      expect(r.timeoutMs).toBe(5000);
    });
  });

  describe('gather with MCP', () => {
    it('fetches logs via MCP when logFile is specified', async () => {
      const client = mockMcpClient();
      const r = new Retriever({ mcpClient: client });

      const result = await r.gather({ logFile: 'app.log', logLevel: 'error' });
      expect(client.fetchMultiple).toHaveBeenCalledTimes(1);
      expect(result.evidence.length).toBe(1);
      expect(result.evidence[0].provider).toBe('logs');
      expect(result.sources).toContain('mcp:logs');
    });

    it('fetches schema via MCP when schemaFile is specified', async () => {
      const client = mockMcpClient();
      const r = new Retriever({ mcpClient: client });

      const result = await r.gather({ schemaFile: 'tables.sql', table: 'users' });
      expect(result.evidence.length).toBe(1);
      expect(result.evidence[0].provider).toBe('schema');
      expect(result.sources).toContain('mcp:schema');
    });

    it('fetches metrics via MCP when metric is specified', async () => {
      const client = mockMcpClient();
      const r = new Retriever({ mcpClient: client });

      const result = await r.gather({ metricsFile: 'perf.json', metric: 'latency_p99' });
      expect(result.evidence.length).toBe(1);
      expect(result.evidence[0].provider).toBe('metrics');
    });

    it('fetches recent repo context when errorMessage is provided', async () => {
      const client = mockMcpClient();
      const r = new Retriever({ mcpClient: client });

      const result = await r.gather({ errorMessage: 'NullPointerException' });
      expect(result.evidence.length).toBe(1);
      expect(result.evidence[0].provider).toBe('repo');
    });

    it('fetches multiple contexts in parallel', async () => {
      const client = mockMcpClient();
      const r = new Retriever({ mcpClient: client });

      const result = await r.gather({
        logFile: 'app.log',
        schemaFile: 'tables.sql',
        errorMessage: 'Connection timeout'
      });
      // logs + schema + repo
      expect(result.evidence.length).toBe(3);
      expect(result.sources).toContain('mcp:logs');
      expect(result.sources).toContain('mcp:schema');
      expect(result.sources).toContain('mcp:repo');
    });

    it('skips null results from MCP', async () => {
      const client = mockMcpClient({
        fetchMultiple: jest.fn(async (requests) => {
          const results = new Map();
          for (const req of requests) {
            results.set(req.name, null);
          }
          return results;
        })
      });
      const r = new Retriever({ mcpClient: client });

      const result = await r.gather({ logFile: 'missing.log' });
      expect(result.evidence.length).toBe(0);
    });
  });

  describe('gather without MCP (graceful degradation)', () => {
    it('returns empty evidence when no MCP and no files', async () => {
      const r = new Retriever();
      const result = await r.gather({ errorMessage: 'something' });
      expect(result.evidence).toEqual([]);
      expect(result.sources).toEqual([]);
    });

    it('falls back to file reads when no MCP client', async () => {
      const r = new Retriever({ repoRoot: tempDir });
      const result = await r.gather({ files: ['src/app.js'] });
      expect(result.evidence.length).toBe(1);
      expect(result.evidence[0].provider).toBe('file-fallback');
      expect(result.evidence[0].data.content).toContain('const x = 1');
      expect(result.sources).toContain('file:src/app.js');
    });

    it('reads multiple files as fallback', async () => {
      const r = new Retriever({ repoRoot: tempDir });
      const result = await r.gather({ files: ['src/app.js', 'config.json'] });
      expect(result.evidence.length).toBe(2);
    });

    it('handles unreadable files gracefully', async () => {
      const r = new Retriever({ repoRoot: tempDir });
      const result = await r.gather({ files: ['nonexistent.js'] });
      expect(result.evidence.length).toBe(1);
      expect(result.evidence[0].data.error).toBe('File not readable');
      expect(result.sources).toContain('file:nonexistent.js:error');
    });
  });

  describe('MCP + file fallback combined', () => {
    it('uses MCP for logs and file fallback for specific files', async () => {
      const client = mockMcpClient();
      const r = new Retriever({ mcpClient: client, repoRoot: tempDir });

      const result = await r.gather({
        logFile: 'app.log',
        files: ['src/app.js']
      });
      // 1 from MCP (logs) + 1 from file fallback
      expect(result.evidence.length).toBe(2);
      expect(result.sources).toContain('mcp:logs');
      expect(result.sources).toContain('file:src/app.js');
    });
  });

  describe('timeout handling', () => {
    it('returns empty results when MCP times out', async () => {
      const client = mockMcpClient({
        fetchMultiple: jest.fn(() => new Promise((resolve) => setTimeout(resolve, 500)))
      });
      const r = new Retriever({ mcpClient: client, timeoutMs: 50 });

      const result = await r.gather({ logFile: 'app.log' });
      expect(result.evidence.length).toBe(0);
    });

    it('returns empty results when MCP throws', async () => {
      const client = mockMcpClient({
        fetchMultiple: jest.fn(async () => { throw new Error('MCP down'); })
      });
      const r = new Retriever({ mcpClient: client });

      const result = await r.gather({ logFile: 'app.log' });
      expect(result.evidence.length).toBe(0);
    });
  });

  describe('_buildRequests', () => {
    it('returns empty array for empty input', () => {
      const r = new Retriever();
      expect(r._buildRequests({})).toEqual([]);
    });

    it('builds log request', () => {
      const r = new Retriever();
      const requests = r._buildRequests({ logLevel: 'error' });
      expect(requests).toEqual([{
        name: 'logs',
        params: { file: undefined, level: 'error', pattern: undefined }
      }]);
    });

    it('builds schema request', () => {
      const r = new Retriever();
      const requests = r._buildRequests({ table: 'users' });
      expect(requests).toEqual([{
        name: 'schema',
        params: { file: undefined, table: 'users' }
      }]);
    });
  });
});
