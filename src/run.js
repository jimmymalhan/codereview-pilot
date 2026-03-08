import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'

const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })

const result = await client.messages.create({
  model: 'claude-haiku-4-5-20251001',
  max_tokens: 1200,
  messages: [
    {
      role: 'user',
      content: `
You are the verifier.
Reject unsupported claims.
Return strict JSON with:
- verdict
- missing_evidence
- unsafe_claims
- next_step
`
    }
  ]
})

console.log(JSON.stringify(result, null, 2))
