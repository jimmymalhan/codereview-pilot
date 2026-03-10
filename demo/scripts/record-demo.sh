#!/usr/bin/env bash
#
# Claude Debug Copilot - Screen Recording Script
#
# Records the macOS screen using ffmpeg + AVFoundation.
# Captures "Capture screen 0" at 1080p, 30fps for a configurable duration.
#
# Usage:
#   ./demo/scripts/record-demo.sh              # Record 5 seconds (default)
#   ./demo/scripts/record-demo.sh --duration 15 # Record 15 seconds
#   ./demo/scripts/record-demo.sh --dry-run     # Show command without recording
#
# Prerequisites:
#   - ffmpeg (brew install ffmpeg)
#   - Screen recording permission granted to Terminal/iTerm
#
# Output: demo/output/raw-recording.mp4

set -euo pipefail

# ---------------------------------------------------------------------------
# Configuration
# ---------------------------------------------------------------------------

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_ROOT="$(cd "$SCRIPT_DIR/../.." && pwd)"
OUTPUT_DIR="$PROJECT_ROOT/demo/output"
OUTPUT_FILE="$OUTPUT_DIR/raw-recording.mp4"

FFMPEG="/opt/homebrew/bin/ffmpeg"
DURATION=5
FRAMERATE=30
SCREEN_DEVICE="3"  # "Capture screen 0" from AVFoundation device list
RESOLUTION="1920x1080"
DRY_RUN=false

# ---------------------------------------------------------------------------
# Parse arguments
# ---------------------------------------------------------------------------

while [[ $# -gt 0 ]]; do
  case "$1" in
    --duration)
      DURATION="$2"
      shift 2
      ;;
    --output)
      OUTPUT_FILE="$2"
      shift 2
      ;;
    --dry-run)
      DRY_RUN=true
      shift
      ;;
    --device)
      SCREEN_DEVICE="$2"
      shift 2
      ;;
    --help|-h)
      echo "Usage: $0 [--duration SECONDS] [--output FILE] [--device N] [--dry-run]"
      echo ""
      echo "Options:"
      echo "  --duration SECONDS  Recording duration (default: 5)"
      echo "  --output FILE       Output file path (default: demo/output/raw-recording.mp4)"
      echo "  --device N          AVFoundation screen device index (default: 3)"
      echo "  --dry-run           Print ffmpeg command without executing"
      echo "  --help              Show this help"
      exit 0
      ;;
    *)
      echo "Unknown option: $1"
      exit 1
      ;;
  esac
done

# ---------------------------------------------------------------------------
# Preflight checks
# ---------------------------------------------------------------------------

if ! command -v "$FFMPEG" &>/dev/null; then
  # Try PATH as fallback
  if command -v ffmpeg &>/dev/null; then
    FFMPEG="ffmpeg"
  else
    echo "ERROR: ffmpeg not found. Install with: brew install ffmpeg"
    exit 1
  fi
fi

mkdir -p "$OUTPUT_DIR"

# Remove previous recording if exists
if [[ -f "$OUTPUT_FILE" ]]; then
  echo "Removing previous recording: $OUTPUT_FILE"
  rm -f "$OUTPUT_FILE"
fi

# ---------------------------------------------------------------------------
# Record
# ---------------------------------------------------------------------------

FFMPEG_CMD=(
  "$FFMPEG"
  -y                          # Overwrite output
  -f avfoundation             # macOS capture framework
  -framerate "$FRAMERATE"     # Capture framerate
  -capture_cursor 1           # Include mouse cursor
  -i "${SCREEN_DEVICE}:none"  # Screen device : no audio
  -t "$DURATION"              # Duration in seconds
  -vf "scale=1920:1080"       # Scale to 1080p (retina-safe)
  -c:v libx264                # H.264 codec
  -preset fast                # Encoding speed
  -crf 23                     # Quality (lower = better, 18-28 typical)
  -pix_fmt yuv420p            # Pixel format for compatibility
  -movflags +faststart        # Web-friendly MP4
  "$OUTPUT_FILE"
)

echo "============================================================"
echo "Claude Debug Copilot - Screen Recording"
echo "============================================================"
echo "Duration:   ${DURATION}s"
echo "Resolution: $RESOLUTION"
echo "Framerate:  ${FRAMERATE}fps"
echo "Codec:      H.264 (libx264)"
echo "Output:     $OUTPUT_FILE"
echo "============================================================"

if $DRY_RUN; then
  echo ""
  echo "DRY RUN - command that would be executed:"
  echo "${FFMPEG_CMD[*]}"
  exit 0
fi

echo ""
echo "Recording starts in 2 seconds..."
sleep 2

echo "Recording... (${DURATION}s)"
FFMPEG_LOG="$OUTPUT_DIR/ffmpeg.log"
"${FFMPEG_CMD[@]}" </dev/null >"$FFMPEG_LOG" 2>&1
FFMPEG_EXIT=$?
if [[ $FFMPEG_EXIT -ne 0 ]]; then
  echo "ffmpeg exited with code $FFMPEG_EXIT"
  tail -10 "$FFMPEG_LOG"
fi

# ---------------------------------------------------------------------------
# Validate output
# ---------------------------------------------------------------------------

if [[ ! -f "$OUTPUT_FILE" ]]; then
  echo "ERROR: Recording failed - output file not created"
  exit 1
fi

FILE_SIZE=$(stat -f%z "$OUTPUT_FILE" 2>/dev/null || stat --printf="%s" "$OUTPUT_FILE" 2>/dev/null)
FILE_SIZE_MB=$(echo "scale=2; $FILE_SIZE / 1048576" | bc)

echo ""
echo "============================================================"
echo "Recording complete!"
echo "============================================================"
echo "File:       $OUTPUT_FILE"
echo "Size:       ${FILE_SIZE_MB}MB"

# Get video info
echo ""
echo "Video details:"
"$FFMPEG" -i "$OUTPUT_FILE" 2>&1 | grep -E "Stream|Duration" || true

echo ""
echo "============================================================"

# Validate file size (should be <20MB for 5 seconds)
if (( $(echo "$FILE_SIZE_MB > 20" | bc -l) )); then
  echo "WARNING: File size exceeds 20MB target"
fi

echo "Playback: open $OUTPUT_FILE"
