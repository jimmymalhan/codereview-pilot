# E1-01: API Client Architecture - Resilience Pattern

**Task**: Design API client architecture - Resilience pattern
**Status**: ✅ COMPLETE
**Date**: 2026-03-09
**Owner**: API Team (Team 5)
**Depends on**: None (can start immediately)

---

## Architecture Overview

### Goals
1. **Resilience**: Handle network failures, timeouts, rate limits gracefully
2. **Observability**: Clear error messages, logging for debugging
3. **Usability**: Simple API for React components to use
4. **Testability**: Easy to mock and test error scenarios
5. **Performance**: No blocking, proper async handling

---

## API Client Structure

### Module Organization
```
src/www/api/
├── client.js          # Core API client (fetch wrapper)
├── errors.js          # Error types and classification
├── retry.js           # Retry logic with backoff
├── timeout.js         # Timeout management
└── offline-queue.js   # Offline request queueing
```

### Core API Client (`client.js`)
```javascript
// Main export
export const apiClient = {
  diagnose: async (incident, options) => { /* ... */ },
  retry: async (fn, config) => { /* ... */ },
  withTimeout: async (fn, timeoutMs) => { /* ... */ }
}

// Usage
const result = await apiClient.diagnose(incident, {
  timeout: 60000,
  maxRetries: 2,
  onProgress: (update) => { /* ... */ }
})
```

### Error Classification (`errors.js`)
```javascript
export class APIError extends Error {
  constructor(type, message, options = {}) {
    super(message)
    this.type = type                    // 'network', 'timeout', 'validation', 'server', etc
    this.retryable = options.retryable ?? false
    this.retryAfter = options.retryAfter ?? null
    this.suggestion = options.suggestion ?? null
  }
}

export const ERROR_TYPES = {
  NETWORK: 'network',       // Connection refused, unreachable
  TIMEOUT: 'timeout',       // Request took too long
  VALIDATION: 'validation', // 400, invalid input
  AUTH: 'auth',            // 401, 403
  RATE_LIMIT: 'rate_limit', // 429
  SERVER: 'server',        // 5xx
  UNKNOWN: 'unknown'       // Anything else
}
```

### Retry Logic (`retry.js`)
```javascript
export async function retryWithBackoff(fn, config = {}) {
  const {
    maxRetries = 2,
    initialDelayMs = 1000,
    backoffMultiplier = 2,
    maxDelayMs = 8000,
    shouldRetry = () => true,
    onRetry = () => {}
  } = config

  for (let attempt = 0; attempt <= maxRetries; attempt++) {
    try {
      return await fn()
    } catch (error) {
      // No more retries
      if (attempt === maxRetries) throw error

      // Check if error is retryable
      if (!shouldRetry(error)) throw error

      // Calculate delay
      const delay = Math.min(
        initialDelayMs * Math.pow(backoffMultiplier, attempt),
        maxDelayMs
      )

      onRetry({ attempt, delay, error })
      await sleep(delay)
    }
  }
}

export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms))
}
```

### Timeout Management (`timeout.js`)
```javascript
export async function withTimeout(fn, timeoutMs) {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  try {
    return await fn(controller.signal)
  } catch (error) {
    if (error.name === 'AbortError') {
      throw new APIError('timeout', 'Request took too long', {
        retryable: true,
        suggestion: 'Try again or reduce request size'
      })
    }
    throw error
  } finally {
    clearTimeout(timeoutId)
  }
}
```

### Offline Queue (`offline-queue.js`)
```javascript
export class OfflineQueue {
  constructor() {
    this.queue = []
    this.isProcessing = false
    window.addEventListener('online', () => this.process())
  }

  async add(request) {
    this.queue.push(request)
    if (navigator.onLine && !this.isProcessing) {
      await this.process()
    }
  }

  async process() {
    this.isProcessing = true
    while (this.queue.length > 0 && navigator.onLine) {
      const request = this.queue[0]
      try {
        await request.execute()
        this.queue.shift()
      } catch (error) {
        // Keep request in queue, stop processing
        break
      }
    }
    this.isProcessing = false
  }

  clear() {
    this.queue = []
  }
}
```

---

## API Endpoint Contract

### Request Format
```javascript
POST /api/diagnose
Content-Type: application/json

{
  "incident": "string (10-2000 chars)",
  "options": {
    "timeout": 60000,        // optional
    "maxRetries": 2,        // optional
    "onProgress": "function" // callback, not sent
  }
}
```

### Success Response (200)
```javascript
{
  "success": true,
  "data": {
    "router": { /* ... */ },
    "retriever": { /* ... */ },
    "skeptic": { /* ... */ },
    "verifier": { /* ... */ }
  },
  "traceId": "abc-123-def",
  "timestamp": "2026-03-09T20:15:00Z"
}
```

### Error Response (4xx, 5xx)
```javascript
{
  "success": false,
  "error": {
    "type": "server",        // network, timeout, validation, auth, rate_limit, server
    "message": "Server error",
    "code": "INTERNAL_ERROR",
    "retryable": true,
    "retryAfter": 2,        // seconds to wait before retry
    "suggestion": "Try again in a moment"
  },
  "traceId": "abc-123-def",
  "timestamp": "2026-03-09T20:15:00Z"
}
```

---

## Configuration

### Default Configuration
```javascript
export const DEFAULT_CONFIG = {
  // Timeout
  timeout: 60000,         // 60 seconds

  // Retry
  maxRetries: 2,
  retryDelayMs: 1000,     // Start with 1 second
  retryBackoff: 2,        // Double each time (1s, 2s, 4s)
  maxRetryDelayMs: 8000,  // Max 8 seconds

  // Endpoints
  apiBase: '/api',
  diagnoseEndpoint: '/api/diagnose',

  // Offline
  enableOfflineQueue: true,
  maxQueueSize: 100,

  // Callbacks
  onRequest: (config) => {},
  onSuccess: (response) => {},
  onError: (error) => {},
  onRetry: (attempt) => {},
  onProgress: (update) => {},

  // Headers
  headers: {
    'Content-Type': 'application/json'
  }
}
```

### Environment Variables
```
REACT_APP_API_TIMEOUT=60000
REACT_APP_API_RETRIES=2
REACT_APP_API_BASE=/api
```

---

## Error Classification Strategy

### Network Errors (Retryable)
- **Conditions**: Connection refused, timeout, network unreachable
- **Message**: "Network error. Please check your connection and try again."
- **Retryable**: Yes (exponential backoff)
- **User Action**: Retry or check internet connection

### Timeout Errors (Retryable)
- **Conditions**: Request took >60 seconds
- **Message**: "Request took too long. Please try again."
- **Retryable**: Yes (after delay)
- **User Action**: Retry or try with simpler input

### Validation Errors (Not Retryable)
- **Conditions**: 400, malformed input
- **Message**: "Invalid input: [field name]. [guidance]"
- **Retryable**: No
- **User Action**: Fix input and try again

### Rate Limit Errors (Retryable)
- **Conditions**: 429 (too many requests)
- **Message**: "Too many requests. Please wait a moment and try again."
- **Retryable**: Yes (with backoff, respect Retry-After header)
- **User Action**: Wait and retry

### Auth Errors (Not Retryable)
- **Conditions**: 401, 403
- **Message**: "Permission denied. Please check your credentials."
- **Retryable**: No
- **User Action**: Log in again or contact support

### Server Errors (Retryable)
- **Conditions**: 5xx (internal server error)
- **Message**: "Server error. Please try again in a moment."
- **Retryable**: Yes (exponential backoff)
- **User Action**: Retry or contact support

---

## Usage in React Components

### Basic Usage
```javascript
import { apiClient } from './api/client'

export function DiagnosisForm() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [results, setResults] = useState(null)

  const handleSubmit = async (incident) => {
    setLoading(true)
    setError(null)

    try {
      const result = await apiClient.diagnose(incident)
      setResults(result)
    } catch (err) {
      setError(err)
    } finally {
      setLoading(false)
    }
  }

  // ... render form
}
```

### With Progress Tracking
```javascript
const handleSubmit = async (incident) => {
  setLoading(true)

  try {
    const result = await apiClient.diagnose(incident, {
      onProgress: (update) => {
        setProgress(update.progress)      // 0-100%
        setStage(update.stage)            // router, retriever, skeptic, verifier
      }
    })
    setResults(result)
  } catch (err) {
    setError(err)
  }
}
```

### With Manual Retry
```javascript
const handleRetry = async () => {
  if (error && error.retryable) {
    try {
      const result = await apiClient.diagnose(lastIncident, {
        maxRetries: 2
      })
      setResults(result)
      setError(null)
    } catch (err) {
      setError(err)
    }
  }
}
```

---

## Testing Strategy

### Test Coverage
- ✅ Network error simulation (mock fetch rejection)
- ✅ Timeout simulation (mock AbortError)
- ✅ Retry logic (verify 2-3 retries work)
- ✅ Exponential backoff timing
- ✅ Error classification (all error types)
- ✅ Offline queue (add, process, clear)
- ✅ React component integration

### Mock Strategy
```javascript
// Mock fetch for testing
global.fetch = jest.fn()

// Test network error
fetch.mockRejectedValueOnce(new Error('Network error'))

// Test timeout
fetch.mockImplementationOnce(() => {
  return new Promise((resolve, reject) => {
    setTimeout(() => reject(new Error('AbortError')), 100)
  })
})

// Test successful response
fetch.mockResolvedValueOnce({
  ok: true,
  json: () => ({ data: { /* ... */ } })
})
```

---

## Design Decisions

### Decision 1: Single Client vs. Per-Request
**Chosen**: Single client instance (singleton pattern)
- Pros: Shared configuration, consistent behavior
- Cons: May need to create instances for testing

### Decision 2: Where to Classify Errors
**Chosen**: In error class constructor and dedicated error.js module
- Pros: Centralized, reusable
- Cons: Slightly more code

### Decision 3: Retry Inside Client vs. Component
**Chosen**: Client handles automatic retries, component handles user-requested retries
- Pros: Clear separation, component in control
- Cons: Slightly more complex

### Decision 4: Offline Queue
**Chosen**: Optional, disabled by default
- Pros: Advanced feature, not needed for MVP
- Cons: May want to enable for mobile

---

## Next Steps

### E1-02: Implement Basic API Client
- Implement fetch wrapper
- Basic request/response handling
- Error propagation

### E1-03: Add Timeout Handling
- Implement AbortController
- Timeout error detection

### E1-04: Add Retry Logic
- Implement exponential backoff
- Configurable retry count

### E1-05: Classify Errors
- Implement error type system
- User-friendly messages

### E1-07: Test API Client
- Unit tests for all components
- Mock failures
- Verify retry behavior

---

## Sign-Off

✅ **E1-01 Complete**
- API client architecture designed
- Module organization planned
- Error classification strategy defined
- Retry logic with exponential backoff planned
- Timeout management strategy defined
- Offline queue strategy defined (optional)
- Configuration defaults set
- React component usage patterns documented
- Testing strategy defined

**Key Architecture Decision**: Single API client instance with modular error handling, retry logic, and timeout protection. Supports progress tracking and offline queueing.
