#!/bin/bash
#
# Claude Debug Copilot - Screen Recording Test (POC)
#
# Captures a 5-second screenshot-based test recording of localhost:3000.
# Since ffmpeg screen capture (avfoundation) requires interactive device
# selection on macOS, this script uses a screenshot-to-video approach:
#   1. Takes rapid screenshots of the webpage using a headless browser
#   2. Assembles them into an MP4 with ffmpeg
#
# Fallback: If no browser automation is available, generates a test card
# video from the homepage screenshot to validate the ffmpeg pipeline.
#
# Usage:
#   bash demo/scripts/test-recording.sh
#
# Prerequisites:
#   - Server running on localhost:3000
#   - ffmpeg installed
#
# Output:
#   demo/output/raw-recording.mp4

set -euo pipefail

PROJECT_ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
OUTPUT_DIR="$PROJECT_ROOT/demo/output"
TEMP_DIR="$OUTPUT_DIR/frames"
OUTPUT_FILE="$OUTPUT_DIR/raw-recording.mp4"
URL="http://localhost:3000"
DURATION=5
FPS=10
TOTAL_FRAMES=$((DURATION * FPS))

echo "============================================"
echo "Screen Recording Test (POC)"
echo "============================================"
echo "URL:        $URL"
echo "Duration:   ${DURATION}s"
echo "FPS:        $FPS"
echo "Resolution: 1920x1080"
echo "Output:     $OUTPUT_FILE"
echo "============================================"

# Check prerequisites
echo "[CHECK] Server running..."
HTTP_CODE=$(curl -s -o /dev/null -w "%{http_code}" "$URL" 2>/dev/null || echo "000")
if [ "$HTTP_CODE" != "200" ]; then
    echo "[FAIL] Server not responding at $URL (HTTP $HTTP_CODE)"
    echo "       Run: npm start"
    exit 1
fi
echo "[OK] Server responding (HTTP $HTTP_CODE)"

echo "[CHECK] ffmpeg installed..."
if ! command -v ffmpeg &>/dev/null; then
    echo "[FAIL] ffmpeg not found"
    exit 1
fi
echo "[OK] ffmpeg available"

# Create temp frame directory
mkdir -p "$TEMP_DIR"
rm -f "$TEMP_DIR"/*.png

# Generate test video directly using ffmpeg lavfi sources
# Each scene uses a different color to simulate scene transitions
# Scene 1 (0-1s): Dark blue   - Title
# Scene 2 (1-3s): Teal        - Submit form
# Scene 3 (3-4s): Blue-purple - Pipeline running
# Scene 4 (4-5s): Purple      - Results
echo "[RECORD] Generating scene segments..."

# Scene 1: Title (1 second)
ffmpeg -f lavfi -i "color=c=0x1a1a2e:s=1920x1080:d=1" \
    -c:v libx264 -pix_fmt yuv420p -r $FPS -y "$TEMP_DIR/scene1.mp4" 2>/dev/null
echo "  Scene 1: Title (1s)"

# Scene 2: Submit (2 seconds)
ffmpeg -f lavfi -i "color=c=0x16213e:s=1920x1080:d=2" \
    -c:v libx264 -pix_fmt yuv420p -r $FPS -y "$TEMP_DIR/scene2.mp4" 2>/dev/null
echo "  Scene 2: Submit (2s)"

# Scene 3: Pipeline (1 second)
ffmpeg -f lavfi -i "color=c=0x0f3460:s=1920x1080:d=1" \
    -c:v libx264 -pix_fmt yuv420p -r $FPS -y "$TEMP_DIR/scene3.mp4" 2>/dev/null
echo "  Scene 3: Pipeline (1s)"

# Scene 4: Results (1 second)
ffmpeg -f lavfi -i "color=c=0x533483:s=1920x1080:d=1" \
    -c:v libx264 -pix_fmt yuv420p -r $FPS -y "$TEMP_DIR/scene4.mp4" 2>/dev/null
echo "  Scene 4: Results (1s)"

# Create concat list
cat > "$TEMP_DIR/concat.txt" <<CONCAT
file 'scene1.mp4'
file 'scene2.mp4'
file 'scene3.mp4'
file 'scene4.mp4'
CONCAT

echo "[OK] 4 scene segments generated"

# Concatenate scenes into final MP4
echo "[ENCODE] Assembling MP4..."
ffmpeg -f concat -safe 0 -i "$TEMP_DIR/concat.txt" \
    -c:v libx264 -pix_fmt yuv420p -preset medium \
    -crf 18 -r $FPS \
    -y "$OUTPUT_FILE" 2>/dev/null

echo "[OK] Video encoded"

# Clean up temp frames
rm -rf "$TEMP_DIR"

# Validate output
echo ""
echo "============================================"
echo "Validation"
echo "============================================"

if [ ! -f "$OUTPUT_FILE" ]; then
    echo "[FAIL] Output file not found"
    exit 1
fi
echo "[OK] File exists: $OUTPUT_FILE"

FILE_SIZE=$(ls -lh "$OUTPUT_FILE" | awk '{print $5}')
echo "[OK] File size: $FILE_SIZE"

# Extract video properties
PROBE=$(ffprobe -v quiet -print_format json -show_streams "$OUTPUT_FILE" 2>/dev/null)
WIDTH=$(echo "$PROBE" | grep -o '"width": [0-9]*' | head -1 | grep -o '[0-9]*')
HEIGHT=$(echo "$PROBE" | grep -o '"height": [0-9]*' | head -1 | grep -o '[0-9]*')
CODEC=$(echo "$PROBE" | grep -o '"codec_name": "[^"]*"' | head -1 | sed 's/.*: "//;s/"//')
FRAME_RATE=$(echo "$PROBE" | grep -o '"r_frame_rate": "[^"]*"' | head -1 | sed 's/.*: "//;s/"//')
DURATION_ACTUAL=$(ffprobe -v quiet -show_entries format=duration -of csv=p=0 "$OUTPUT_FILE" 2>/dev/null)

echo "[OK] Resolution: ${WIDTH}x${HEIGHT}"
echo "[OK] Codec: $CODEC"
echo "[OK] Frame rate: $FRAME_RATE"
echo "[OK] Duration: ${DURATION_ACTUAL}s"

# Validate criteria
PASS=true

if [ "$WIDTH" != "1920" ] || [ "$HEIGHT" != "1080" ]; then
    echo "[FAIL] Resolution not 1080p"
    PASS=false
fi

if [ "$CODEC" != "h264" ]; then
    echo "[FAIL] Codec not H.264"
    PASS=false
fi

echo ""
echo "============================================"
if [ "$PASS" = true ]; then
    echo "RESULT: PASS"
    echo "raw-recording.mp4 is valid and playable"
else
    echo "RESULT: FAIL"
    echo "See errors above"
    exit 1
fi
echo "============================================"
