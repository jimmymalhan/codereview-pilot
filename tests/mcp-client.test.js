import { jest } from '@jest/globals';
import { McpClient } from '../src/mcp/mcp-client.js';

describe('McpClient', () => {
  let client;

  beforeEach(() => {
    client = new McpClient({ timeoutMs: 500 });
  });

  afterEach(async () => {
    await client.disconnect();
  });

  describe('constructor', () => {
    it('sets default timeout', () => {
      const c = new McpClient();
      expect(c.timeoutMs).toBe(5000);
    });

    it('accepts custom timeout', () => {
      expect(client.timeoutMs).toBe(500);
    });

    it('starts disconnected', () => {
      expect(client.isConnected()).toBe(false);
    });
  });

  describe('registerProvider', () => {
    it('registers a valid provider', () => {
      client.registerProvider('test', { fetch: async () => ({}) });
      expect(client.listProviders()).toContain('test');
    });

    it('throws on invalid provider (no fetch)', () => {
      expect(() => client.registerProvider('bad', {})).toThrow('Invalid provider');
    });

    it('throws on empty name', () => {
      expect(() => client.registerProvider('', { fetch: async () => ({}) })).toThrow('Invalid provider');
    });
  });

  describe('connect', () => {
    it('returns false when no transport configured', async () => {
      const result = await client.connect();
      expect(result).toBe(false);
      expect(client.isConnected()).toBe(false);
    });

    it('connects with valid transport', async () => {
      const transport = { connect: jest.fn(), disconnect: jest.fn() };
      client = new McpClient({ transport });
      const result = await client.connect();
      expect(result).toBe(true);
      expect(client.isConnected()).toBe(true);
    });

    it('returns false on transport error', async () => {
      const transport = { connect: jest.fn(() => { throw new Error('fail'); }) };
      client = new McpClient({ transport });
      const result = await client.connect();
      expect(result).toBe(false);
    });
  });

  describe('disconnect', () => {
    it('disconnects and clears cache', async () => {
      const transport = {
        connect: jest.fn(),
        disconnect: jest.fn()
      };
      client = new McpClient({ transport });
      await client.connect();
      client.cache.set('key', 'val');
      await client.disconnect();
      expect(client.isConnected()).toBe(false);
      expect(client.cache.size).toBe(0);
    });

    it('handles disconnect errors gracefully', async () => {
      const transport = {
        connect: jest.fn(),
        disconnect: jest.fn(() => { throw new Error('oops'); })
      };
      client = new McpClient({ transport });
      await client.connect();
      await expect(client.disconnect()).resolves.not.toThrow();
      expect(client.isConnected()).toBe(false);
    });
  });

  describe('fetchContext', () => {
    it('returns null for unregistered provider', async () => {
      const result = await client.fetchContext('nonexistent');
      expect(result).toBeNull();
    });

    it('fetches from registered provider', async () => {
      const mockResult = { type: 'test', data: { x: 1 }, source: 'test', timestamp: '2026-01-01' };
      client.registerProvider('test', { fetch: jest.fn(async () => mockResult) });
      const result = await client.fetchContext('test', { key: 'val' });
      expect(result).toEqual(mockResult);
    });

    it('caches results', async () => {
      const fetchFn = jest.fn(async () => ({ type: 'test', data: {}, source: 'test', timestamp: '' }));
      client.registerProvider('test', { fetch: fetchFn });
      await client.fetchContext('test', { a: 1 });
      await client.fetchContext('test', { a: 1 });
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it('returns null on provider error', async () => {
      client.registerProvider('fail', { fetch: jest.fn(async () => { throw new Error('boom'); }) });
      const result = await client.fetchContext('fail');
      expect(result).toBeNull();
    });

    it('returns null on timeout', async () => {
      client = new McpClient({ timeoutMs: 50 });
      client.registerProvider('slow', {
        fetch: jest.fn(() => new Promise((resolve) => setTimeout(resolve, 200)))
      });
      const result = await client.fetchContext('slow');
      expect(result).toBeNull();
    });
  });

  describe('fetchMultiple', () => {
    it('fetches from multiple providers in parallel', async () => {
      const r1 = { type: 'a', data: 1, source: 'a', timestamp: '' };
      const r2 = { type: 'b', data: 2, source: 'b', timestamp: '' };
      client.registerProvider('a', { fetch: jest.fn(async () => r1) });
      client.registerProvider('b', { fetch: jest.fn(async () => r2) });

      const results = await client.fetchMultiple([
        { name: 'a' },
        { name: 'b', params: {} }
      ]);
      expect(results.get('a')).toEqual(r1);
      expect(results.get('b')).toEqual(r2);
    });

    it('returns null for missing providers', async () => {
      const results = await client.fetchMultiple([{ name: 'missing' }]);
      expect(results.get('missing')).toBeNull();
    });
  });

  describe('clearCache', () => {
    it('clears all cache', async () => {
      client.cache.set('a:{}', 'x');
      client.cache.set('b:{}', 'y');
      client.clearCache();
      expect(client.cache.size).toBe(0);
    });

    it('clears cache for specific provider', async () => {
      client.cache.set('a:{}', 'x');
      client.cache.set('b:{}', 'y');
      client.clearCache('a');
      expect(client.cache.has('a:{}')).toBe(false);
      expect(client.cache.has('b:{}')).toBe(true);
    });
  });
});
