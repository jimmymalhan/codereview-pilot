---
name: property-based-testing
description: Generative input testing. Edge cases beyond hand-written. Use when adding tests.
---

# Property-Based Testing Skill

**Principle**: Properties hold for all inputs. Generate random inputs. Find edge cases.

## When to Use

- Adding tests for validation logic
- Testing API with variable payloads
- Testing parsers, formatters

## Properties

| Property | Example |
|----------|---------|
| Idempotent | parse(serialize(x)) === x |
| Bounds | length(output) <= length(input) * K |
| No crash | For any string, no throw |
| Round-trip | encode(decode(x)) === x |

## Implementation

- **Library**: fast-check (JS), hypothesis (Python) if available
- **Fallback**: Generate 10–50 random variants manually (lengths: 0, 1, 1000, unicode, empty)
- **Output**: `{ property, passed: boolean, failing_input: if any }`

## Integration

- **qa-engineer**: Suggest property-based when testing validators
- **ChaosTester**: Complements with fuzz; property-based for invariants
- **evidence-proof**: Include property results in confidence
