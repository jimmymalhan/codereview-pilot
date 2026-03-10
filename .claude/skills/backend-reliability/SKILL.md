# Backend Reliability Skill

**Purpose**: Implement and verify production-grade reliability patterns.

**When to use**: Building APIs, handlers, orchestration logic.

## Reliability Checklist

### ✅ Validation
Every API endpoint must:
- [ ] Validate required fields
- [ ] Validate field types
- [ ] Return 400 + message for invalid input
- [ ] Reject unauthorized (403)
- [ ] Return 404 if resource missing
- [ ] Validate state before transitions

Example:
```javascript
// ✅ GOOD: Clear validation
if (!input || typeof input !== 'string') {
  return { error: 'incident_required', message: 'Incident description required', status: 400 };
}
if (input.length < 10) {
  return { error: 'incident_too_short', message: 'Minimum 10 characters', status: 400 };
}

// ❌ BAD: Silent failure
const result = processIncident(input);
```

### ✅ Retries with Exponential Backoff
Every external call must retry on transient errors:

```javascript
// ✅ GOOD: Exponential backoff
const maxRetries = 2;
for (let i = 0; i <= maxRetries; i++) {
  try {
    return await callAPI();
  } catch (err) {
    if (i === maxRetries) throw err;
    const backoffMs = Math.min(1000 * Math.pow(2, i), 8000);
    await sleep(backoffMs);
  }
}

// ❌ BAD: No retry
return await callAPI();
```

### ✅ Timeout Control
All async operations must have timeouts:

```javascript
// ✅ GOOD: Timeout
const timeout = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('timeout')), 60000)
);
return Promise.race([operation, timeout]);

// ❌ BAD: No timeout
return await operation;
```

### ✅ Error Messages
Every error must include:
- Type (error_code_name)
- Message (user-friendly)
- TraceID (for debugging)
- Suggestion (what to do next)
- Retryable flag

```javascript
// ✅ GOOD: Complete error
{
  error: 'api_timeout',
  message: 'The request took too long and was cancelled',
  traceId: 'trace-abc123',
  status: 503,
  suggestion: 'Try again in a few seconds',
  retryable: true,
  retryAfter: 2
}

// ❌ BAD: Incomplete error
{ error: 'timeout' }
```

### ✅ Idempotency
Safe to retry same operation multiple times:

```javascript
// ✅ GOOD: Idempotent
// Unique request ID prevents double-processing
const requestId = generateUUID();
const cached = getResultFromCache(requestId);
if (cached) return cached;

const result = await processTask(requestId);
cacheResult(requestId, result);
return result;

// ❌ BAD: Not idempotent
// Running twice would create duplicate charges
await chargeCustomer(amount);
```

### ✅ Structured Logging
Every critical operation must log with context:

```javascript
// ✅ GOOD: Structured logging
logger.info('diagnosis_started', {
  traceId,
  operation: 'diagnose_incident',
  userId: user.id,
  input: sanitizedInput,
  timestamp: Date.now()
});

// ❌ BAD: No logging
processIncident(input);
```

### ✅ Graceful Degradation
If dependency fails, provide fallback:

```javascript
// ✅ GOOD: Fallback
try {
  return await getRecommendations();
} catch (err) {
  logger.error('recommendations_failed', { err });
  return {
    analysis: 'basic',
    status: 'partial',
    message: 'Recommendations unavailable, showing basic analysis'
  };
}

// ❌ BAD: Cascade failure
const recommendations = await getRecommendations();
return buildFullResponse(recommendations);
```

## Testing Reliability

For each reliability pattern, test it:

### Test: Validation
```javascript
describe('validation', () => {
  it('should reject missing input', () => {
    const result = validate(null);
    expect(result.error).toBe('required');
    expect(result.status).toBe(400);
  });

  it('should reject invalid type', () => {
    const result = validate(123);
    expect(result.error).toBe('invalid_type');
  });
});
```

### Test: Retry Logic
```javascript
describe('retry', () => {
  it('should retry on transient error', async () => {
    let attempts = 0;
    const mock = jest.fn().mockImplementation(() => {
      attempts++;
      if (attempts < 3) throw new Error('transient');
      return { success: true };
    });

    const result = await retryWithBackoff(mock);
    expect(result.success).toBe(true);
    expect(attempts).toBe(3);
  });
});
```

### Test: Timeout
```javascript
describe('timeout', () => {
  it('should timeout after 60 seconds', async () => {
    const slow = () => new Promise(r => setTimeout(r, 100000));
    const result = await withTimeout(slow, 100);
    expect(result.error).toBe('timeout');
  });
});
```

### Test: Idempotency
```javascript
describe('idempotency', () => {
  it('should return same result for duplicate request', async () => {
    const result1 = await process({ requestId: 'id-1' });
    const result2 = await process({ requestId: 'id-1' });
    expect(result1).toEqual(result2);
    expect(result2.fromCache).toBe(true);
  });
});
```

## Common Failure Modes

### ❌ Silent Failures
```javascript
// BAD: Process fails silently
try {
  await sendNotification();
} catch (err) {
  // Ignored!
}
```

**FIX**: Log and return error
```javascript
// GOOD: Errors logged and returned
try {
  await sendNotification();
} catch (err) {
  logger.error('notification_failed', { err });
  return { error: 'notification_failed', retryable: true };
}
```

### ❌ Unbounded Retries
```javascript
// BAD: Could retry forever
while (true) {
  try {
    return await callAPI();
  } catch (err) {
    // Infinite loop!
  }
}
```

**FIX**: Max retries with backoff
```javascript
// GOOD: Limited retries with backoff
for (let i = 0; i <= 2; i++) {
  try {
    return await callAPI();
  } catch (err) {
    if (i === 2) throw err;
    await sleep(1000 * Math.pow(2, i));
  }
}
```

### ❌ No Timeout
```javascript
// BAD: Could hang forever
return await someAsyncOperation();
```

**FIX**: Always set timeout
```javascript
// GOOD: Timeout enforced
const timeout = new Promise((_, reject) =>
  setTimeout(() => reject(new Error('timeout')), 60000)
);
return Promise.race([someAsyncOperation(), timeout]);
```

## Verification

Before claiming "done":
- [ ] All inputs validated
- [ ] All external calls have retry logic
- [ ] All operations have timeout
- [ ] All errors have type, message, trace, suggestion
- [ ] Idempotency key used for unsafe operations
- [ ] Structured logging for critical operations
- [ ] Graceful fallback if dependency fails
- [ ] Tests verify retry behavior
- [ ] Tests verify timeout behavior
- [ ] Tests verify error messages
- [ ] Code review confirms patterns
