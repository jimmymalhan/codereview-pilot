# MCP & Dependency Status

Verified: 2026-03-09

---

## API Credentials

| Service            | Env Variable                 | Status       | Notes                              |
|--------------------|------------------------------|--------------|------------------------------------|
| Anthropic (Claude) | ANTHROPIC_API_KEY            | NOT SET      | Required for live pipeline demos   |
| Eleven Labs (TTS)  | ELEVENLABS_API_KEY           | NOT SET      | Premium TTS option                 |
| Google Cloud TTS   | GOOGLE_CLOUD_KEY             | NOT SET      | Alternative TTS option             |
| Google Cloud TTS   | GOOGLE_APPLICATION_CREDENTIALS | NOT SET    | gcloud CLI also not installed      |
| GitHub             | gh CLI (keyring)             | VERIFIED     | Authenticated as `jimmymalhan`     |

## Local Tools

| Tool       | Version         | Status       | Notes                              |
|------------|----------------|--------------|------------------------------------|
| Node.js    | v20.9.0        | VERIFIED     | Runtime for server and scripts     |
| npm        | 10.5.0         | VERIFIED     | Package manager                    |
| ffmpeg     | 8.0.1          | VERIFIED     | H.264 encode tested (1080p OK)    |
| gh CLI     | 2.87.3         | VERIFIED     | Scopes: repo, admin:public_key     |
| Express    | (installed)    | VERIFIED     | Server dependency present          |
| macOS say  | (built-in)     | VERIFIED     | 28 en_US voices, file output works |
| Puppeteer  | -              | NOT INSTALLED| Needed for `record-demo.js`        |
| gcloud CLI | -              | NOT INSTALLED| Not needed if using say or ElevenLabs |

## Verified Tests

**ffmpeg encode**: 1-second 1920x1080 H.264/AAC MP4 -- SUCCESS
**macOS say output**: AIFF file from `say -v Samantha` -- SUCCESS (26KB test file)

## GitHub Auth Details

```
Account:  jimmymalhan
Protocol: ssh
Scopes:   admin:public_key, gist, read:org, repo
```

---

## TTS Recommendation

Three TTS options evaluated:

| Option           | Quality    | Cost | Available Now | Setup Required         |
|------------------|------------|------|---------------|------------------------|
| Eleven Labs      | Excellent  | Paid | No            | Set ELEVENLABS_API_KEY |
| Google Cloud TTS | Very Good  | Paid | No            | Install gcloud + key   |
| **macOS say**    | **Good**   | **Free** | **Yes**   | **None**               |

**Recommended path: macOS `say` for POC, Eleven Labs for final.**

Rationale:
1. `say` is available right now with zero setup -- unblocks the POC immediately
2. 28 English (US) voices available; Samantha voice is clean and natural
3. Output to AIFF, convert to WAV/MP3 with ffmpeg (both verified working)
4. For the final production video, upgrade to Eleven Labs for premium quality
5. The script and timing are TTS-engine-agnostic -- swapping voice is a single command change

**POC TTS command:**
```bash
say -v Samantha -o demo/output/narration.aiff "$(cat demo/script-narration.txt)"
ffmpeg -i demo/output/narration.aiff demo/output/narration.wav
```

---

## Summary

| Category           | Verified | Total | Status   |
|--------------------|----------|-------|----------|
| Local tools        | 6        | 8     | PARTIAL  |
| API credentials    | 1        | 5     | PARTIAL  |
| **Total verified** | **7**    | **13**| **PASS** |

7 of 13 dependencies verified. Minimum threshold (3) exceeded.

## Action Items

1. **Set ANTHROPIC_API_KEY** - Required before running live demo pipeline
   ```bash
   export ANTHROPIC_API_KEY=sk-ant-...
   ```

2. **Install Puppeteer** - Required for screen recording automation
   ```bash
   npm install puppeteer --save-dev
   ```

3. **(Optional) Set ELEVENLABS_API_KEY** - For premium TTS in final video
   ```bash
   export ELEVENLABS_API_KEY=...
   ```

4. **(Optional) Install gcloud** - Only if Google Cloud TTS preferred over Eleven Labs
