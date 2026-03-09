# Screen Recording Guide

Recording setup for the Claude Debug Copilot 15-second demo video.

---

## Prerequisites

1. **Server running**: `npm start` (port 3000)
2. **Puppeteer installed**: `npm install puppeteer --save-dev`
3. **Recording software**: OBS Studio (free) or ScreenFlow (macOS)

---

## Quality Standards

| Setting         | Required    | Notes                            |
|-----------------|-------------|----------------------------------|
| Resolution      | 1920x1080   | Full HD, 16:9 aspect ratio       |
| Frame rate      | 30 fps min  | 60 fps preferred for smoothness  |
| Video codec     | H.264       | Wide compatibility               |
| Audio codec     | AAC 128kbps | For TTS narration overlay        |
| Bitrate         | 8-12 Mbps   | High quality without bloat       |
| Format          | MP4          | Final delivery format             |
| Color           | sRGB        | Standard web colors              |
| Browser zoom    | 100%        | No scaling artifacts             |

---

## OBS Studio Setup

### 1. Install and launch OBS Studio

Download from https://obsproject.com

### 2. Create a new Scene

- Scene name: `debug-copilot-demo`

### 3. Add Window Capture source

- Source type: Window Capture
- Window: Chrome - Claude Debug Copilot
- Capture method: Automatic

### 4. Configure Output Settings

```
Settings > Output > Recording:
  Recording path:  demo/output/
  Recording format: mp4
  Encoder:         x264
  Rate control:    CBR
  Bitrate:         10000 Kbps

Settings > Video:
  Base resolution:   1920x1080
  Output resolution: 1920x1080
  FPS:               30 (or 60)
```

### 5. Audio (disable during capture)

```
Settings > Audio:
  Desktop Audio: Disabled
  Mic/Aux:       Disabled
```

Audio (TTS narration) is added in post-production.

### 6. Recording Workflow

```
1. Start OBS recording
2. Run: node demo/scripts/record-demo.js --slow
3. Wait for automation to complete
4. Stop OBS recording
5. Raw footage saved to demo/output/
```

---

## ScreenFlow Setup (macOS)

### 1. New Recording

- Record Desktop: Selected display
- Record Computer Audio: Off
- Record Microphone: Off

### 2. Capture Area

- Set to 1920x1080 fixed region
- Center on Chrome window

### 3. Quality Settings

```
Export > Custom:
  Resolution: 1920x1080
  Frame rate: 30 fps
  Codec:      H.264
  Quality:    Best (ProRes for editing, H.264 for final)
```

### 4. Recording Workflow

Same as OBS: start recording, run automation script, stop recording.

---

## Automation Script Usage

### Basic run (browser closes after)

```bash
node demo/scripts/record-demo.js
```

### Keep browser open for manual recording

```bash
node demo/scripts/record-demo.js --slow
```

### Headless mode (screenshots only, no visible browser)

```bash
node demo/scripts/record-demo.js --headless
```

### What the script produces

Screenshots saved to `demo/output/`:

| File                    | Scene | Content                         |
|-------------------------|-------|---------------------------------|
| 01-title.png            | 1     | Landing page                    |
| 02-incident-typed.png   | 2     | Form with incident text         |
| 03-diagnose-clicked.png | 2     | Loading spinner active          |
| 04-pipeline-running.png | 3     | Pipeline in progress            |
| 05-pipeline-complete.png| 3     | All stages complete             |
| 06-results-visible.png  | 4     | Results panel                   |
| 07-verifier-confidence.png | 4  | Confidence score visible        |
| 08-orchestration.png    | 4     | Governance panel                |
| 09-final-frame.png      | 4     | Final held frame                |

---

## Recording Checklist

Before recording:

- [ ] Server running (`npm start`, verify http://localhost:3000)
- [ ] API key set and has credits (`ANTHROPIC_API_KEY`)
- [ ] Chrome at 100% zoom, no extensions visible
- [ ] No notifications or overlays on screen
- [ ] OBS/ScreenFlow configured at 1920x1080, 30+ fps
- [ ] Desktop clean (no personal files visible)
- [ ] Dark/light mode consistent (default light theme)

During recording:

- [ ] Start screen recorder FIRST
- [ ] Wait 2 seconds, then run automation script
- [ ] Do not move mouse or interact during automation
- [ ] Let script run to completion (watch console for "Complete")
- [ ] Wait 2 seconds after completion
- [ ] Stop screen recorder

After recording:

- [ ] Verify footage is 1920x1080
- [ ] Verify no dropped frames (check OBS stats)
- [ ] Review screenshots match expected scenes
- [ ] Trim 2-second padding from start and end
- [ ] Raw footage ready for post-production
