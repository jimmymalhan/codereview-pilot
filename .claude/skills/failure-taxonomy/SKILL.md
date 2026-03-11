---
name: failure-taxonomy
description: Categorize failures. Learn patterns. Reduce recurrence via feedback-loop.
---

# Failure Taxonomy Skill

**Principle**: Every failure has a category. Track frequency. Feed into checklists to prevent recurrence.

## Categories

| Category | Examples |
|----------|----------|
| test_failure | npm test fails |
| build_failure | Compile error |
| lint_failure | ESLint, Prettier |
| api_error | 4xx, 5xx |
| timeout | Operation exceeded limit |
| secret_exposed | Commit blocked |
| conflict | Git merge conflict |
| rate_limit | 429 |
| unknown | Unclassified |

## Tracking

- **File**: `.claude/local/failures/taxonomy.json`
- **Format**: `{ category: count, last_seen, prevention_added }`
- **On failure**: Increment count; if count > 2 → add to feedback-loop prevention

## Output

```json
{
  "category": "test_failure",
  "count_this_session": 1,
  "count_all_time": 5,
  "prevention": "Run npm test after each file edit",
  "add_to_checklist": true
}
```

## Integration

- **circuit-breaker**: On open, log category
- **feedback-loop**: High-count categories get preventive checklist items
- **error-detector**: Map to taxonomy category
