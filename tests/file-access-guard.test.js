/**
 * File Access Guard Module Tests (SC-2 Compliance)
 *
 * Tests for deny-by-default file access control enforcement.
 * 15+ test cases covering:
 * - Per-agent read/write permissions
 * - Deny-by-default enforcement
 * - Protected file write prevention
 * - Glob pattern matching
 * - Agent permissions lookup
 */

import { jest } from '@jest/globals';
import { FileAccessGuard } from '../src/paperclip/file-access-guard.js';

describe('FileAccessGuard: SC-2 Compliance Tests', () => {
  // ============================================================
  // Router Agent Permissions
  // ============================================================
  describe('Router Agent Permissions', () => {
    test('router can read src/** files', () => {
      expect(FileAccessGuard.canRead('router', 'src/paperclip/task-manager.js')).toBe(true);
      expect(FileAccessGuard.canRead('router', 'src/agents/router.js')).toBe(true);
    });

    test('router can read .claude/agents/** files', () => {
      expect(FileAccessGuard.canRead('router', '.claude/agents/router.md')).toBe(true);
    });

    test('router can read logs/** files', () => {
      expect(FileAccessGuard.canRead('router', 'logs/app.log')).toBe(true);
      expect(FileAccessGuard.canRead('router', 'logs/debug/trace.log')).toBe(true);
    });

    test('router cannot read .env files (deny_always)', () => {
      expect(FileAccessGuard.canRead('router', '.env')).toBe(false);
      expect(FileAccessGuard.canRead('router', '.env.local')).toBe(false);
    });

    test('router cannot read credentials files', () => {
      expect(FileAccessGuard.canRead('router', 'credentials.json')).toBe(false);
    });

    test('router cannot read .git files', () => {
      expect(FileAccessGuard.canRead('router', '.git/config')).toBe(false);
    });

    test('router cannot write to any file (write list is empty)', () => {
      expect(FileAccessGuard.canWrite('router', 'src/test.js')).toBe(false);
      expect(FileAccessGuard.canWrite('router', '.paperclip/output.json')).toBe(false);
    });
  });

  // ============================================================
  // Retriever Agent Permissions
  // ============================================================
  describe('Retriever Agent Permissions', () => {
    test('retriever can read src/** files', () => {
      expect(FileAccessGuard.canRead('retriever', 'src/paperclip/task-manager.js')).toBe(true);
    });

    test('retriever can read logs/** files', () => {
      expect(FileAccessGuard.canRead('retriever', 'logs/app.log')).toBe(true);
    });

    test('retriever can read JSON/YAML/Markdown files', () => {
      expect(FileAccessGuard.canRead('retriever', 'config.json')).toBe(true);
      expect(FileAccessGuard.canRead('retriever', 'deployment.yaml')).toBe(true);
      expect(FileAccessGuard.canRead('retriever', 'README.md')).toBe(true);
    });

    test('retriever cannot read .env files', () => {
      expect(FileAccessGuard.canRead('retriever', '.env')).toBe(false);
    });

    test('retriever cannot write to any file', () => {
      expect(FileAccessGuard.canWrite('retriever', 'logs/output.json')).toBe(false);
    });
  });

  // ============================================================
  // Skeptic Agent Permissions
  // ============================================================
  describe('Skeptic Agent Permissions', () => {
    test('skeptic can read .paperclip/task-outputs/** files', () => {
      expect(FileAccessGuard.canRead('skeptic', '.paperclip/task-outputs/task-1.json')).toBe(true);
    });

    test('skeptic can write to .paperclip/skeptic-output.json only', () => {
      expect(FileAccessGuard.canWrite('skeptic', '.paperclip/skeptic-output.json')).toBe(true);
    });

    test('skeptic cannot write to other .paperclip files', () => {
      expect(FileAccessGuard.canWrite('skeptic', '.paperclip/audit-log.json')).toBe(false);
    });

    test('skeptic cannot read src/** files (deny_always)', () => {
      expect(FileAccessGuard.canRead('skeptic', 'src/paperclip/task-manager.js')).toBe(false);
    });

    test('skeptic cannot read CLAUDE.md', () => {
      expect(FileAccessGuard.canRead('skeptic', 'CLAUDE.md')).toBe(false);
    });

    test('skeptic cannot read .claude/** files', () => {
      expect(FileAccessGuard.canRead('skeptic', '.claude/agents/router.md')).toBe(false);
    });

    test('skeptic cannot read or write .env files', () => {
      expect(FileAccessGuard.canRead('skeptic', '.env')).toBe(false);
      expect(FileAccessGuard.canWrite('skeptic', '.env')).toBe(false);
    });
  });

  // ============================================================
  // Verifier Agent Permissions
  // ============================================================
  describe('Verifier Agent Permissions', () => {
    test('verifier can read .paperclip/task-outputs/** files', () => {
      expect(FileAccessGuard.canRead('verifier', '.paperclip/task-outputs/skeptic-review.json')).toBe(true);
    });

    test('verifier can read .claude/agents/** files', () => {
      expect(FileAccessGuard.canRead('verifier', '.claude/agents/verifier.md')).toBe(true);
    });

    test('verifier can write to .paperclip/verifier-output.json only', () => {
      expect(FileAccessGuard.canWrite('verifier', '.paperclip/verifier-output.json')).toBe(true);
    });

    test('verifier cannot read src/** files (deny_always)', () => {
      expect(FileAccessGuard.canRead('verifier', 'src/paperclip/task-manager.js')).toBe(false);
    });

    test('verifier cannot read CLAUDE.md', () => {
      expect(FileAccessGuard.canRead('verifier', 'CLAUDE.md')).toBe(false);
    });

    test('verifier cannot read or write .env files', () => {
      expect(FileAccessGuard.canRead('verifier', '.env')).toBe(false);
      expect(FileAccessGuard.canWrite('verifier', '.env')).toBe(false);
    });
  });

  // ============================================================
  // Orchestrator Agent Permissions
  // ============================================================
  describe('Orchestrator Agent Permissions', () => {
    test('orchestrator can read .paperclip/** files', () => {
      expect(FileAccessGuard.canRead('orchestrator', '.paperclip/task-state/state.json')).toBe(true);
      expect(FileAccessGuard.canRead('orchestrator', '.paperclip/audit-log.json')).toBe(true);
    });

    test('orchestrator can write to .paperclip/task-state/** files', () => {
      expect(FileAccessGuard.canWrite('orchestrator', '.paperclip/task-state/new-state.json')).toBe(true);
    });

    test('orchestrator cannot read src/** files (deny_always)', () => {
      expect(FileAccessGuard.canRead('orchestrator', 'src/paperclip/task-manager.js')).toBe(false);
    });

    test('orchestrator cannot read CLAUDE.md', () => {
      expect(FileAccessGuard.canRead('orchestrator', 'CLAUDE.md')).toBe(false);
    });

    test('orchestrator cannot read .claude/agents/** files', () => {
      expect(FileAccessGuard.canRead('orchestrator', '.claude/agents/router.md')).toBe(false);
    });

    test('orchestrator cannot read or write package.json', () => {
      expect(FileAccessGuard.canRead('orchestrator', 'package.json')).toBe(false);
      expect(FileAccessGuard.canWrite('orchestrator', 'package.json')).toBe(false);
    });

    test('orchestrator cannot read or write .env files', () => {
      expect(FileAccessGuard.canRead('orchestrator', '.env')).toBe(false);
      expect(FileAccessGuard.canWrite('orchestrator', '.env')).toBe(false);
    });
  });

  // ============================================================
  // Protected Files - No Agent May Write
  // ============================================================
  describe('Protected Files - Deny-by-Default Write', () => {
    const protectedFiles = [
      'CLAUDE.md',
      '.claude/agents/router.md',
      'src/run.js',
      '.env',
      '.env.local',
      'package.json',
      'package-lock.json'
    ];

    const agents = ['router', 'retriever', 'skeptic', 'verifier', 'orchestrator'];

    protectedFiles.forEach(file => {
      agents.forEach(agent => {
        test(`${agent} cannot write to ${file}`, () => {
          expect(FileAccessGuard.canWrite(agent, file)).toBe(false);
        });
      });
    });
  });

  // ============================================================
  // Unknown Agent (Deny-by-Default)
  // ============================================================
  describe('Unknown Agent (Deny-by-Default)', () => {
    test('unknown agent cannot read any file', () => {
      expect(FileAccessGuard.canRead('unknown-agent', 'src/test.js')).toBe(false);
      expect(FileAccessGuard.canRead('unknown-agent', 'logs/app.log')).toBe(false);
    });

    test('unknown agent cannot write any file', () => {
      expect(FileAccessGuard.canWrite('unknown-agent', '.paperclip/output.json')).toBe(false);
    });
  });

  // ============================================================
  // Allowed Operations Lookup
  // ============================================================
  describe('Allowed Operations Lookup', () => {
    test('getAllowedOperations returns correct permissions for router', () => {
      const ops = FileAccessGuard.getAllowedOperations('router', 'src/test.js');
      expect(ops.read).toBe(true);
      expect(ops.write).toBe(false);
    });

    test('getAllowedOperations returns correct permissions for skeptic output', () => {
      const ops = FileAccessGuard.getAllowedOperations('skeptic', '.paperclip/skeptic-output.json');
      expect(ops.read).toBe(false);
      expect(ops.write).toBe(true);
    });

    test('getAllowedOperations returns correct permissions for protected file', () => {
      const ops = FileAccessGuard.getAllowedOperations('router', '.env');
      expect(ops.read).toBe(false);
      expect(ops.write).toBe(false);
    });
  });

  // ============================================================
  // Allowed Paths Lookup
  // ============================================================
  describe('Allowed Paths Lookup', () => {
    test('getAllowedReadPaths returns router read paths', () => {
      const paths = FileAccessGuard.getAllowedReadPaths('router');
      expect(paths).toContain('src/**/*');
      expect(paths).toContain('.claude/agents/**/*');
      expect(paths).toContain('logs/**/*');
    });

    test('getAllowedWritePaths returns empty for router', () => {
      const paths = FileAccessGuard.getAllowedWritePaths('router');
      expect(paths).toEqual([]);
    });

    test('getAllowedWritePaths returns skeptic write paths', () => {
      const paths = FileAccessGuard.getAllowedWritePaths('skeptic');
      expect(paths).toContain('.paperclip/skeptic-output.json');
      expect(paths.length).toBe(1);
    });
  });

  // ============================================================
  // Agent Permissions Audit
  // ============================================================
  describe('Agent Permissions Audit', () => {
    test('getAgentPermissions returns complete permission object', () => {
      const perms = FileAccessGuard.getAgentPermissions('router');
      expect(perms.agentId).toBe('router');
      expect(Array.isArray(perms.read)).toBe(true);
      expect(Array.isArray(perms.write)).toBe(true);
      expect(Array.isArray(perms.deny_always)).toBe(true);
    });

    test('getAgentPermissions returns null for unknown agent', () => {
      const perms = FileAccessGuard.getAgentPermissions('unknown-agent');
      expect(perms).toBeNull();
    });

    test('validateProtectedFilesEnforcement returns no violations', () => {
      const violations = FileAccessGuard.validateProtectedFilesEnforcement();
      expect(violations).toEqual([]);
    });
  });

  // ============================================================
  // Glob Pattern Matching (Edge Cases)
  // ============================================================
  describe('Glob Pattern Matching', () => {
    test('matches wildcard patterns correctly', () => {
      expect(FileAccessGuard.canRead('router', 'src/paperclip/module.js')).toBe(true);
      expect(FileAccessGuard.canRead('router', 'src/deep/nested/module.js')).toBe(true);
      expect(FileAccessGuard.canRead('router', 'logs/2024/app.log')).toBe(true);
    });

    test('normalizes leading ./ in paths', () => {
      expect(FileAccessGuard.canRead('router', './src/test.js')).toBe(true);
      expect(FileAccessGuard.canRead('router', 'src/test.js')).toBe(true);
    });

    test('handles dot files in patterns', () => {
      expect(FileAccessGuard.canRead('skeptic', '.paperclip/task-outputs/file.json')).toBe(true);
    });

    test('denies paths that do not match any pattern', () => {
      expect(FileAccessGuard.canRead('router', 'other-dir/file.txt')).toBe(false);
      expect(FileAccessGuard.canRead('skeptic', 'logs/app.log')).toBe(false);
    });
  });
});
