/**
 * SkillRegistry - Singleton registry for skill registration and discovery.
 *
 * Manages the lifecycle of custom skills, enabling registration,
 * lookup, listing, and removal. Enforces that registered skills
 * extend BaseSkill.
 */

import { BaseSkill } from './base-skill.js';

/** @type {SkillRegistry|null} */
let instance = null;

export class SkillRegistry {
  constructor() {
    if (instance) {
      return instance;
    }
    /** @type {Map<string, BaseSkill>} */
    this._skills = new Map();
    /** @type {Map<string, string[]>} */
    this._tags = new Map();
    instance = this;
  }

  /**
   * Get the singleton instance.
   *
   * @returns {SkillRegistry}
   */
  static getInstance() {
    if (!instance) {
      instance = new SkillRegistry();
    }
    return instance;
  }

  /**
   * Reset the singleton (primarily for testing).
   */
  static reset() {
    if (instance) {
      instance._skills.clear();
      instance._tags.clear();
    }
    instance = null;
  }

  /**
   * Register a skill instance.
   *
   * @param {string} name - Unique skill name
   * @param {BaseSkill} skill - Skill instance (must extend BaseSkill)
   * @param {object} [options] - Registration options
   * @param {string[]} [options.tags] - Tags for categorization
   * @param {boolean} [options.overwrite] - Allow overwriting existing registration
   * @returns {SkillRegistry} this (for chaining)
   * @throws {Error} If name is empty, skill is not a BaseSkill, or name already registered
   */
  register(name, skill, options = {}) {
    if (!name || typeof name !== 'string') {
      throw new Error('Skill name must be a non-empty string');
    }

    if (!(skill instanceof BaseSkill)) {
      throw new Error(`Skill "${name}" must be an instance of BaseSkill`);
    }

    if (this._skills.has(name) && !options.overwrite) {
      throw new Error(`Skill "${name}" is already registered. Use { overwrite: true } to replace.`);
    }

    this._skills.set(name, skill);

    if (options.tags && Array.isArray(options.tags)) {
      this._tags.set(name, options.tags);
    }

    return this;
  }

  /**
   * Unregister a skill by name.
   *
   * @param {string} name - Skill name to remove
   * @returns {boolean} True if the skill was found and removed
   */
  unregister(name) {
    this._tags.delete(name);
    return this._skills.delete(name);
  }

  /**
   * Retrieve a registered skill by name.
   *
   * @param {string} name - Skill name
   * @returns {BaseSkill|undefined}
   */
  get(name) {
    return this._skills.get(name);
  }

  /**
   * Check if a skill is registered.
   *
   * @param {string} name - Skill name
   * @returns {boolean}
   */
  has(name) {
    return this._skills.has(name);
  }

  /**
   * List all registered skill names.
   *
   * @returns {string[]}
   */
  list() {
    return Array.from(this._skills.keys());
  }

  /**
   * List all registered skills with their descriptions.
   *
   * @returns {Array<object>} Array of skill descriptors
   */
  listDetailed() {
    return Array.from(this._skills.entries()).map(([name, skill]) => ({
      name,
      ...skill.describe(),
      tags: this._tags.get(name) || []
    }));
  }

  /**
   * Find skills by tag.
   *
   * @param {string} tag - Tag to search for
   * @returns {Array<{name: string, skill: BaseSkill}>}
   */
  findByTag(tag) {
    const results = [];
    this._tags.forEach((tags, name) => {
      if (tags.includes(tag)) {
        results.push({ name, skill: this._skills.get(name) });
      }
    });
    return results;
  }

  /**
   * Execute a named skill with the given input.
   *
   * @param {string} name - Registered skill name
   * @param {*} input - Input to pass to the skill
   * @param {object} [context] - Optional execution context
   * @returns {object} Skill execution result
   * @throws {Error} If the skill is not registered
   */
  execute(name, input, context = {}) {
    const skill = this._skills.get(name);
    if (!skill) {
      throw new Error(`Skill "${name}" is not registered`);
    }
    return skill.execute(input, context);
  }

  /**
   * Return the count of registered skills.
   *
   * @returns {number}
   */
  get size() {
    return this._skills.size;
  }
}

export default SkillRegistry;
