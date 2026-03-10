import { jest } from '@jest/globals';
import { BaseSkill } from '../src/custom-skills/base-skill.js';
import { SkillRegistry } from '../src/custom-skills/skill-registry.js';
import { DataValidator } from '../src/custom-skills/data-validator.js';
import { RequestFormatter } from '../src/custom-skills/request-formatter.js';
import { ResponseParser } from '../src/custom-skills/response-parser.js';
import { MetricsAnalyzer } from '../src/custom-skills/metrics-analyzer.js';
import { ChangeDetector } from '../src/custom-skills/change-detector.js';
import { SkillFactory, registerAllSkills } from '../src/custom-skills/index.js';

// ─────────────────────────────────────────────────────────────────────────────
// BaseSkill Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('BaseSkill', () => {
  test('should not be instantiable directly', () => {
    expect(() => new BaseSkill()).toThrow('BaseSkill is abstract');
  });

  test('should allow subclassing', () => {
    class TestSkill extends BaseSkill {
      validate(input) { return { valid: true, errors: [] }; }
      _execute(input) { return input; }
    }
    const skill = new TestSkill({ name: 'Test', description: 'A test', version: '0.1.0' });
    expect(skill.name).toBe('Test');
    expect(skill.description).toBe('A test');
    expect(skill.version).toBe('0.1.0');
  });

  test('should default name to class name', () => {
    class MySkill extends BaseSkill {
      validate() { return { valid: true, errors: [] }; }
      _execute() { return null; }
    }
    const skill = new MySkill();
    expect(skill.name).toBe('MySkill');
  });

  test('execute() returns success result on valid input', () => {
    class AddSkill extends BaseSkill {
      validate(input) {
        const errors = [];
        if (typeof input !== 'object' || !Array.isArray(input.numbers)) {
          errors.push({ field: 'numbers', message: 'Must provide numbers array' });
        }
        return { valid: errors.length === 0, errors };
      }
      _execute(input) {
        return { sum: input.numbers.reduce((a, b) => a + b, 0) };
      }
    }
    const skill = new AddSkill({ name: 'Add' });
    const result = skill.execute({ numbers: [1, 2, 3] });
    expect(result.success).toBe(true);
    expect(result.data.sum).toBe(6);
    expect(result.errors).toHaveLength(0);
    expect(result.metadata.skill).toBe('Add');
    expect(result.metadata.executionTimeMs).toBeLessThan(100);
  });

  test('execute() returns failure on invalid input', () => {
    class StrictSkill extends BaseSkill {
      validate(input) {
        return { valid: false, errors: [{ field: 'input', message: 'bad' }] };
      }
      _execute() { return null; }
    }
    const result = new StrictSkill().execute('anything');
    expect(result.success).toBe(false);
    expect(result.data).toBeNull();
    expect(result.errors).toHaveLength(1);
  });

  test('execute() catches exceptions in _execute gracefully', () => {
    class FailSkill extends BaseSkill {
      validate() { return { valid: true, errors: [] }; }
      _execute() { throw new Error('boom'); }
    }
    const result = new FailSkill().execute({});
    expect(result.success).toBe(false);
    expect(result.errors[0].message).toBe('boom');
  });

  test('describe() returns skill descriptor', () => {
    class DescSkill extends BaseSkill {
      validate() { return { valid: true, errors: [] }; }
      _execute() { return null; }
    }
    const desc = new DescSkill({ name: 'Desc', description: 'Describes things', version: '2.0.0' }).describe();
    expect(desc.name).toBe('Desc');
    expect(desc.description).toBe('Describes things');
    expect(desc.version).toBe('2.0.0');
    expect(desc.inputSchema).toBeDefined();
    expect(desc.outputSchema).toBeDefined();
  });

  test('getInputSchema returns default', () => {
    class S extends BaseSkill {
      validate() { return { valid: true, errors: [] }; }
      _execute() { return null; }
    }
    expect(new S().getInputSchema().type).toBe('any');
  });

  test('getOutputSchema returns default', () => {
    class S extends BaseSkill {
      validate() { return { valid: true, errors: [] }; }
      _execute() { return null; }
    }
    const schema = new S().getOutputSchema();
    expect(schema.properties.success).toBe('boolean');
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// SkillRegistry Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('SkillRegistry', () => {
  beforeEach(() => {
    SkillRegistry.reset();
  });

  test('should be a singleton', () => {
    const a = SkillRegistry.getInstance();
    const b = SkillRegistry.getInstance();
    expect(a).toBe(b);
  });

  test('constructor also returns singleton', () => {
    const a = new SkillRegistry();
    const b = new SkillRegistry();
    expect(a).toBe(b);
  });

  test('register and retrieve a skill', () => {
    const registry = SkillRegistry.getInstance();
    const skill = new DataValidator();
    registry.register('DataValidator', skill);
    expect(registry.get('DataValidator')).toBe(skill);
    expect(registry.has('DataValidator')).toBe(true);
  });

  test('register throws on empty name', () => {
    const registry = SkillRegistry.getInstance();
    expect(() => registry.register('', new DataValidator())).toThrow('non-empty string');
  });

  test('register throws on non-BaseSkill', () => {
    const registry = SkillRegistry.getInstance();
    expect(() => registry.register('fake', {})).toThrow('must be an instance of BaseSkill');
  });

  test('register throws on duplicate without overwrite', () => {
    const registry = SkillRegistry.getInstance();
    registry.register('DV', new DataValidator());
    expect(() => registry.register('DV', new DataValidator())).toThrow('already registered');
  });

  test('register allows overwrite with option', () => {
    const registry = SkillRegistry.getInstance();
    const v1 = new DataValidator();
    const v2 = new DataValidator();
    registry.register('DV', v1);
    registry.register('DV', v2, { overwrite: true });
    expect(registry.get('DV')).toBe(v2);
  });

  test('unregister removes a skill', () => {
    const registry = SkillRegistry.getInstance();
    registry.register('DV', new DataValidator());
    expect(registry.unregister('DV')).toBe(true);
    expect(registry.has('DV')).toBe(false);
  });

  test('unregister returns false for missing skill', () => {
    const registry = SkillRegistry.getInstance();
    expect(registry.unregister('nope')).toBe(false);
  });

  test('list returns registered names', () => {
    const registry = SkillRegistry.getInstance();
    registry.register('A', new DataValidator());
    registry.register('B', new RequestFormatter());
    expect(registry.list()).toEqual(['A', 'B']);
  });

  test('listDetailed includes descriptions and tags', () => {
    const registry = SkillRegistry.getInstance();
    registry.register('DV', new DataValidator(), { tags: ['validation'] });
    const detailed = registry.listDetailed();
    expect(detailed).toHaveLength(1);
    expect(detailed[0].name).toBe('DataValidator');
    expect(detailed[0].tags).toEqual(['validation']);
  });

  test('findByTag returns matching skills', () => {
    const registry = SkillRegistry.getInstance();
    registry.register('DV', new DataValidator(), { tags: ['validation', 'data'] });
    registry.register('RF', new RequestFormatter(), { tags: ['api'] });
    const results = registry.findByTag('validation');
    expect(results).toHaveLength(1);
    expect(results[0].name).toBe('DV');
  });

  test('findByTag returns empty for unknown tag', () => {
    const registry = SkillRegistry.getInstance();
    expect(registry.findByTag('nonexistent')).toHaveLength(0);
  });

  test('execute runs a registered skill', () => {
    const registry = SkillRegistry.getInstance();
    registry.register('CD', new ChangeDetector());
    const result = registry.execute('CD', { before: 'a', after: 'b' });
    expect(result.success).toBe(true);
    expect(result.data.modified).toHaveLength(1);
  });

  test('execute throws for unregistered skill', () => {
    const registry = SkillRegistry.getInstance();
    expect(() => registry.execute('missing', {})).toThrow('not registered');
  });

  test('size returns correct count', () => {
    const registry = SkillRegistry.getInstance();
    expect(registry.size).toBe(0);
    registry.register('DV', new DataValidator());
    expect(registry.size).toBe(1);
  });

  test('reset clears all registrations', () => {
    const registry = SkillRegistry.getInstance();
    registry.register('DV', new DataValidator());
    SkillRegistry.reset();
    const fresh = SkillRegistry.getInstance();
    expect(fresh.size).toBe(0);
  });

  test('register supports chaining', () => {
    const registry = SkillRegistry.getInstance();
    const result = registry
      .register('A', new DataValidator())
      .register('B', new RequestFormatter());
    expect(result).toBe(registry);
    expect(registry.size).toBe(2);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// registerAllSkills() and SkillFactory Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('registerAllSkills', () => {
  beforeEach(() => {
    SkillRegistry.reset();
  });

  test('registers all 5 built-in skills', () => {
    const registry = registerAllSkills();
    expect(registry.size).toBe(5);
    expect(registry.has('DataValidator')).toBe(true);
    expect(registry.has('RequestFormatter')).toBe(true);
    expect(registry.has('ResponseParser')).toBe(true);
    expect(registry.has('MetricsAnalyzer')).toBe(true);
    expect(registry.has('ChangeDetector')).toBe(true);
  });

  test('registered skills are executable', () => {
    const registry = registerAllSkills();
    const result = registry.execute('ChangeDetector', { before: 'hello', after: 'world' });
    expect(result.success).toBe(true);
  });

  test('can call registerAllSkills multiple times safely', () => {
    registerAllSkills();
    const registry = registerAllSkills();
    expect(registry.size).toBe(5);
  });
});

describe('SkillFactory', () => {
  test('creates DataValidator', () => {
    const skill = SkillFactory.create('DataValidator');
    expect(skill).toBeInstanceOf(DataValidator);
  });

  test('creates all available skills', () => {
    for (const name of SkillFactory.listAvailable()) {
      const skill = SkillFactory.create(name);
      expect(skill).toBeInstanceOf(BaseSkill);
    }
  });

  test('throws for unknown skill', () => {
    expect(() => SkillFactory.create('Unknown')).toThrow('Unknown skill');
  });

  test('listAvailable returns 5 skills', () => {
    expect(SkillFactory.listAvailable()).toHaveLength(5);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// DataValidator execute() Interface Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('DataValidator execute() interface', () => {
  let validator;
  beforeEach(() => { validator = new DataValidator(); });

  test('execute with { data, rules } for primitive validation', () => {
    const result = validator.execute({ data: 42, rules: [{ type: 'number' }] });
    expect(result.success).toBe(true);
    expect(result.data.valid).toBe(true);
  });

  test('execute with { object, schema } for structural validation', () => {
    const result = validator.execute({
      object: { name: 'test' },
      schema: { name: [{ type: 'string' }] }
    });
    expect(result.success).toBe(true);
    expect(result.data.valid).toBe(true);
  });

  test('execute fails on invalid structured input', () => {
    const result = validator.execute(null);
    expect(result.success).toBe(false);
  });

  test('describe returns schema info', () => {
    const desc = validator.describe();
    expect(desc.name).toBe('DataValidator');
    expect(desc.inputSchema.properties.data).toBeDefined();
    expect(desc.outputSchema.properties.valid).toBe('boolean');
  });

  test('getInputSchema has expected properties', () => {
    const schema = validator.getInputSchema();
    expect(schema.properties.rules).toBeDefined();
    expect(schema.properties.schema).toBeDefined();
  });

  test('performance: execute completes under 100ms', () => {
    const start = performance.now();
    validator.execute({ data: 'test', rules: [{ type: 'string' }, { minLength: 1 }, { maxLength: 100 }] });
    expect(performance.now() - start).toBeLessThan(100);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// RequestFormatter Extended Tests (cURL, formData, execute interface)
// ─────────────────────────────────────────────────────────────────────────────

describe('RequestFormatter extended', () => {
  let formatter;
  beforeEach(() => { formatter = new RequestFormatter(); });

  test('format parses cURL command', () => {
    const result = formatter.format("curl -X POST https://api.example.com/data -H 'Content-Type: application/json' -d '{\"key\":\"val\"}'");
    expect(result.method).toBe('POST');
    expect(result.url).toBe('https://api.example.com/data');
    expect(result.headers['Content-Type']).toBe('application/json');
    expect(result.body).toEqual({ key: 'val' });
  });

  test('format parses cURL GET with no body', () => {
    const result = formatter.format('curl https://api.example.com/users');
    expect(result.method).toBe('GET');
    expect(result.url).toBe('https://api.example.com/users');
  });

  test('format parses cURL with --request flag', () => {
    const result = formatter.format('curl --request DELETE https://api.example.com/item/1');
    expect(result.method).toBe('DELETE');
  });

  test('format parses form data input', () => {
    const result = formatter.format({
      formData: { username: 'test', password: 'secret' },
      url: '/login'
    });
    expect(result.method).toBe('POST');
    expect(result.url).toBe('/login');
    expect(result.headers['Content-Type']).toBe('application/x-www-form-urlencoded');
    expect(result.body.username).toBe('test');
  });

  test('execute works through BaseSkill interface', () => {
    const result = formatter.execute('GET /api/users HTTP/1.1\nHost: example.com');
    expect(result.success).toBe(true);
    expect(result.data.method).toBe('GET');
    expect(result.data.url).toBe('/api/users');
  });

  test('execute fails on null input', () => {
    const result = formatter.execute(null);
    expect(result.success).toBe(false);
    expect(result.errors[0].field).toBe('input');
  });

  test('execute fails on number input', () => {
    const result = formatter.execute(42);
    expect(result.success).toBe(false);
  });

  test('validate returns valid for string input', () => {
    const v = formatter.validate('GET /');
    expect(v.valid).toBe(true);
  });

  test('validate returns valid for object input', () => {
    const v = formatter.validate({ method: 'GET', url: '/' });
    expect(v.valid).toBe(true);
  });

  test('describe includes format info', () => {
    const desc = formatter.describe();
    expect(desc.name).toBe('RequestFormatter');
    expect(desc.inputSchema.description).toContain('cURL');
  });

  test('performance: format completes under 100ms', () => {
    const start = performance.now();
    formatter.format("curl -X POST https://api.example.com -d '{}'");
    expect(performance.now() - start).toBeLessThan(100);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ResponseParser CSV Parsing and execute() Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('ResponseParser CSV and extended', () => {
  let parser;
  beforeEach(() => { parser = new ResponseParser(); });

  test('parses CSV response body', () => {
    const response = {
      status: 200,
      headers: { 'Content-Type': 'text/csv' },
      body: 'name,age,city\nAlice,30,NYC\nBob,25,LA'
    };
    const result = parser.parse(response);
    expect(result.contentType).toBe('text/csv');
    expect(result.parsed.headers).toEqual(['name', 'age', 'city']);
    expect(result.parsed.rows).toHaveLength(2);
    expect(result.parsed.rows[0].name).toBe('Alice');
    expect(result.parsed.rows[0].age).toBe('30');
    expect(result.parsed.rows[1].city).toBe('LA');
    expect(result.parsed.rowCount).toBe(2);
  });

  test('parses CSV with quoted fields', () => {
    const response = {
      status: 200,
      headers: { 'Content-Type': 'text/csv' },
      body: 'name,description\n"Smith, John","A ""great"" person"'
    };
    const result = parser.parse(response);
    expect(result.parsed.rows[0].name).toBe('Smith, John');
    expect(result.parsed.rows[0].description).toBe('A "great" person');
  });

  test('parses empty CSV', () => {
    const response = {
      status: 200,
      headers: { 'Content-Type': 'text/csv' },
      body: ''
    };
    const result = parser.parse(response);
    expect(result.parsed).toBeNull();
  });

  test('parses CSV with only headers', () => {
    const response = {
      status: 200,
      headers: { 'Content-Type': 'text/csv' },
      body: 'name,age,city'
    };
    const result = parser.parse(response);
    expect(result.parsed.headers).toEqual(['name', 'age', 'city']);
    expect(result.parsed.rows).toHaveLength(0);
    expect(result.parsed.rowCount).toBe(0);
  });

  test('parses application/csv content type', () => {
    const response = {
      status: 200,
      headers: { 'Content-Type': 'application/csv' },
      body: 'a,b\n1,2'
    };
    const result = parser.parse(response);
    expect(result.parsed.headers).toEqual(['a', 'b']);
  });

  test('execute works through BaseSkill interface', () => {
    const result = parser.execute({
      response: {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
        body: '{"ok":true}'
      }
    });
    expect(result.success).toBe(true);
    expect(result.data.parsed.ok).toBe(true);
  });

  test('execute works with raw string', () => {
    const result = parser.execute('HTTP/1.1 200 OK\nContent-Type: application/json\n\n{"ok":true}');
    expect(result.success).toBe(true);
    expect(result.data.status).toBe(200);
  });

  test('execute fails on null', () => {
    const result = parser.execute(null);
    expect(result.success).toBe(false);
  });

  test('validate returns errors on number input', () => {
    const v = parser.validate(42);
    expect(v.valid).toBe(false);
  });

  test('describe returns schema', () => {
    const desc = parser.describe();
    expect(desc.name).toBe('ResponseParser');
    expect(desc.outputSchema.properties.contentType).toBe('string');
  });

  test('performance: parse completes under 100ms', () => {
    const start = performance.now();
    parser.parse({ status: 200, headers: { 'Content-Type': 'text/csv' }, body: 'a,b\n1,2\n3,4' });
    expect(performance.now() - start).toBeLessThan(100);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// MetricsAnalyzer execute() Interface Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('MetricsAnalyzer execute() interface', () => {
  let analyzer;
  const sampleData = [
    { timestamp: '2024-01-01', value: 10 },
    { timestamp: '2024-01-02', value: 20 },
    { timestamp: '2024-01-03', value: 30 },
    { timestamp: '2024-01-04', value: 40 },
    { timestamp: '2024-01-05', value: 50 }
  ];

  beforeEach(() => { analyzer = new MetricsAnalyzer(); });

  test('execute with array input', () => {
    const result = analyzer.execute(sampleData);
    expect(result.success).toBe(true);
    expect(result.data.count).toBe(5);
    expect(result.data.mean).toBe(30);
    expect(result.data.trend).toBe('increasing');
  });

  test('execute with { data } input', () => {
    const result = analyzer.execute({ data: sampleData });
    expect(result.success).toBe(true);
    expect(result.data.count).toBe(5);
  });

  test('execute with compare', () => {
    const before = [
      { timestamp: '1', value: 10 },
      { timestamp: '2', value: 20 },
      { timestamp: '3', value: 30 }
    ];
    const after = [
      { timestamp: '4', value: 50 },
      { timestamp: '5', value: 60 },
      { timestamp: '6', value: 70 }
    ];
    const result = analyzer.execute({ data: before, compareTo: after });
    expect(result.success).toBe(true);
    expect(result.data.degraded).toBe(true);
  });

  test('execute fails on empty array', () => {
    const result = analyzer.execute([]);
    expect(result.success).toBe(false);
  });

  test('execute fails on too few points', () => {
    const result = analyzer.execute([{ value: 1 }, { value: 2 }]);
    expect(result.success).toBe(false);
  });

  test('execute fails on null', () => {
    const result = analyzer.execute(null);
    expect(result.success).toBe(false);
  });

  test('describe returns schema', () => {
    const desc = analyzer.describe();
    expect(desc.name).toBe('MetricsAnalyzer');
    expect(desc.outputSchema.properties.trend).toBe('string');
  });

  test('performance: execute completes under 100ms', () => {
    const data = Array.from({ length: 500 }, (_, i) => ({ timestamp: `${i}`, value: Math.random() * 100 }));
    const start = performance.now();
    analyzer.execute(data);
    expect(performance.now() - start).toBeLessThan(100);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// ChangeDetector execute() Interface Tests
// ─────────────────────────────────────────────────────────────────────────────

describe('ChangeDetector execute() interface', () => {
  let detector;
  beforeEach(() => { detector = new ChangeDetector(); });

  test('execute with text diff', () => {
    const result = detector.execute({ before: 'line1\nline2', after: 'line1\nline3' });
    expect(result.success).toBe(true);
    expect(result.data.modified).toHaveLength(1);
    expect(result.data.modified[0].before).toBe('line2');
    expect(result.data.modified[0].after).toBe('line3');
  });

  test('execute with structural diff', () => {
    const result = detector.execute({
      beforeObj: { a: 1, b: 2, c: 3 },
      afterObj: { a: 1, b: 99, d: 4 }
    });
    expect(result.success).toBe(true);
    expect(result.data.added).toHaveLength(1);
    expect(result.data.removed).toHaveLength(1);
    expect(result.data.modified).toHaveLength(1);
  });

  test('execute fails on missing before/after', () => {
    const result = detector.execute({ before: 'text' });
    expect(result.success).toBe(false);
  });

  test('execute fails on non-string text', () => {
    const result = detector.execute({ before: 123, after: 456 });
    expect(result.success).toBe(false);
  });

  test('execute fails on null', () => {
    const result = detector.execute(null);
    expect(result.success).toBe(false);
  });

  test('validate returns valid for proper text input', () => {
    const v = detector.validate({ before: 'a', after: 'b' });
    expect(v.valid).toBe(true);
  });

  test('validate returns valid for proper structural input', () => {
    const v = detector.validate({ beforeObj: {}, afterObj: {} });
    expect(v.valid).toBe(true);
  });

  test('validate returns error for non-object input', () => {
    const v = detector.validate('string');
    expect(v.valid).toBe(false);
  });

  test('describe returns schema', () => {
    const desc = detector.describe();
    expect(desc.name).toBe('ChangeDetector');
    expect(desc.outputSchema.properties.summary).toBe('string');
  });

  test('performance: execute completes under 100ms', () => {
    const lines = Array.from({ length: 500 }, (_, i) => `line ${i}`);
    const before = lines.join('\n');
    const after = lines.map((l, i) => i % 10 === 0 ? l + ' modified' : l).join('\n');
    const start = performance.now();
    detector.execute({ before, after });
    expect(performance.now() - start).toBeLessThan(100);
  });
});

// ─────────────────────────────────────────────────────────────────────────────
// Composability Tests - Skills working together
// ─────────────────────────────────────────────────────────────────────────────

describe('Skill Composability', () => {
  test('validate request, format, and parse response in pipeline', () => {
    const validator = new DataValidator();
    const formatter = new RequestFormatter();
    const parser = new ResponseParser();

    // Step 1: Validate input
    const validResult = validator.execute({
      data: 'GET /api/data HTTP/1.1',
      rules: [{ type: 'string' }, { minLength: 1 }]
    });
    expect(validResult.success).toBe(true);

    // Step 2: Format the request
    const fmtResult = formatter.execute('GET /api/data HTTP/1.1\nHost: example.com');
    expect(fmtResult.success).toBe(true);
    expect(fmtResult.data.method).toBe('GET');

    // Step 3: Parse a mock response
    const parseResult = parser.execute({
      response: { status: 200, headers: { 'Content-Type': 'application/json' }, body: '{"items":[1,2,3]}' }
    });
    expect(parseResult.success).toBe(true);
    expect(parseResult.data.parsed.items).toEqual([1, 2, 3]);
  });

  test('analyze metrics then detect changes between periods', () => {
    const analyzer = new MetricsAnalyzer();
    const detector = new ChangeDetector();

    const beforeData = [
      { timestamp: '1', value: 100 },
      { timestamp: '2', value: 110 },
      { timestamp: '3', value: 105 }
    ];
    const afterData = [
      { timestamp: '4', value: 200 },
      { timestamp: '5', value: 210 },
      { timestamp: '6', value: 205 }
    ];

    const compareResult = analyzer.execute({ data: beforeData, compareTo: afterData });
    expect(compareResult.success).toBe(true);
    expect(compareResult.data.degraded).toBe(true);

    // Detect structural changes between the stats
    const diffResult = detector.execute({
      beforeObj: { mean: compareResult.data.before.mean, trend: compareResult.data.before.trend },
      afterObj: { mean: compareResult.data.after.mean, trend: compareResult.data.after.trend }
    });
    expect(diffResult.success).toBe(true);
    expect(diffResult.data.modified.length).toBeGreaterThan(0);
  });

  test('registry execute composes with factory create', () => {
    SkillRegistry.reset();
    const registry = registerAllSkills();

    const validationResult = registry.execute('DataValidator', {
      data: 'test-string',
      rules: [{ type: 'string' }, { pattern: '^test' }]
    });
    expect(validationResult.success).toBe(true);
    expect(validationResult.data.valid).toBe(true);
  });
});
