/**
 * RepoContextProvider
 *
 * Provides repository structure, recent files, and git history
 * as context for the debug pipeline.
 */

import { readdir, stat } from 'node:fs/promises';
import { join, relative } from 'node:path';
import { execFile } from 'node:child_process';
import { promisify } from 'node:util';

const execFileAsync = promisify(execFile);

export class RepoContextProvider {
  /**
   * @param {object} [config]
   * @param {string} [config.repoRoot] - Repository root path
   * @param {number} [config.maxDepth] - Max directory traversal depth (default 3)
   * @param {number} [config.maxFiles] - Max files to return (default 50)
   */
  constructor(config = {}) {
    this.repoRoot = config.repoRoot || process.cwd();
    this.maxDepth = config.maxDepth ?? 3;
    this.maxFiles = config.maxFiles ?? 50;
  }

  /**
   * Fetch repository context.
   * @param {object} [params]
   * @param {string} [params.type] - 'structure' | 'recent' | 'history' (default 'structure')
   * @param {number} [params.limit] - Number of items to return
   * @returns {Promise<import('../mcp-client.js').ContextResult>}
   */
  async fetch(params = {}) {
    const type = params.type || 'structure';
    const limit = params.limit || this.maxFiles;

    let data;
    switch (type) {
      case 'structure':
        data = await this._getStructure();
        break;
      case 'recent':
        data = await this._getRecentFiles(limit);
        break;
      case 'history':
        data = await this._getGitHistory(limit);
        break;
      default:
        data = { error: `Unknown type: ${type}` };
    }

    return {
      type: 'repo',
      data,
      source: 'RepoContextProvider',
      timestamp: new Date().toISOString()
    };
  }

  /** @private */
  async _getStructure(dir = this.repoRoot, depth = 0) {
    if (depth >= this.maxDepth) return [];
    const entries = [];
    try {
      const items = await readdir(dir, { withFileTypes: true });
      for (const item of items) {
        if (item.name.startsWith('.') || item.name === 'node_modules' || item.name === 'coverage') {
          continue;
        }
        const fullPath = join(dir, item.name);
        const relPath = relative(this.repoRoot, fullPath);
        if (item.isDirectory()) {
          const children = await this._getStructure(fullPath, depth + 1);
          entries.push({ path: relPath, type: 'directory', children });
        } else {
          entries.push({ path: relPath, type: 'file' });
        }
        if (entries.length >= this.maxFiles) break;
      }
    } catch {
      // directory unreadable
    }
    return entries;
  }

  /** @private */
  async _getRecentFiles(limit) {
    try {
      const { stdout } = await execFileAsync(
        'git', ['log', '--name-only', '--pretty=format:', `-${limit}`, '--diff-filter=ACMR'],
        { cwd: this.repoRoot, timeout: 5000 }
      );
      const files = [...new Set(stdout.split('\n').filter(Boolean))].slice(0, limit);
      return { files };
    } catch {
      return { files: [], error: 'git not available' };
    }
  }

  /** @private */
  async _getGitHistory(limit) {
    try {
      const { stdout } = await execFileAsync(
        'git', ['log', '--oneline', `-${limit}`],
        { cwd: this.repoRoot, timeout: 5000 }
      );
      const commits = stdout.trim().split('\n').filter(Boolean).map((line) => {
        const [hash, ...rest] = line.split(' ');
        return { hash, message: rest.join(' ') };
      });
      return { commits };
    } catch {
      return { commits: [], error: 'git not available' };
    }
  }
}
