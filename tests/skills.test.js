import { jest } from '@jest/globals';
import { EvidenceVerifier } from '../src/skills/evidence-verifier.js';
import { HallucinationDetector } from '../src/skills/hallucination-detector.js';
import { ConfidenceScorer } from '../src/skills/confidence-scorer.js';
import { existsSync } from 'fs';
import { resolve } from 'path';

// Use the actual project root so file-existence checks work against real files
const REPO_ROOT = process.cwd();

// ─── EvidenceVerifier ────────────────────────────────────────────────────────

describe('EvidenceVerifier', () => {
  let verifier;

  beforeEach(() => {
    verifier = new EvidenceVerifier({ repoRoot: REPO_ROOT });
  });

  describe('constructor', () => {
    it('defaults repoRoot to cwd', () => {
      const v = new EvidenceVerifier();
      expect(v.repoRoot).toBe(process.cwd());
    });

    it('accepts custom repoRoot', () => {
      const v = new EvidenceVerifier({ repoRoot: '/tmp' });
      expect(v.repoRoot).toBe('/tmp');
    });
  });

  describe('verify', () => {
    it('throws when claims is not an array', () => {
      expect(() => verifier.verify('bad')).toThrow('Claims must be an array');
      expect(() => verifier.verify(null)).toThrow('Claims must be an array');
      expect(() => verifier.verify(42)).toThrow('Claims must be an array');
    });

    it('returns valid for empty claims array', () => {
      const result = verifier.verify([]);
      expect(result).toEqual({ valid: true, totalClaims: 0, issues: [] });
    });

    it('validates a correct claim with existing file', () => {
      const claims = [{
        text: 'The package.json defines project metadata',
        citation: 'package.json:1',
        timestamp: '2026-01-15T10:00:00Z'
      }];
      const result = verifier.verify(claims);
      expect(result.valid).toBe(true);
      expect(result.totalClaims).toBe(1);
      expect(result.issues).toHaveLength(0);
    });

    it('flags null claim', () => {
      const result = verifier.verify([null]);
      expect(result.valid).toBe(false);
      expect(result.issues).toEqual([
        { claimIndex: 0, field: 'claim', message: 'Claim must be a non-null object' }
      ]);
    });

    it('flags non-object claim', () => {
      const result = verifier.verify(['string-claim']);
      expect(result.valid).toBe(false);
      expect(result.issues[0].field).toBe('claim');
    });

    it('flags missing text', () => {
      const result = verifier.verify([{ citation: 'package.json:1' }]);
      expect(result.issues.some(i => i.field === 'text')).toBe(true);
    });

    it('flags empty text', () => {
      const result = verifier.verify([{ text: '  ', citation: 'package.json:1' }]);
      expect(result.issues.some(i => i.field === 'text')).toBe(true);
    });

    it('flags missing citation', () => {
      const result = verifier.verify([{ text: 'some claim' }]);
      expect(result.issues.some(i => i.field === 'citation' && i.message === 'Citation is missing')).toBe(true);
    });

    it('flags non-string citation', () => {
      const result = verifier.verify([{ text: 'claim', citation: 123 }]);
      expect(result.issues.some(i => i.field === 'citation')).toBe(true);
    });

    it('flags invalid citation format (no line)', () => {
      const result = verifier.verify([{ text: 'claim', citation: 'just-a-file' }]);
      expect(result.issues.some(i => i.message.includes('does not match file:line format'))).toBe(true);
    });

    it('flags non-existent file in citation', () => {
      const result = verifier.verify([{
        text: 'claim',
        citation: 'non/existent/file.js:10'
      }]);
      expect(result.issues.some(i => i.message.includes('does not exist'))).toBe(true);
    });

    it('flags invalid timestamp format', () => {
      const result = verifier.verify([{
        text: 'claim',
        citation: 'package.json:1',
        timestamp: 'not-a-date'
      }]);
      expect(result.issues.some(i => i.field === 'timestamp')).toBe(true);
    });

    it('accepts date-only timestamp', () => {
      const result = verifier.verify([{
        text: 'claim',
        citation: 'package.json:1',
        timestamp: '2026-01-15'
      }]);
      expect(result.issues.filter(i => i.field === 'timestamp')).toHaveLength(0);
    });

    it('accepts full ISO-8601 with offset', () => {
      const result = verifier.verify([{
        text: 'claim',
        citation: 'package.json:1',
        timestamp: '2026-01-15T10:30:00+05:30'
      }]);
      expect(result.issues.filter(i => i.field === 'timestamp')).toHaveLength(0);
    });

    it('accepts ISO-8601 with milliseconds', () => {
      const result = verifier.verify([{
        text: 'claim',
        citation: 'package.json:1',
        timestamp: '2026-01-15T10:30:00.123Z'
      }]);
      expect(result.issues.filter(i => i.field === 'timestamp')).toHaveLength(0);
    });

    it('skips timestamp validation when not present', () => {
      const result = verifier.verify([{
        text: 'claim',
        citation: 'package.json:1'
      }]);
      expect(result.issues.filter(i => i.field === 'timestamp')).toHaveLength(0);
    });

    it('reports multiple issues per claim', () => {
      const result = verifier.verify([{
        text: '',
        citation: 'bad-format',
        timestamp: 'nope'
      }]);
      expect(result.issues.length).toBeGreaterThanOrEqual(3);
    });

    it('handles multiple claims', () => {
      const claims = [
        { text: 'good', citation: 'package.json:1' },
        { text: '', citation: 'missing.js:1' }
      ];
      const result = verifier.verify(claims);
      expect(result.totalClaims).toBe(2);
      expect(result.valid).toBe(false);
    });
  });
});

// ─── HallucinationDetector ───────────────────────────────────────────────────

describe('HallucinationDetector', () => {
  let detector;
  const schema = {
    user: {
      fields: ['id', 'email', 'name'],
      types: { id: 'number', email: 'string', name: 'string' }
    },
    order: {
      fields: ['id', 'total', 'status'],
      types: { id: 'number', total: 'number', status: 'string' }
    }
  };
  const knownAPIs = [
    'GET /api/users',
    'POST /api/users',
    'GET /api/orders/*'
  ];

  beforeEach(() => {
    detector = new HallucinationDetector({
      repoRoot: REPO_ROOT,
      schema,
      knownAPIs
    });
  });

  describe('constructor', () => {
    it('defaults repoRoot to cwd', () => {
      const d = new HallucinationDetector();
      expect(d.repoRoot).toBe(process.cwd());
    });

    it('defaults schema to null', () => {
      const d = new HallucinationDetector();
      expect(d.schema).toBeNull();
    });

    it('defaults knownAPIs to empty array', () => {
      const d = new HallucinationDetector();
      expect(d.knownAPIs).toEqual([]);
    });
  });

  describe('detect', () => {
    it('throws when claims is not an array', () => {
      expect(() => detector.detect('bad')).toThrow('Claims must be an array');
      expect(() => detector.detect(null)).toThrow('Claims must be an array');
    });

    it('returns zero risk for empty claims', () => {
      const result = detector.detect([]);
      expect(result).toEqual({ riskScore: 0.0, totalClaims: 0, flaggedClaims: 0, details: [] });
    });

    it('returns zero risk for claims with no checkable fields', () => {
      const result = detector.detect([{ text: 'just a plain claim' }]);
      expect(result.riskScore).toBe(0);
      expect(result.flaggedClaims).toBe(0);
    });

    it('flags invalid claim (not object)', () => {
      const result = detector.detect([null, 'string']);
      expect(result.flaggedClaims).toBe(2);
      expect(result.details).toHaveLength(2);
      expect(result.details[0].type).toBe('invalid');
    });

    // Field checks
    it('passes valid field reference', () => {
      const result = detector.detect([{ text: 'x', referencedField: 'user.email' }]);
      expect(result.flaggedClaims).toBe(0);
    });

    it('flags field with no entity prefix', () => {
      const result = detector.detect([{ text: 'x', referencedField: 'email' }]);
      expect(result.details[0].type).toBe('unknown_field');
      expect(result.details[0].message).toContain('no entity prefix');
    });

    it('flags unknown entity', () => {
      const result = detector.detect([{ text: 'x', referencedField: 'product.name' }]);
      expect(result.details[0].type).toBe('unknown_entity');
    });

    it('flags unknown field on known entity', () => {
      const result = detector.detect([{ text: 'x', referencedField: 'user.phone' }]);
      expect(result.details[0].type).toBe('unknown_field');
      expect(result.details[0].message).toContain('does not exist on entity');
    });

    it('skips field check when no schema', () => {
      const d = new HallucinationDetector({ repoRoot: REPO_ROOT });
      const result = d.detect([{ text: 'x', referencedField: 'fake.field' }]);
      expect(result.flaggedClaims).toBe(0);
    });

    // API checks
    it('passes known API', () => {
      const result = detector.detect([{ text: 'x', referencedAPI: 'GET /api/users' }]);
      expect(result.flaggedClaims).toBe(0);
    });

    it('passes API matching wildcard', () => {
      const result = detector.detect([{ text: 'x', referencedAPI: 'GET /api/orders/123' }]);
      expect(result.flaggedClaims).toBe(0);
    });

    it('flags unknown API', () => {
      const result = detector.detect([{ text: 'x', referencedAPI: 'DELETE /api/users' }]);
      expect(result.details[0].type).toBe('unknown_api');
    });

    it('skips API check when no knownAPIs', () => {
      const d = new HallucinationDetector({ repoRoot: REPO_ROOT });
      const result = d.detect([{ text: 'x', referencedAPI: 'DELETE /anything' }]);
      expect(result.flaggedClaims).toBe(0);
    });

    // Function signature checks
    it('flags missing file in signature', () => {
      const result = detector.detect([{
        text: 'x',
        functionSignature: { name: 'foo' }
      }]);
      expect(result.details[0].type).toBe('invalid_signature');
    });

    it('flags missing name in signature', () => {
      const result = detector.detect([{
        text: 'x',
        functionSignature: { file: 'package.json' }
      }]);
      expect(result.details[0].type).toBe('invalid_signature');
    });

    it('flags non-existent file in signature', () => {
      const result = detector.detect([{
        text: 'x',
        functionSignature: { file: 'no-such-file.js', name: 'foo' }
      }]);
      expect(result.details[0].type).toBe('missing_file');
    });

    it('flags function not found in file', () => {
      const result = detector.detect([{
        text: 'x',
        functionSignature: { file: 'package.json', name: 'nonExistentFunction' }
      }]);
      expect(result.details[0].type).toBe('missing_function');
    });

    it('passes when function exists in file', () => {
      // escapeRegExp exists in hallucination-detector.js
      const result = detector.detect([{
        text: 'x',
        functionSignature: { file: 'src/skills/hallucination-detector.js', name: 'escapeRegExp' }
      }]);
      expect(result.flaggedClaims).toBe(0);
    });

    it('detects param count mismatch', () => {
      // escapeRegExp(str) has 1 param, we claim 3
      const result = detector.detect([{
        text: 'x',
        functionSignature: {
          file: 'src/skills/hallucination-detector.js',
          name: 'escapeRegExp',
          params: ['a', 'b', 'c']
        }
      }]);
      expect(result.details[0].type).toBe('param_mismatch');
    });

    it('passes correct param count', () => {
      const result = detector.detect([{
        text: 'x',
        functionSignature: {
          file: 'src/skills/hallucination-detector.js',
          name: 'escapeRegExp',
          params: ['str']
        }
      }]);
      expect(result.flaggedClaims).toBe(0);
    });

    // Data type checks
    it('passes correct data type', () => {
      const result = detector.detect([{
        text: 'x',
        dataType: { field: 'user.email', expectedType: 'string' }
      }]);
      expect(result.flaggedClaims).toBe(0);
    });

    it('flags wrong data type', () => {
      const result = detector.detect([{
        text: 'x',
        dataType: { field: 'user.id', expectedType: 'string' }
      }]);
      expect(result.details[0].type).toBe('type_mismatch');
    });

    it('flags missing field or expectedType in dataType', () => {
      const result = detector.detect([{
        text: 'x',
        dataType: { field: 'user.id' }
      }]);
      expect(result.details[0].type).toBe('invalid_type_claim');
    });

    it('skips data type check when no schema', () => {
      const d = new HallucinationDetector({ repoRoot: REPO_ROOT });
      const result = d.detect([{
        text: 'x',
        dataType: { field: 'user.id', expectedType: 'boolean' }
      }]);
      expect(result.flaggedClaims).toBe(0);
    });

    it('skips data type check for field with no entity prefix', () => {
      const result = detector.detect([{
        text: 'x',
        dataType: { field: 'id', expectedType: 'number' }
      }]);
      expect(result.flaggedClaims).toBe(0);
    });

    it('skips data type check when entity has no types', () => {
      const d = new HallucinationDetector({
        repoRoot: REPO_ROOT,
        schema: { thing: { fields: ['a'] } }
      });
      const result = d.detect([{
        text: 'x',
        dataType: { field: 'thing.a', expectedType: 'string' }
      }]);
      expect(result.flaggedClaims).toBe(0);
    });

    // Risk score calculation
    it('computes correct risk score', () => {
      const result = detector.detect([
        { text: 'ok' },
        { text: 'x', referencedField: 'user.phone' }, // flagged
        { text: 'y', referencedAPI: 'DELETE /nope' }   // flagged
      ]);
      // 2 flagged out of 3
      expect(result.riskScore).toBeCloseTo(0.67, 1);
      expect(result.flaggedClaims).toBe(2);
    });

    it('caps risk score at 1.0', () => {
      // All claims flagged
      const result = detector.detect([null, null, null]);
      expect(result.riskScore).toBe(1.0);
    });
  });
});

// ─── ConfidenceScorer ────────────────────────────────────────────────────────

describe('ConfidenceScorer', () => {
  let scorer;

  beforeEach(() => {
    scorer = new ConfidenceScorer({ repoRoot: REPO_ROOT });
  });

  describe('constructor', () => {
    it('creates default sub-skills', () => {
      expect(scorer.evidenceVerifier).toBeInstanceOf(EvidenceVerifier);
      expect(scorer.hallucinationDetector).toBeInstanceOf(HallucinationDetector);
    });

    it('accepts injected sub-skills', () => {
      const ev = new EvidenceVerifier();
      const hd = new HallucinationDetector();
      const s = new ConfidenceScorer({ evidenceVerifier: ev, hallucinationDetector: hd });
      expect(s.evidenceVerifier).toBe(ev);
      expect(s.hallucinationDetector).toBe(hd);
    });
  });

  describe('score', () => {
    it('throws on null input', () => {
      expect(() => scorer.score(null)).toThrow('Input must be a valid object');
    });

    it('throws on non-object input', () => {
      expect(() => scorer.score('bad')).toThrow('Input must be a valid object');
    });

    it('returns score with defaults when minimal input given', () => {
      const result = scorer.score({ baseScore: 0.7, claims: [] });
      expect(result.confidence).toBe(0.7);
      expect(result.baseScore).toBe(0.7);
      expect(result.evidenceBonus).toBe(0);
      expect(result.hallucinationPenalty).toBe(0);
      expect(result.contradictionPenalty).toBe(0);
      expect(result.breakdown).toContain('0.7');
    });

    it('defaults baseScore to 0.5 when missing', () => {
      const result = scorer.score({ claims: [] });
      expect(result.baseScore).toBe(0.5);
    });

    it('clamps baseScore to [0,1]', () => {
      const r1 = scorer.score({ baseScore: 1.5, claims: [] });
      expect(r1.baseScore).toBe(1);

      const r2 = scorer.score({ baseScore: -0.5, claims: [] });
      expect(r2.baseScore).toBe(0);
    });

    it('adds evidence bonus for valid claims', () => {
      const result = scorer.score({
        baseScore: 0.5,
        claims: [
          { text: 'good claim', citation: 'package.json:1' }
        ]
      });
      // valid claim = 1/1 * 0.25 = 0.25 bonus
      expect(result.evidenceBonus).toBeCloseTo(0.25, 2);
      expect(result.confidence).toBeGreaterThan(0.5);
    });

    it('applies hallucination penalty when claims are flagged', () => {
      // Use a detector with schema so fields get checked
      const hd = new HallucinationDetector({
        repoRoot: REPO_ROOT,
        schema: { user: { fields: ['id'] } }
      });
      const s = new ConfidenceScorer({
        repoRoot: REPO_ROOT,
        hallucinationDetector: hd
      });

      const result = s.score({
        baseScore: 0.8,
        claims: [
          { text: 'claim', citation: 'package.json:1', referencedField: 'user.nonexistent' }
        ]
      });
      // riskScore = 1.0, penalty = 1.0 * 0.35 = 0.35
      expect(result.hallucinationPenalty).toBeCloseTo(0.35, 2);
    });

    it('applies contradiction penalty', () => {
      const result = scorer.score({
        baseScore: 0.8,
        claims: [],
        contradictions: [
          { description: 'A vs B', resolved: false },
          { description: 'C vs D', resolved: true }
        ]
      });
      // 1 unresolved / 2 total * 0.20 = 0.10
      expect(result.contradictionPenalty).toBeCloseTo(0.10, 2);
    });

    it('no contradiction penalty when all resolved', () => {
      const result = scorer.score({
        baseScore: 0.8,
        claims: [],
        contradictions: [
          { description: 'A vs B', resolved: true }
        ]
      });
      expect(result.contradictionPenalty).toBe(0);
    });

    it('clamps final confidence to [0,1]', () => {
      // High base + bonus should not exceed 1
      const result = scorer.score({
        baseScore: 0.95,
        claims: [
          { text: 'good', citation: 'package.json:1' }
        ]
      });
      expect(result.confidence).toBeLessThanOrEqual(1);
      expect(result.confidence).toBeGreaterThanOrEqual(0);
    });

    it('returns evidence and hallucination reports', () => {
      const result = scorer.score({
        baseScore: 0.5,
        claims: [{ text: 'claim', citation: 'package.json:1' }]
      });
      expect(result.evidenceReport).toBeDefined();
      expect(result.evidenceReport.totalClaims).toBe(1);
      expect(result.hallucinationReport).toBeDefined();
      expect(result.hallucinationReport.totalClaims).toBe(1);
    });

    it('returns human-readable breakdown', () => {
      const result = scorer.score({ baseScore: 0.5, claims: [] });
      expect(typeof result.breakdown).toBe('string');
      expect(result.breakdown).toContain('=');
    });

    it('handles claims with no contradictions key', () => {
      const result = scorer.score({ baseScore: 0.6, claims: [] });
      expect(result.contradictionPenalty).toBe(0);
    });

    it('achieves 85%+ confidence for well-evidenced input', () => {
      const result = scorer.score({
        baseScore: 0.75,
        claims: [
          { text: 'claim 1', citation: 'package.json:1' },
          { text: 'claim 2', citation: 'jest.config.js:1' }
        ],
        contradictions: []
      });
      expect(result.confidence).toBeGreaterThanOrEqual(0.85);
    });
  });

  describe('_clamp', () => {
    it('clamps below min', () => {
      expect(scorer._clamp(-1, 0, 1)).toBe(0);
    });

    it('clamps above max', () => {
      expect(scorer._clamp(2, 0, 1)).toBe(1);
    });

    it('returns value in range', () => {
      expect(scorer._clamp(0.5, 0, 1)).toBe(0.5);
    });
  });
});
