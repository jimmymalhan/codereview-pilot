# Demo Video Pipeline - Workflow

## Task Dependencies

```
script-writer ──► audio-engineer ──► video-editor ──► qa-tester
      │                                    ▲
      └────────────────────────────────────┘
              (scene breakdown)
```

## Agent Assignments

### 1. Script Writer
- Write narration script with timestamps
- Define scene breakdown (intro, demo, outro)
- Output: `demo/scripts/narration.md`, scene list

### 2. Audio Engineer
- Generate TTS or source audio from narration script
- Mix background music if needed
- Output: audio files in `demo/assets/`

### 3. Video Editor
- Capture or source screen recordings
- Assemble scenes using ffmpeg
- Add captions and transitions
- Output: final video in `demo/output/`

### 4. QA Tester
- Review video for accuracy, timing, audio sync
- Check captions match narration
- Validate branding and quality
- Output: approval or revision notes

## Expected Timing

| Stage | Estimated Duration |
|-------|--------------------|
| Script writing | 1 session |
| Audio production | 1 session |
| Video assembly | 1-2 sessions |
| QA review | 1 session |

## Validation Checkpoints

1. **Script approved** - Narration reviewed before audio work begins
2. **Audio synced** - Audio matches script timestamps
3. **Rough cut reviewed** - Video assembled, captions placed
4. **Final QA** - Full review before publish
