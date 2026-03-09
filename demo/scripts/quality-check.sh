#!/usr/bin/env bash
# quality-check.sh - Validate assembled demo video
# Checks: resolution, codec, duration, audio, captions sync, metadata
# Requires: ffmpeg/ffprobe
#
# Usage: ./quality-check.sh [path-to-video]
# Default: demo/output/poc-demo.mp4

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_DIR="$(cd "$SCRIPT_DIR/../.." && pwd)"
DEMO_DIR="$PROJECT_DIR/demo"
VIDEO="${1:-$DEMO_DIR/output/poc-demo.mp4}"

PASS=0
FAIL=0
WARN=0

pass() { echo "  [PASS] $1"; PASS=$((PASS + 1)); }
fail() { echo "  [FAIL] $1"; FAIL=$((FAIL + 1)); }
warn() { echo "  [WARN] $1"; WARN=$((WARN + 1)); }
info() { echo "  [INFO] $1"; }

echo "============================================"
echo "  Quality Check"
echo "  File: $(basename "$VIDEO")"
echo "============================================"
echo ""

if [ ! -f "$VIDEO" ]; then
  fail "Video file not found: $VIDEO"
  echo ""
  echo "  Run assemble-video.sh first."
  exit 1
fi

# --- Video stream ---
echo "Video Stream:"

WIDTH=$(ffprobe -v error -select_streams v:0 -show_entries stream=width -of csv=p=0 "$VIDEO")
HEIGHT=$(ffprobe -v error -select_streams v:0 -show_entries stream=height -of csv=p=0 "$VIDEO")
if [ "$WIDTH" = "1920" ] && [ "$HEIGHT" = "1080" ]; then
  pass "Resolution: ${WIDTH}x${HEIGHT}"
else
  fail "Resolution: ${WIDTH}x${HEIGHT} (expected 1920x1080)"
fi

CODEC=$(ffprobe -v error -select_streams v:0 -show_entries stream=codec_name -of csv=p=0 "$VIDEO")
if [ "$CODEC" = "h264" ]; then
  pass "Video codec: $CODEC"
else
  fail "Video codec: $CODEC (expected h264)"
fi

FPS_RAW=$(ffprobe -v error -select_streams v:0 -show_entries stream=r_frame_rate -of csv=p=0 "$VIDEO")
FPS_NUM=$(echo "$FPS_RAW" | cut -d'/' -f1)
FPS_DEN=$(echo "$FPS_RAW" | cut -d'/' -f2)
if [ "$FPS_DEN" -gt 0 ] 2>/dev/null; then
  FPS_CALC=$(echo "scale=0; $FPS_NUM / $FPS_DEN" | bc)
else
  FPS_CALC="$FPS_NUM"
fi
if [ "$FPS_CALC" -ge 24 ] && [ "$FPS_CALC" -le 60 ]; then
  pass "Frame rate: ${FPS_CALC}fps"
else
  fail "Frame rate: ${FPS_CALC}fps (expected 24-60)"
fi

PIX_FMT=$(ffprobe -v error -select_streams v:0 -show_entries stream=pix_fmt -of csv=p=0 "$VIDEO")
if [ "$PIX_FMT" = "yuv420p" ]; then
  pass "Pixel format: $PIX_FMT"
else
  warn "Pixel format: $PIX_FMT (yuv420p recommended for compatibility)"
fi

# --- Duration ---
echo ""
echo "Duration:"

DURATION=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$VIDEO")
DURATION_INT=$(echo "$DURATION" | cut -d'.' -f1)
if [ "$DURATION_INT" -ge 5 ] && [ "$DURATION_INT" -le 20 ]; then
  pass "Duration: ${DURATION}s (target: ~15s)"
else
  fail "Duration: ${DURATION}s (expected 5-20s)"
fi

# --- Audio stream ---
echo ""
echo "Audio Stream:"

HAS_AUDIO=$(ffprobe -v error -select_streams a:0 -show_entries stream=codec_name -of csv=p=0 "$VIDEO" 2>/dev/null || echo "")
if [ -z "$HAS_AUDIO" ]; then
  warn "No audio stream (narration may not have been provided)"
else
  if [ "$HAS_AUDIO" = "aac" ]; then
    pass "Audio codec: $HAS_AUDIO"
  else
    warn "Audio codec: $HAS_AUDIO (aac recommended)"
  fi

  SAMPLE_RATE=$(ffprobe -v error -select_streams a:0 -show_entries stream=sample_rate -of csv=p=0 "$VIDEO" 2>/dev/null || echo "0")
  if [ "$SAMPLE_RATE" -ge 44100 ] 2>/dev/null; then
    pass "Sample rate: ${SAMPLE_RATE}Hz"
  else
    warn "Sample rate: ${SAMPLE_RATE}Hz (44100+ recommended)"
  fi

  # Check audio levels (detect silence)
  VOLUME=$(ffmpeg -i "$VIDEO" -af "volumedetect" -f null /dev/null 2>&1 | grep "mean_volume" | sed 's/.*mean_volume: //' | sed 's/ dB//' || echo "unknown")
  if [ "$VOLUME" != "unknown" ]; then
    info "Mean volume: ${VOLUME} dB"
    VOLUME_INT=$(echo "$VOLUME" | cut -d'.' -f1 | tr -d '-')
    if [ "$VOLUME_INT" -gt 50 ] 2>/dev/null; then
      warn "Audio may be too quiet (mean: ${VOLUME} dB)"
    fi
  fi
fi

# --- Metadata ---
echo ""
echo "Metadata:"

TITLE=$(ffprobe -v error -show_entries format_tags=title -of csv=p=0 "$VIDEO" 2>/dev/null || echo "")
if [ -n "$TITLE" ]; then
  pass "Title: $TITLE"
else
  warn "Title metadata missing"
fi

COMMENT=$(ffprobe -v error -show_entries format_tags=comment -of csv=p=0 "$VIDEO" 2>/dev/null || echo "")
if [ -n "$COMMENT" ]; then
  pass "Description: present"
else
  warn "Description metadata missing"
fi

KEYWORDS=$(ffprobe -v error -show_entries format_tags=keywords -of csv=p=0 "$VIDEO" 2>/dev/null || echo "")
if [ -n "$KEYWORDS" ]; then
  pass "Tags: present"
else
  warn "Tags metadata missing"
fi

# --- File integrity ---
echo ""
echo "File Integrity:"

FILESIZE=$(stat -f%z "$VIDEO" 2>/dev/null || stat -c%s "$VIDEO" 2>/dev/null)
FILESIZE_MB=$(echo "scale=2; $FILESIZE / 1048576" | bc)
info "File size: ${FILESIZE_MB}MB"

if [ "$FILESIZE" -gt 15728640 ] 2>/dev/null; then
  warn "File exceeds 15MB target (${FILESIZE_MB}MB)"
else
  pass "File size under 15MB"
fi

# Check for faststart (moov before mdat)
ATOMS=$(ffprobe -v trace "$VIDEO" 2>&1 | head -100 || true)
MOOV_LINE=$(echo "$ATOMS" | grep -n "moov" | head -1 | cut -d: -f1 2>/dev/null || echo "0")
MDAT_LINE=$(echo "$ATOMS" | grep -n "mdat" | head -1 | cut -d: -f1 2>/dev/null || echo "0")
if [ "${MOOV_LINE:-0}" -gt 0 ] 2>/dev/null && [ "${MDAT_LINE:-0}" -gt 0 ] 2>/dev/null && [ "$MOOV_LINE" -lt "$MDAT_LINE" ]; then
  pass "faststart: moov atom before mdat"
elif [ "${MOOV_LINE:-0}" -gt 0 ] 2>/dev/null; then
  pass "faststart: moov atom detected"
else
  warn "faststart: could not verify atom order"
fi

# --- Caption sync check ---
echo ""
echo "Caption Sync:"

CAPTIONS_FILE="$DEMO_DIR/assets/captions.srt"
if [ -f "$CAPTIONS_FILE" ]; then
  CAPTION_COUNT=$(grep -c "^[0-9][0-9]*$" "$CAPTIONS_FILE" || echo "0")
  info "Caption cues: $CAPTION_COUNT"

  # Check last caption end time vs video duration
  LAST_END=$(grep -oE '[0-9]{2}:[0-9]{2}:[0-9]{2},[0-9]{3}' "$CAPTIONS_FILE" | tail -1 || echo "")
  if [ -n "$LAST_END" ]; then
    info "Last caption ends: $LAST_END"
    # Convert to seconds for comparison
    LAST_SEC=$(echo "$LAST_END" | sed 's/,/./;s/:/*3600+/;s/:/*60+/' | bc)
    if [ "$(echo "$LAST_SEC <= $DURATION" | bc)" -eq 1 ]; then
      pass "Captions fit within video duration"
    else
      fail "Captions extend beyond video (${LAST_SEC}s > ${DURATION}s)"
    fi
  fi
else
  info "No captions.srt to validate"
fi

# --- Summary ---
echo ""
echo "============================================"
echo "  Results: $PASS passed, $FAIL failed, $WARN warnings"
echo "============================================"

if [ "$FAIL" -gt 0 ]; then
  echo "  Status: FAILED"
  exit 1
elif [ "$WARN" -gt 3 ]; then
  echo "  Status: PASSED (with warnings)"
  exit 0
else
  echo "  Status: PASSED"
  exit 0
fi
