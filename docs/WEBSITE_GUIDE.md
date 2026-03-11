# Integration Website User Guide

Interactive website for exploring the CodeReview-Pilot debugging pipeline, skills, agents, and MCP integrations.

## Getting Started

```bash
npm install
npm run demo
```

Open **http://localhost:3000** in your browser.

## Pages

### Home (`/`)

Project overview page with:
- 5-agent pipeline diagram showing Router, Retriever, Skeptic, Verifier, and Critic flow
- Feature highlight cards for Skills, MCP, Agents, and Tests
- Repository statistics (file count, line count, agent/skill counts)
- Quick links to all other pages

### Pipeline (`/pipeline`)

Interactive pipeline visualizer demonstrating the 5-agent debugging flow.

**Features:**
- 6 pre-built incident scenarios (Database Pool, Memory Leak, Auth Failure, DNS Cache, Write Conflict, Custom)
- Play/Pause/Step/Reset controls for stepping through the pipeline
- Real-time animated state transitions between agents
- Evidence flow visualization showing data passed between agents
- Confidence score progression display

**Usage:**
1. Select an incident scenario from the dropdown
2. Click "Play" to run the full pipeline, or "Step" to advance one agent at a time
3. Watch evidence flow from Router through to Verifier
4. Review the final diagnosis with root cause, fix plan, and confidence score

### Skills (`/skills`)

Live interactive demos for the three core quality-scoring skills.

**Evidence Verifier:**
- Input file:line citations and claims
- Validates whether evidence files exist and citations match
- Returns verification status with detailed results

**Hallucination Detector:**
- Input entity names, API endpoints, or schema fields
- Detects invented fields, tables, APIs, regions, or files
- Returns list of hallucinated vs verified entities

**Confidence Scorer:**
- Input a diagnosis with evidence array
- Calculates confidence score using the formula: base evidence score + skeptic agreement - hallucination penalty
- Returns score breakdown with pass/fail against 0.70 threshold

### MCP (`/mcp`)

Model Context Protocol integration dashboard with 4 context providers.

**Providers:**
- **Repo Context** - Repository structure, file listings, code snippets
- **Log Context** - Log file search, filtering, timestamp correlation
- **Schema Context** - Database schema definitions, field types, relationships
- **Metrics Context** - CPU, memory, connection pool, error rate metrics

**Usage:**
1. Select a provider from the tabs
2. Enter a query (e.g., file path, log search term, table name)
3. View the structured context response

### Agents (`/agents`)

Browse all 9 agent definitions with their capabilities and constraints.

**Core Agents (5):**
- Router - Failure classification into 6 families
- Retriever - Evidence gathering with file:line citations
- Skeptic - Competing theory generation from different failure family
- Verifier - Claim validation and approval gate
- Critic - Quality gate enforcement (confidence >= 0.70)

**Custom Agents (4):**
- DataAnalyst - Data exploration and pattern analysis
- SecurityAuditor - Security vulnerability scanning
- PerformanceOptimizer - Performance bottleneck detection
- ComplianceChecker - Regulatory compliance checking

### Tests (`/tests`)

Test dashboard showing:
- Total test count (547+) with pass/fail breakdown
- Coverage metrics (94%+ overall)
- Test categorization by suite (orchestrator, skills, agents, MCP, e2e)
- Individual test results with timing

### Docs (`/docs`)

Documentation hub with links to:
- **Integration Guide** (`docs/INTEGRATION_GUIDE.md`) - Complete setup and usage
- **Custom Skills API** (`docs/CUSTOM_SKILLS_API.md`) - Build custom skills
- **Custom Agents API** (`docs/CUSTOM_AGENTS_API.md`) - Build custom agents

## Troubleshooting

### Website won't start

```bash
# Check Node.js version (need 18+)
node --version

# Reinstall dependencies
rm -rf node_modules
npm install

# Start the server
npm run demo
```

### Port 3000 in use

```bash
# Find and kill the process using port 3000
lsof -i :3000
kill -9 <PID>

# Or use a different port
PORT=3001 npm run demo
```

### Pages not loading / blank screen

- Check browser console for JavaScript errors
- Verify the server is running (look for startup banner in terminal)
- Try a hard refresh (Cmd+Shift+R or Ctrl+Shift+R)

### API endpoints returning errors

- Ensure the server started without errors
- Check that all dependencies are installed (`npm install`)
- Verify no syntax errors in source files (`node --check src/demo-server.js`)

### Pipeline not animating

- The pipeline requires selecting a scenario first
- Click "Play" or "Step" to start the animation
- If stuck, click "Reset" and try again

## Performance

- All pages target < 2 second load time
- API endpoints target < 500ms response time
- Responsive design works on mobile and desktop
- No external CDN dependencies -- all assets served locally
