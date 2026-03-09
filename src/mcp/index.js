/**
 * MCP module barrel export.
 *
 * Provides McpClient and all context providers for integration
 * with the debug copilot pipeline.
 */

export { McpClient } from './mcp-client.js';
export {
  RepoContextProvider,
  LogContextProvider,
  SchemaContextProvider,
  MetricsContextProvider
} from './context-providers/index.js';

/**
 * Create and configure an McpClient with all default providers.
 * @param {object} [config]
 * @param {string} [config.repoRoot]
 * @param {string} [config.logsDir]
 * @param {string} [config.schemaDir]
 * @param {string} [config.metricsDir]
 * @param {number} [config.timeoutMs]
 * @param {object} [config.transport]
 * @returns {Promise<import('./mcp-client.js').McpClient>}
 */
export async function createMcpClient(config = {}) {
  const { McpClient } = await import('./mcp-client.js');
  const { RepoContextProvider } = await import('./context-providers/repo-context-provider.js');
  const { LogContextProvider } = await import('./context-providers/log-context-provider.js');
  const { SchemaContextProvider } = await import('./context-providers/schema-context-provider.js');
  const { MetricsContextProvider } = await import('./context-providers/metrics-context-provider.js');

  const client = new McpClient({
    timeoutMs: config.timeoutMs,
    transport: config.transport
  });

  client.registerProvider('repo', new RepoContextProvider({
    repoRoot: config.repoRoot
  }));
  client.registerProvider('logs', new LogContextProvider({
    logsDir: config.logsDir
  }));
  client.registerProvider('schema', new SchemaContextProvider({
    schemaDir: config.schemaDir
  }));
  client.registerProvider('metrics', new MetricsContextProvider({
    metricsDir: config.metricsDir
  }));

  await client.connect();
  return client;
}
