/**
 * Custom Skills Registry
 *
 * Reusable skills that can be used across projects for data validation,
 * API interaction, and analysis tasks.
 */

export { DataValidator } from './data-validator.js';
export { RequestFormatter } from './request-formatter.js';
export { ResponseParser } from './response-parser.js';
export { MetricsAnalyzer } from './metrics-analyzer.js';
export { ChangeDetector } from './change-detector.js';

/**
 * Skill Factory for easy instantiation
 */
export class SkillFactory {
  static create(skillName, options = {}) {
    const skills = {
      DataValidator: () => require('./data-validator.js').DataValidator,
      RequestFormatter: () => require('./request-formatter.js').RequestFormatter,
      ResponseParser: () => require('./response-parser.js').ResponseParser,
      MetricsAnalyzer: () => require('./metrics-analyzer.js').MetricsAnalyzer,
      ChangeDetector: () => require('./change-detector.js').ChangeDetector
    };

    if (!skills[skillName]) {
      throw new Error(`Unknown skill: ${skillName}`);
    }

    const SkillClass = skills[skillName]();
    return new SkillClass(options);
  }

  static listAvailable() {
    return ['DataValidator', 'RequestFormatter', 'ResponseParser', 'MetricsAnalyzer', 'ChangeDetector'];
  }
}

export default SkillFactory;
