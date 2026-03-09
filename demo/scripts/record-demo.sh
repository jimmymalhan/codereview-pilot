#!/usr/bin/env bash
#
# Claude Debug Copilot - Screen Recording Script
#
# Records the macOS screen using screencapture (native) + ffmpeg (conversion).
# Two-step process:
#   1. screencapture -V captures at native retina resolution (.mov)
#   2. ffmpeg scales to 1080p H.264 (.mp4)
#
# Usage:
#   ./demo/scripts/record-demo.sh              # Record 5 seconds (default)
#   ./demo/scripts/record-demo.sh --duration 15 # Record 15 seconds
#   ./demo/scripts/record-demo.sh --dry-run     # Show commands without recording
#
# Prerequisites:
#   - ffmpeg (brew install ffmpeg) for conversion
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
RAW_MOV="$OUTPUT_DIR/.raw-capture.mov"

FFMPEG="/opt/homebrew/bin/ffmpeg"
FFPROBE="/opt/homebrew/bin/ffprobe"
DURATION=5
FRAMERATE=30
TARGET_RESOLUTION="1920:1080"
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
    --help|-h)
      echo "Usage: $0 [--duration SECONDS] [--output FILE] [--dry-run]"
      echo ""
      echo "Options:"
      echo "  --duration SECONDS  Recording duration (default: 5)"
      echo "  --output FILE       Output file path (default: demo/output/raw-recording.mp4)"
      echo "  --dry-run           Print commands without executing"
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
  if command -v ffmpeg &>/dev/null; then
    FFMPEG="ffmpeg"
    FFPROBE="ffprobe"
  else
    echo "ERROR: ffmpeg not found. Install with: brew install ffmpeg"
    exit 1
  fi
fi

if ! command -v screencapture &>/dev/null; then
  echo "ERROR: screencapture not found (macOS only)"
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

# Clean up previous files
rm -f "$OUTPUT_FILE" "$RAW_MOV"

# ---------------------------------------------------------------------------
# Step 1: Capture screen with screencapture
# ---------------------------------------------------------------------------

echo "============================================================"
echo "Claude Debug Copilot - Screen Recording"
echo "============================================================"
echo "Duration:    ${DURATION}s"
echo "Target:      1920x1080 @ ${FRAMERATE}fps"
echo "Codec:       H.264 (libx264)"
echo "Output:      $OUTPUT_FILE"
echo "Method:      screencapture -V -> ffmpeg convert"
echo "============================================================"

if $DRY_RUN; then
  echo ""
  echo "DRY RUN - commands that would be executed:"
  echo "  1. screencapture -V $DURATION -x $RAW_MOV"
  echo "  2. ffmpeg -i $RAW_MOV -vf scale=$TARGET_RESOLUTION -c:v libx264 ... $OUTPUT_FILE"
  exit 0
fi

echo ""
echo "Recording starts in 2 seconds..."
sleep 2

echo "Step 1: Capturing screen (${DURATION}s)..."
screencapture -V "$DURATION" -x "$RAW_MOV" &
CAPTURE_PID=$!

# Wait for screencapture to finish (add buffer for processing)
WAIT_LIMIT=$((DURATION + 5))
ELAPSED=0
while kill -0 $CAPTURE_PID 2>/dev/null && [[ $ELAPSED -lt $WAIT_LIMIT ]]; do
  sleep 1
  ELAPSED=$((ELAPSED + 1))
done

# Kill if still running after timeout
if kill -0 $CAPTURE_PID 2>/dev/null; then
  kill $CAPTURE_PID 2>/dev/null
  wait $CAPTURE_PID 2>/dev/null || true
fi

if [[ ! -f "$RAW_MOV" ]]; then
  echo "ERROR: Screen capture failed - no output file"
  echo "Check: System Settings > Privacy & Security > Screen Recording"
  exit 1
fi

RAW_SIZE=$(stat -f%z "$RAW_MOV" 2>/dev/null)
echo "  Captured: $(echo "scale=2; $RAW_SIZE / 1048576" | bc)MB (native resolution)"

# ---------------------------------------------------------------------------
# Step 2: Convert to 1080p MP4
# ---------------------------------------------------------------------------

echo "Step 2: Converting to 1080p MP4..."
"$FFMPEG" -y \
  -i "$RAW_MOV" \
  -vf "scale=$TARGET_RESOLUTION" \
  -c:v libx264 \
  -preset fast \
  -crf 23 \
  -pix_fmt yuv420p \
  -movflags +faststart \
  -r "$FRAMERATE" \
  "$OUTPUT_FILE" \
  </dev/null 2>/dev/null

# Clean up intermediate file
rm -f "$RAW_MOV"

# ---------------------------------------------------------------------------
# Validate output
# ---------------------------------------------------------------------------

if [[ ! -f "$OUTPUT_FILE" ]]; then
  echo "ERROR: Conversion failed - output file not created"
  exit 1
fi

FILE_SIZE=$(stat -f%z "$OUTPUT_FILE" 2>/dev/null)
FILE_SIZE_MB=$(echo "scale=2; $FILE_SIZE / 1048576" | bc)

# Get video details
VIDEO_INFO=$("$FFPROBE" -v quiet -print_format json -show_streams -show_format "$OUTPUT_FILE" 2>/dev/null)
WIDTH=$(echo "$VIDEO_INFO" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['streams'][0].get('width','?'))" 2>/dev/null || echo "?")
HEIGHT=$(echo "$VIDEO_INFO" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['streams'][0].get('height','?'))" 2>/dev/null || echo "?")
ACTUAL_DURATION=$(echo "$VIDEO_INFO" | python3 -c "import json,sys; d=json.load(sys.stdin); print(d['format'].get('duration','?'))" 2>/dev/null || echo "?")
BITRATE=$(echo "$VIDEO_INFO" | python3 -c "import json,sys; d=json.load(sys.stdin); print(f\"{int(d['format'].get('bit_rate',0))/1000:.0f}\")" 2>/dev/null || echo "?")

echo ""
echo "============================================================"
echo "Recording complete!"
echo "============================================================"
echo "File:        $OUTPUT_FILE"
echo "Resolution:  ${WIDTH}x${HEIGHT}"
echo "Duration:    ${ACTUAL_DURATION}s"
echo "Framerate:   ${FRAMERATE}fps"
echo "Bitrate:     ${BITRATE}kbps"
echo "Size:        ${FILE_SIZE_MB}MB"
echo "Codec:       H.264 (libx264)"
echo "============================================================"

# Validate constraints
PASS=true
if [[ "$WIDTH" != "1920" ]] || [[ "$HEIGHT" != "1080" ]]; then
  echo "WARNING: Resolution is not 1920x1080"
  PASS=false
fi
if (( $(echo "$FILE_SIZE_MB > 20" | bc -l) )); then
  echo "WARNING: File size exceeds 20MB target"
  PASS=false
fi

if $PASS; then
  echo "All checks passed."
fi

echo "Playback: open $OUTPUT_FILE"
