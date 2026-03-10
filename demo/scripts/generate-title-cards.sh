#!/usr/bin/env bash
# Generate title card and end card images using ffmpeg
# Requires: ffmpeg with libfreetype
set -euo pipefail

ASSETS_DIR="$(cd "$(dirname "$0")/../assets" && pwd)"

echo "=== Generating Title Cards ==="

# Scene 1: Title card - white text on dark background
ffmpeg -y -f lavfi -i "color=c=0x1a1a2e:s=1920x1080:d=3" \
  -vf "drawtext=text='Claude Debug Copilot':fontsize=72:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-40, \
       drawtext=text='Evidence-First Backend Diagnosis':fontsize=36:fontcolor=0xcccccc:x=(w-text_w)/2:y=(h-text_h)/2+50" \
  -frames:v 1 "$ASSETS_DIR/title-card.png"

echo "  [OK] title-card.png"

# Scene 1: Title card as 3-second video clip
ffmpeg -y -f lavfi -i "color=c=0x1a1a2e:s=1920x1080:d=3:r=30" \
  -vf "drawtext=text='Claude Debug Copilot':fontsize=72:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-40, \
       drawtext=text='Evidence-First Backend Diagnosis':fontsize=36:fontcolor=0xcccccc:x=(w-text_w)/2:y=(h-text_h)/2+50, \
       fade=t=in:st=0:d=0.5,fade=t=out:st=2.5:d=0.5" \
  -c:v libx264 -pix_fmt yuv420p -t 3 "$ASSETS_DIR/title-card.mp4"

echo "  [OK] title-card.mp4"

# End card
ffmpeg -y -f lavfi -i "color=c=0x1a1a2e:s=1920x1080:d=3:r=30" \
  -vf "drawtext=text='Evidence First.':fontsize=64:fontcolor=white:x=(w-text_w)/2:y=(h-text_h)/2-30, \
       drawtext=text='github.com/jimmymalhan/claude-debug-copilot':fontsize=28:fontcolor=0x888888:x=(w-text_w)/2:y=(h-text_h)/2+40, \
       fade=t=in:st=0:d=0.5,fade=t=out:st=2.5:d=0.5" \
  -c:v libx264 -pix_fmt yuv420p -t 3 "$ASSETS_DIR/end-card.mp4"

echo "  [OK] end-card.mp4"
echo "=== Title Cards Complete ==="
