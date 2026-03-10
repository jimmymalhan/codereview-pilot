/**
 * Custom Skills Module
 *
 * Exports all custom skills, the BaseSkill abstract class, and the
 * SkillRegistry singleton for registration and discovery.
 */

import { BaseSkill } from './base-skill.js';
import { SkillRegistry } from './skill-registry.js';
import { DataValidator } from './data-validator.js';
import { RequestFormatter } from './request-formatter.js';
import { ResponseParser } from './response-parser.js';
import { MetricsAnalyzer } from './metrics-analyzer.js';
import { ChangeDetector } from './change-detector.js';

export {
  BaseSkill,
  SkillRegistry,
  DataValidator,
  RequestFormatter,
  ResponseParser,
  MetricsAnalyzer,
  ChangeDetector
};

/**
 * Register all built-in skills with the global SkillRegistry.
 *
 * @returns {SkillRegistry} The populated registry instance
 */
export function registerAllSkills() {
  const registry = SkillRegistry.getInstance();

  registry.register('DataValidator', new DataValidator(), {
    tags: ['validation', 'data', 'schema'],
    overwrite: true
  });

  registry.register('RequestFormatter', new RequestFormatter(), {
    tags: ['api', 'request', 'formatting'],
    overwrite: true
  });

  registry.register('ResponseParser', new ResponseParser(), {
    tags: ['api', 'response', 'parsing'],
    overwrite: true
  });

  registry.register('MetricsAnalyzer', new MetricsAnalyzer(), {
    tags: ['metrics', 'analysis', 'time-series'],
    overwrite: true
  });

  registry.register('ChangeDetector', new ChangeDetector(), {
    tags: ['diff', 'change-tracking', 'versioning'],
    overwrite: true
  });

  return registry;
}

/**
 * Skill Factory for easy instantiation.
 */
export class SkillFactory {
  /**
   * Create a new skill instance by name.
   *
   * @param {string} skillName - Name of the skill class
   * @param {object} [options] - Options to pass to the constructor
   * @returns {BaseSkill} Skill instance
   * @throws {Error} If the skill name is not recognized
   */
  static create(skillName, options = {}) {
    const skillClasses = {
      DataValidator,
      RequestFormatter,
      ResponseParser,
      MetricsAnalyzer,
      ChangeDetector
    };

    const SkillClass = skillClasses[skillName];
    if (!SkillClass) {
      throw new Error(`Unknown skill: ${skillName}. Available: ${Object.keys(skillClasses).join(', ')}`);
    }

    return new SkillClass(options);
  }

  /**
   * List all available skill names.
   *
   * @returns {string[]}
   */
  static listAvailable() {
    return ['DataValidator', 'RequestFormatter', 'ResponseParser', 'MetricsAnalyzer', 'ChangeDetector'];
  }
}

export default SkillFactory;
