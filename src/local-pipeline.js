/**
 * Local Paperclip Pipeline Runner
 *
 * Orchestrates the 4-agent pipeline locally:
 * Incident → Router → Retriever → Skeptic → Verifier
 *
 * Usage:
 *   node src/local-pipeline.js "Your incident description"
 */

import 'dotenv/config';
import Anthropic from '@anthropic-ai/sdk';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const client = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY
});

const AGENTS = {
  router: '.claude/agents/router.md',
  retriever: '.claude/agents/retriever.md',
  skeptic: '.claude/agents/skeptic.md',
  verifier: '.claude/agents/verifier.md'
};

function loadAgent(agentFile) {
  const fullPath = path.join(__dirname, '..', agentFile);
  return fs.readFileSync(fullPath, 'utf-8');
}

async function callAgent(agentName, systemPrompt, userMessage) {
  console.log(`\n🔄 ${agentName.toUpperCase()}`);
  console.log('─'.repeat(60));

  const response = await client.messages.create({
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 2000,
    system: systemPrompt,
    messages: [{ role: 'user', content: userMessage }]
  });

  const output = response.content[0].type === 'text' ? response.content[0].text : '';
  console.log(output);
  return output;
}

export async function runPipeline(incident) {
  console.log('\n╔════════════════════════════════════════════════════════╗');
  console.log('║     Claude Debug Copilot - Local Paperclip Pipeline    ║');
  console.log('╚════════════════════════════════════════════════════════╝');
  console.log(`\n📋 Incident: ${incident}\n`);

  try {
    // 1. ROUTER: Classify failure type
    console.log('STAGE 1: ROUTER - Classify Failure');
    console.log('═'.repeat(60));
    const routerPrompt = loadAgent(AGENTS.router);
    const routerOutput = await callAgent(
      'router',
      routerPrompt,
      incident
    );

    // 2. RETRIEVER: Gather evidence
    console.log('\n\nSTAGE 2: RETRIEVER - Gather Evidence');
    console.log('═'.repeat(60));
    const retrieverPrompt = loadAgent(AGENTS.retriever);
    const retrieverInput = `INCIDENT:\n${incident}\n\nROUTER CLASSIFICATION:\n${routerOutput}`;
    const retrieverOutput = await callAgent(
      'retriever',
      retrieverPrompt,
      retrieverInput
    );

    // 3. SKEPTIC: Challenge diagnosis
    console.log('\n\nSTAGE 3: SKEPTIC - Challenge Diagnosis');
    console.log('═'.repeat(60));
    const skepticPrompt = loadAgent(AGENTS.skeptic);
    const skepticInput = `INCIDENT:\n${incident}\n\nROUTER OUTPUT:\n${routerOutput}\n\nRETRIEVER EVIDENCE:\n${retrieverOutput}`;
    const skepticOutput = await callAgent(
      'skeptic',
      skepticPrompt,
      skepticInput
    );

    // 4. VERIFIER: Validate and produce final diagnosis
    console.log('\n\nSTAGE 4: VERIFIER - Validate & Produce Diagnosis');
    console.log('═'.repeat(60));
    const verifierPrompt = loadAgent(AGENTS.verifier);
    const verifierInput = `INCIDENT:\n${incident}\n\nROUTER:\n${routerOutput}\n\nRETRIEVER:\n${retrieverOutput}\n\nSKEPTIC:\n${skepticOutput}`;
    const verifierOutput = await callAgent(
      'verifier',
      verifierPrompt,
      verifierInput
    );

    // Summary
    console.log('\n\n╔════════════════════════════════════════════════════════╗');
    console.log('║                  DIAGNOSIS COMPLETE                     ║');
    console.log('╚════════════════════════════════════════════════════════╝');

    return {
      incident,
      router: routerOutput,
      retriever: retrieverOutput,
      skeptic: skepticOutput,
      verifier: verifierOutput
    };
  } catch (error) {
    console.error('\n✗ Error:', error.message);
    throw error;
  }
}

// CLI mode
if (import.meta.url === `file://${process.argv[1]}`) {
  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('✗ ANTHROPIC_API_KEY not set');
    console.error('  export ANTHROPIC_API_KEY=your-key');
    process.exit(1);
  }

  const incident = process.argv[2] || 'Database connection pool exhausted, API returns 503';
  runPipeline(incident).catch(() => process.exit(1));
}
