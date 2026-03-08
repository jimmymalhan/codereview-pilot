# API Key Handoff Procedure (SC-3)

## Current State (Local Orchestration)

Since Paperclip is not an external service, the API key handoff is straightforward:

1. **ANTHROPIC_API_KEY** resides in local `.env` (source of truth)
2. `src/run.js` and `AgentWrapper` read from `process.env.ANTHROPIC_API_KEY`
3. Key is NEVER:
   - Logged to any file or console
   - Included in audit trail entries
   - Passed as content in agent prompts
   - Stored in any `.paperclip/` file
   - Committed to git (`.env` is in `.gitignore`)

## Key Rotation (Current)

1. Update ANTHROPIC_API_KEY value in `.env`
2. Restart the application process
3. Old key is immediately unused

## Key Revocation (Current)

1. Remove ANTHROPIC_API_KEY from `.env`
2. Restart the application process
3. All agent invocations will fail immediately with authentication error

## Future External Paperclip Integration

If a real Paperclip service becomes available:

1. **Envelope encryption**: Encrypt ANTHROPIC_API_KEY with Paperclip's RSA public key before transmission
2. **At-rest encryption**: Verify Paperclip stores key using AES-256-GCM per Security Specification section 1.2
3. **Transport**: TLS 1.3 minimum per Security Specification section 1.1
4. **Certificate pinning**: Pin Paperclip API leaf certificate
5. **Rotation**: 30-day automated rotation with 14-day advance notification
6. **Revocation**: Immediate invalidation via Paperclip API call
7. **Audit**: Key access events logged (but key value never logged)

## Verification

- [ ] Search all logs for key material patterns (`sk-*`): expect zero matches
- [ ] Search audit-logger.js output for API key: expect zero matches
- [ ] Verify `.env` is in `.gitignore`
- [ ] Verify no hardcoded keys in source code
