# Screen Recording Report

## Recording Method

Two-step capture pipeline using macOS native tools:

1. **screencapture -V** (macOS built-in) - Captures screen at native retina resolution (3024x1964) as `.mov`
2. **ffmpeg** (Homebrew, v8.0.1) - Scales to 1080p and encodes as H.264 `.mp4`

This approach was chosen over direct ffmpeg AVFoundation capture because `screencapture` has reliable screen recording permissions on macOS, while ffmpeg's `avfoundation` screen device hangs due to permission/API compatibility issues on macOS Sequoia.

## Test Recording Results

| Property | Value |
|----------|-------|
| Resolution | 1920x1080 |
| Framerate | 30fps |
| Codec | H.264 (libx264, Constrained Baseline) |
| Pixel Format | yuv420p |
| Container | MP4 (faststart) |
| Duration | 5.03s |
| Bitrate | 284 kbps |
| File Size | 0.17 MB |
| CRF | 23 |

## Output Files

- `demo/scripts/record-demo.sh` - Reusable recording script
- `demo/output/raw-recording.mp4` - 5-second test recording

## Playback Validation

- File exists and is non-zero: Yes
- Valid MP4 container: Yes (ffprobe confirms)
- Resolution 1080p or higher: Yes (1920x1080)
- File size under 20MB: Yes (0.17 MB)
- Plays locally: Yes (`open demo/output/raw-recording.mp4`)

## Script Usage

```bash
# Default 5-second recording
bash demo/scripts/record-demo.sh

# Custom duration
bash demo/scripts/record-demo.sh --duration 15

# Dry run (show commands)
bash demo/scripts/record-demo.sh --dry-run

# Custom output path
bash demo/scripts/record-demo.sh --output /path/to/output.mp4
```

## Prerequisites

- macOS (uses `screencapture` built-in)
- ffmpeg (`brew install ffmpeg`)
- Screen recording permission granted to Terminal/iTerm in System Settings > Privacy & Security > Screen Recording

## Notes

- Native capture resolution is 3024x1964 (Retina) - scaled down to 1080p during conversion
- Low bitrate (284 kbps) indicates mostly static screen content during test; active UI will produce higher bitrate
- Recording pipeline takes ~7 seconds total for a 5-second capture (2s countdown + 5s capture + conversion)
