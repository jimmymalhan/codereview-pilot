/**
 * MCP Client for CodeReview-Pilot
 *
 * Manages Model Context Protocol transport, connects to MCP servers,
 * and provides a unified context providers API. Falls back gracefully
 * when MCP is unavailable.
 */

/** @typedef {{ type: string, data: any, source: string, timestamp: string }} ContextResult */

const DEFAULT_TIMEOUT_MS = 5000;

export class McpClient {
  /**
   * @param {object} [config]
   * @param {number} [config.timeoutMs] - Per-request timeout (default 5000)
   * @param {object} [config.transport] - Custom transport (for testing/DI)
   */
  constructor(config = {}) {
    this.timeoutMs = config.timeoutMs ?? DEFAULT_TIMEOUT_MS;
    this.transport = config.transport ?? null;
    this.connected = false;
    this.providers = new Map();
    this.cache = new Map();
  }

  /**
   * Register a context provider by name.
   * @param {string} name
   * @param {{ fetch: (params: object) => Promise<ContextResult> }} provider
   */
  registerProvider(name, provider) {
    if (!name || typeof provider?.fetch !== 'function') {
      throw new Error(`Invalid provider: must have a fetch() method`);
    }
    this.providers.set(name, provider);
  }

  /**
   * Connect to the MCP server (stdio transport).
   * Returns true on success, false on failure (graceful degradation).
   * @returns {Promise<boolean>}
   */
  async connect() {
    try {
      if (this.transport) {
        await this.transport.connect();
        this.connected = true;
        return true;
      }
      // No transport configured -- degrade gracefully
      this.connected = false;
      return false;
    } catch {
      this.connected = false;
      return false;
    }
  }

  /**
   * Disconnect from the MCP server.
   */
  async disconnect() {
    if (this.transport && this.connected) {
      try {
        await this.transport.disconnect();
      } catch {
        // swallow disconnect errors
      }
    }
    this.connected = false;
    this.cache.clear();
  }

  /**
   * Fetch context from a registered provider with timeout and caching.
   * @param {string} providerName
   * @param {object} [params]
   * @returns {Promise<ContextResult|null>}
   */
  async fetchContext(providerName, params = {}) {
    const provider = this.providers.get(providerName);
    if (!provider) {
      return null;
    }

    const cacheKey = `${providerName}:${JSON.stringify(params)}`;
    if (this.cache.has(cacheKey)) {
      return this.cache.get(cacheKey);
    }

    try {
      const result = await this._withTimeout(provider.fetch(params));
      if (result) {
        this.cache.set(cacheKey, result);
      }
      return result;
    } catch {
      return null;
    }
  }

  /**
   * Fetch from multiple providers in parallel.
   * @param {Array<{ name: string, params?: object }>} requests
   * @returns {Promise<Map<string, ContextResult|null>>}
   */
  async fetchMultiple(requests) {
    const entries = await Promise.all(
      requests.map(async (req) => {
        const result = await this.fetchContext(req.name, req.params);
        return [req.name, result];
      })
    );
    return new Map(entries);
  }

  /**
   * Clear cached context.
   * @param {string} [providerName] - If omitted, clears all.
   */
  clearCache(providerName) {
    if (providerName) {
      for (const key of this.cache.keys()) {
        if (key.startsWith(`${providerName}:`)) {
          this.cache.delete(key);
        }
      }
    } else {
      this.cache.clear();
    }
  }

  /**
   * List registered provider names.
   * @returns {string[]}
   */
  listProviders() {
    return [...this.providers.keys()];
  }

  /** @returns {boolean} */
  isConnected() {
    return this.connected;
  }

  /**
   * Wrap a promise with a timeout.
   * @private
   */
  _withTimeout(promise) {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(
        () => reject(new Error('MCP request timed out')),
        this.timeoutMs
      );
      promise
        .then((val) => { clearTimeout(timer); resolve(val); })
        .catch((err) => { clearTimeout(timer); reject(err); });
    });
  }
}
