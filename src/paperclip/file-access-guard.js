/**
 * File Access Guard for Paperclip Integration (SC-2 Compliance)
 *
 * Enforces deny-by-default file access control per agent role.
 * All file operations must be explicitly allowed per agent's allowlist.
 */

// Note: minimatch is a transitive dependency through jest/jest-reporters
// We'll implement simple glob matching internally rather than depend on external library

const PROTECTED_FILES_NO_AGENT_MAY_WRITE = [
  'CLAUDE.md',
  '.claude/agents/*',
  'src/run.js',
  '.env',
  '.env.*',
  'package.json',
  'package-lock.json'
];

const AGENT_PERMISSIONS = {
  router: {
    read: ['src/**/*', '.claude/agents/**/*', 'logs/**/*'],
    write: [],
    deny_always: ['.env', '.env.*', 'credentials*', '.git/**/*']
  },
  retriever: {
    read: ['src/**/*', 'logs/**/*', '*.json', '*.yaml', '*.yml', '*.md'],
    write: [],
    deny_always: ['.env', '.env.*', 'credentials*', '.git/**/*']
  },
  skeptic: {
    read: ['.paperclip/task-outputs/**/*'],
    write: ['.paperclip/skeptic-output.json'],
    deny_always: ['.env', 'src/**/*', 'CLAUDE.md', '.claude/**/*']
  },
  verifier: {
    read: ['.paperclip/task-outputs/**/*', '.claude/agents/**/*'],
    write: ['.paperclip/verifier-output.json'],
    deny_always: ['.env', 'src/**/*', 'CLAUDE.md']
  },
  orchestrator: {
    read: ['.paperclip/**/*'],
    write: ['.paperclip/task-state/**/*'],
    deny_always: ['.env', 'src/**/*', 'CLAUDE.md', '.claude/agents/**/*', 'package.json']
  }
};

export class FileAccessGuard {
  /**
   * Check if agent is allowed to read a file
   * Deny-by-default: only allowed if explicitly in agent's read allowlist
   */
  static canRead(agentId, filePath) {
    return this._checkAccess(agentId, filePath, 'read');
  }

  /**
   * Check if agent is allowed to write to a file
   * Deny-by-default: only allowed if explicitly in agent's write allowlist
   */
  static canWrite(agentId, filePath) {
    // Check if file is in global deny list (no agent may write)
    for (const protectedPattern of PROTECTED_FILES_NO_AGENT_MAY_WRITE) {
      if (this._pathMatches(filePath, protectedPattern)) {
        return false;
      }
    }

    return this._checkAccess(agentId, filePath, 'write');
  }

  /**
   * Internal: Check access against agent's permission lists
   * Returns true only if file matches an allow pattern and no deny pattern
   */
  static _checkAccess(agentId, filePath, operation) {
    // Deny access if agent is not recognized
    if (!AGENT_PERMISSIONS[agentId]) {
      return false;
    }

    const perms = AGENT_PERMISSIONS[agentId];

    // Check deny_always patterns first (deny takes precedence)
    if (perms.deny_always && Array.isArray(perms.deny_always)) {
      for (const denyPattern of perms.deny_always) {
        if (this._pathMatches(filePath, denyPattern)) {
          return false;
        }
      }
    }

    // Check allowlist for the operation
    const allowlist = perms[operation] || [];
    if (!Array.isArray(allowlist)) {
      return false;
    }

    // Deny-by-default: return true only if path matches an allow pattern
    for (const allowPattern of allowlist) {
      if (this._pathMatches(filePath, allowPattern)) {
        return true;
      }
    }

    // No matching allow pattern = DENY
    return false;
  }

  /**
   * Match file path against glob pattern
   * Handles both explicit paths and wildcard patterns
   * Simple glob implementation: supports *, **, and ? wildcards
   */
  static _pathMatches(filePath, pattern) {
    // Normalize paths (remove leading ./)
    const normalizedPath = filePath.replace(/^\.\//, '');
    const normalizedPattern = pattern.replace(/^\.\//, '');

    // Use placeholder approach to handle glob syntax correctly
    let regexPattern = normalizedPattern;

    // Replace ** with placeholder BEFORE other operations
    const doublestarPlaceholder = '__DOUBLESTAR__';
    const singlestarPlaceholder = '__SINGLESTAR__';
    const questionPlaceholder = '__QUESTION__';

    regexPattern = regexPattern.replace(/\*\*/g, doublestarPlaceholder);
    regexPattern = regexPattern.replace(/\*/g, singlestarPlaceholder);
    regexPattern = regexPattern.replace(/\?/g, questionPlaceholder);

    // Escape regex special characters (glob chars already replaced with placeholders)
    regexPattern = regexPattern.replace(/[\\.+^${}()|[\]]/g, '\\$&');

    // Replace placeholders with final regex equivalents
    // Special case: **/* at end should become .* to match anything
    regexPattern = regexPattern.replace(
      new RegExp(doublestarPlaceholder + '/' + singlestarPlaceholder, 'g'),
      '.*'
    );
    regexPattern = regexPattern.replace(new RegExp(doublestarPlaceholder, 'g'), '.*');
    regexPattern = regexPattern.replace(new RegExp(singlestarPlaceholder, 'g'), '[^/]*');
    regexPattern = regexPattern.replace(new RegExp(questionPlaceholder, 'g'), '[^/]');

    const regex = new RegExp(`^${regexPattern}$`);
    return regex.test(normalizedPath);
  }

  /**
   * Get allowed operations for agent on a file
   * Returns object with 'read' and 'write' boolean properties
   */
  static getAllowedOperations(agentId, filePath) {
    return {
      read: this.canRead(agentId, filePath),
      write: this.canWrite(agentId, filePath)
    };
  }

  /**
   * Get all allowed read paths for an agent
   */
  static getAllowedReadPaths(agentId) {
    const perms = AGENT_PERMISSIONS[agentId];
    if (!perms) {
      return [];
    }
    return perms.read || [];
  }

  /**
   * Get all allowed write paths for an agent
   */
  static getAllowedWritePaths(agentId) {
    const perms = AGENT_PERMISSIONS[agentId];
    if (!perms) {
      return [];
    }
    return perms.write || [];
  }

  /**
   * List all agents and their permissions (for debugging/audit)
   */
  static getAgentPermissions(agentId) {
    const agentPerms = AGENT_PERMISSIONS[agentId];
    if (!agentPerms) {
      return null;
    }
    return {
      agentId,
      read: [...(agentPerms.read || [])],
      write: [...(agentPerms.write || [])],
      deny_always: [...(agentPerms.deny_always || [])]
    };
  }

  /**
   * Validate that all protected files have no write access for any agent
   */
  static validateProtectedFilesEnforcement() {
    const violations = [];

    for (const agentId in AGENT_PERMISSIONS) {
      const writeList = AGENT_PERMISSIONS[agentId].write || [];
      for (const protectedFile of PROTECTED_FILES_NO_AGENT_MAY_WRITE) {
        for (const writePath of writeList) {
          if (this._pathMatches(protectedFile, writePath)) {
            violations.push({
              agent: agentId,
              protectedFile,
              writePath,
              message: `Agent ${agentId} can write to protected file ${protectedFile}`
            });
          }
        }
      }
    }

    return violations;
  }
}

export default FileAccessGuard;
