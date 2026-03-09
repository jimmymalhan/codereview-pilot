/**
 * Paperclip Local Web Server
 *
 * Serves Paperclip pipeline via web UI
 * Run: npm start
 * Open: http://localhost:3000
 */

import 'dotenv/config';
import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { runPipeline } from './local-pipeline.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(express.json());
app.use(express.static(path.join(__dirname, '..', 'public')));

// Check API key
if (!process.env.ANTHROPIC_API_KEY) {
  console.error('\n✗ ANTHROPIC_API_KEY not set');
  console.error('  export ANTHROPIC_API_KEY=sk-ant-...\n');
  process.exit(1);
}

// API: Run diagnosis
app.post('/api/diagnose', async (req, res) => {
  const { incident } = req.body;

  if (!incident || !incident.trim()) {
    return res.status(400).json({ error: 'Incident description required' });
  }

  try {
    const result = await runPipeline(incident);
    res.json(result);
  } catch (error) {
    if (error.message.includes('credit balance')) {
      return res.status(402).json({
        error: 'Insufficient API credits',
        message: 'Please add credits to your Anthropic account at https://console.anthropic.com/account/billing/overview',
        code: 'INSUFFICIENT_CREDITS'
      });
    }
    res.status(500).json({ error: error.message });
  }
});

// Serve index.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '..', 'public', 'index.html'));
});

// Start server
app.listen(PORT, () => {
  console.log(`\n🚀 Paperclip running at http://localhost:${PORT}`);
  console.log(`📊 Open browser to start diagnosing backend failures\n`);
});
