#!/usr/bin/env bash
# assemble-video.sh - Assemble demo video from raw recording + TTS audio
# Usage: ./assemble-video.sh [--test] [--no-title]
#
# Inputs:
#   demo/output/raw-recording.mp4  - Screen recording from recorder agent
#   demo/output/demo-audio.mp3     - TTS narration from audio engineer
#
# Output:
#   demo/output/poc-demo.mp4       - Final assembled video
#
# Options:
#   --test      Generate 5-second synthetic test inputs first
#   --no-title  Skip title card overlay

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEMO_DIR="$PROJECT_DIR/demo"
OUTPUT_DIR="$DEMO_DIR/output"

VIDEO_IN="$OUTPUT_DIR/raw-recording.mp4"
AUDIO_IN="$OUTPUT_DIR/demo-audio.mp3"
VIDEO_OUT="$OUTPUT_DIR/poc-demo.mp4"
TITLE_TEXT="Claude Debug Copilot"

USE_TEST=false
SKIP_TITLE=false

for arg in "$@"; do
  case "$arg" in
    --test) USE_TEST=true ;;
    --no-title) SKIP_TITLE=true ;;
    *) echo "Unknown option: $arg"; exit 1 ;;
  esac
done

# Check ffmpeg
if ! command -v ffmpeg &>/dev/null; then
  echo "ERROR: ffmpeg not found. Install with: brew install ffmpeg"
  exit 1
fi

mkdir -p "$OUTPUT_DIR"

# Generate synthetic test inputs if --test flag
if [ "$USE_TEST" = true ]; then
  echo "==> Generating 5-second test video..."
  ffmpeg -y -f lavfi -i "color=c=0x1a1a2e:s=1920x1080:d=5,format=yuv420p" \
    -f lavfi -i "sine=frequency=440:duration=5" \
    -c:v libx264 -preset ultrafast -crf 23 \
    -c:a aac -b:a 128k \
    -t 5 "$VIDEO_IN" 2>/dev/null
  echo "   Created: $VIDEO_IN"

  echo "==> Generating 5-second test audio..."
  ffmpeg -y -f lavfi -i "sine=frequency=300:duration=5" \
    -c:a libmp3lame -b:a 128k \
    -t 5 "$AUDIO_IN" 2>/dev/null
  echo "   Created: $AUDIO_IN"
fi

# Validate inputs exist
if [ ! -f "$VIDEO_IN" ]; then
  echo "ERROR: Missing video input: $VIDEO_IN"
  echo "  Run with --test to generate synthetic inputs, or wait for recorder agent."
  exit 1
fi

if [ ! -f "$AUDIO_IN" ]; then
  echo "ERROR: Missing audio input: $AUDIO_IN"
  echo "  Run with --test to generate synthetic inputs, or wait for audio engineer."
  exit 1
fi

echo "==> Inputs:"
echo "   Video: $VIDEO_IN ($(du -h "$VIDEO_IN" | cut -f1))"
echo "   Audio: $AUDIO_IN ($(du -h "$AUDIO_IN" | cut -f1))"

# Build filter_complex based on options
if [ "$SKIP_TITLE" = true ]; then
  # Simple assembly: sync video + audio with fade in/out
  FILTER="[0:v]fade=t=in:st=0:d=0.5,fade=t=out:st=4.5:d=0.5[vout]"

  echo "==> Assembling video (no title card)..."
  ffmpeg -y \
    -i "$VIDEO_IN" \
    -i "$AUDIO_IN" \
    -filter_complex "$FILTER" \
    -map "[vout]" -map 1:a:0 \
    -c:v libx264 -preset medium -crf 20 \
    -c:a aac -b:a 192k \
    -movflags +faststart \
    -shortest \
    "$VIDEO_OUT" 2>/dev/null
else
  # Full assembly: title card (2s) + main video with fades
  # Note: drawtext filter not available in this ffmpeg build
  # Using color card as title placeholder (branded dark blue #1a1a2e)
  # Structure: 2s title -> fade -> main content -> fade out
  HAS_DRAWTEXT=$(ffmpeg -filters 2>/dev/null | grep -c drawtext || true)
  if [ "$HAS_DRAWTEXT" -gt 0 ]; then
    FILTER="
      color=c=0x1a1a2e:s=1920x1080:d=2[title_bg];
      [title_bg]drawtext=text='${TITLE_TEXT}':fontcolor=white:fontsize=72:x=(w-text_w)/2:y=(h-text_h)/2:font=Arial[title];
      [title]fade=t=in:st=0:d=0.5,fade=t=out:st=1.5:d=0.5[title_out];
      [0:v]fade=t=in:st=0:d=0.5,fade=t=out:st=4.5:d=0.5[main];
      [title_out][main]concat=n=2:v=1:a=0[vout]
    "
  else
    echo "   (drawtext filter not available, using color-only title card)"
    FILTER="
      color=c=0x1a1a2e:s=1920x1080:d=2,format=yuv420p,fade=t=in:st=0:d=0.5,fade=t=out:st=1.5:d=0.5[title_out];
      [0:v]fade=t=in:st=0:d=0.5,fade=t=out:st=4.5:d=0.5[main];
      [title_out][main]concat=n=2:v=1:a=0[vout]
    "
  fi

  echo "==> Assembling video with title card..."
  ffmpeg -y \
    -i "$VIDEO_IN" \
    -i "$AUDIO_IN" \
    -filter_complex "$FILTER" \
    -map "[vout]" -map 1:a:0 \
    -c:v libx264 -preset medium -crf 20 \
    -c:a aac -b:a 192k \
    -movflags +faststart \
    -shortest \
    "$VIDEO_OUT" 2>/dev/null
fi

# Validate output
if [ ! -f "$VIDEO_OUT" ]; then
  echo "ERROR: Assembly failed - no output file created"
  exit 1
fi

FILE_SIZE=$(du -h "$VIDEO_OUT" | cut -f1)
FILE_SIZE_BYTES=$(stat -f%z "$VIDEO_OUT" 2>/dev/null || stat -c%s "$VIDEO_OUT" 2>/dev/null)
DURATION=$(ffprobe -v error -show_entries format=duration -of default=noprint_wrappers=1:nokey=1 "$VIDEO_OUT" 2>/dev/null || echo "unknown")

echo ""
echo "==> Output:"
echo "   File: $VIDEO_OUT"
echo "   Size: $FILE_SIZE ($FILE_SIZE_BYTES bytes)"
echo "   Duration: ${DURATION}s"

# Size check (<15MB = 15728640 bytes)
if [ "$FILE_SIZE_BYTES" -gt 15728640 ] 2>/dev/null; then
  echo "   WARNING: File exceeds 15MB target"
else
  echo "   Size check: PASS (<15MB)"
fi

# Validate streams
echo ""
echo "==> Stream validation:"
ffprobe -v error -show_entries stream=codec_type,codec_name,duration \
  -of default=noprint_wrappers=1 "$VIDEO_OUT" 2>/dev/null || echo "   (ffprobe not available)"

# Post-process: burn in captions if available and subtitles filter exists
CAPTIONS_FILE="$DEMO_DIR/assets/captions.srt"
HAS_SUBTITLES=$(ffmpeg -filters 2>/dev/null | grep -c "subtitles" || true)
if [ -f "$CAPTIONS_FILE" ] && [ "$HAS_SUBTITLES" -gt 0 ]; then
  echo ""
  echo "==> Burning in captions..."
  ffmpeg -y \
    -i "$VIDEO_OUT" \
    -vf "subtitles=$CAPTIONS_FILE:force_style='FontSize=22,FontName=Arial,PrimaryColour=&H00FFFFFF,OutlineColour=&H00000000,Outline=2,Shadow=1,MarginV=40'" \
    -c:v libx264 -preset medium -crf 20 -pix_fmt yuv420p \
    -c:a copy \
    "${VIDEO_OUT%.mp4}-captioned.mp4" 2>/dev/null
  mv "${VIDEO_OUT%.mp4}-captioned.mp4" "$VIDEO_OUT"
  echo "   Captions burned in"
elif [ -f "$CAPTIONS_FILE" ]; then
  echo ""
  echo "==> [SKIP] captions.srt found but subtitles filter not available in ffmpeg"
else
  echo ""
  echo "==> [SKIP] No captions.srt found"
fi

# Post-process: add watermark if available
WATERMARK_FILE="$DEMO_DIR/assets/watermark.png"
if [ -f "$WATERMARK_FILE" ]; then
  echo "==> Adding watermark..."
  ffmpeg -y \
    -i "$VIDEO_OUT" \
    -i "$WATERMARK_FILE" \
    -filter_complex "overlay=W-w-20:20:format=auto,format=yuv420p" \
    -c:v libx264 -preset medium -crf 20 \
    -c:a copy \
    "${VIDEO_OUT%.mp4}-wm.mp4" 2>/dev/null
  mv "${VIDEO_OUT%.mp4}-wm.mp4" "$VIDEO_OUT"
  echo "   Watermark added"
fi

# Post-process: embed metadata
METADATA_FILE="$DEMO_DIR/assets/metadata.json"
if [ -f "$METADATA_FILE" ] && command -v python3 &>/dev/null; then
  META_TITLE=$(python3 -c "import json; print(json.load(open('$METADATA_FILE'))['title'])")
  META_DESC=$(python3 -c "import json; print(json.load(open('$METADATA_FILE'))['description'])")
  META_TAGS=$(python3 -c "import json; print(','.join(json.load(open('$METADATA_FILE'))['tags']))")
  META_AUTHOR=$(python3 -c "import json; print(json.load(open('$METADATA_FILE'))['author'])")

  echo "==> Embedding metadata..."
  ffmpeg -y \
    -i "$VIDEO_OUT" \
    -c copy \
    -metadata title="$META_TITLE" \
    -metadata comment="$META_DESC" \
    -metadata artist="$META_AUTHOR" \
    -metadata genre="Technology Demo" \
    -metadata keywords="$META_TAGS" \
    -movflags +faststart \
    "${VIDEO_OUT%.mp4}-meta.mp4" 2>/dev/null
  mv "${VIDEO_OUT%.mp4}-meta.mp4" "$VIDEO_OUT"
  echo "   Metadata embedded"
else
  echo "==> [SKIP] metadata.json not found or python3 unavailable"
fi

echo ""
echo "==> Assembly complete!"
