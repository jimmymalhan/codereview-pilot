# Claude Debug Copilot - Demo Video POC

## Overview

Proof-of-concept pipeline for producing a demo video of the Claude Debug Copilot product. The pipeline is orchestrated by a multi-agent team, each responsible for a stage of production.

## Agents

| Agent | Role |
|-------|------|
| script-writer | Write narration script and scene breakdowns |
| audio-engineer | Generate or source audio, manage TTS |
| video-editor | Assemble footage, transitions, captions |
| qa-tester | Review final output for quality and accuracy |

## Directory Structure

```
demo/
  scripts/   - Shell scripts, ffmpeg commands
  assets/    - Graphics, captions, static media
  output/    - Final rendered video (git-ignored)
  mcp/       - MCP configs and pipeline status
```

## Status

POC in progress.

## Next Steps

1. Finalize narration script
2. Record or generate audio
3. Capture screen recordings of the product
4. Assemble video with captions and transitions
5. QA review and iterate
