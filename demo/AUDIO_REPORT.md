# Audio Report - Demo TTS Generation

## TTS Service Used

**macOS `say` command** with **Samantha** voice (en_US)

- Engine: Apple Neural TTS (built-in macOS)
- Speech rate: 175 words/min (professional, natural pace)
- Post-processing: ffmpeg 8.0.1 with `loudnorm` filter

Note: Eleven Labs was specified in the script but requires an API key. macOS Samantha provides a clear, professional alternative for POC validation. Can be swapped to Eleven Labs for production.

## Voice Characteristics

| Property | Value |
|----------|-------|
| Voice | Samantha (en_US) |
| Gender | Female |
| Tone | Clear, professional, neutral |
| Speech rate | 175 wpm |
| Pronunciation | Clean - no mispronunciations detected |
| Pauses | Natural sentence-boundary pauses via ellipsis markers |

## Audio Levels

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Integrated loudness (LUFS) | -16.22 | -16 | PASS |
| True peak (dBTP) | -3.00 | -3.0 | PASS |
| Loudness range (LU) | 1.10 | <11 | PASS |

Normalization applied via ffmpeg `loudnorm` filter with EBU R128 standard.

## Output File

| Property | Value |
|----------|-------|
| File | `demo/output/demo-audio.mp3` |
| Format | MP3 (MPEG audio layer 3) |
| Codec | libmp3lame |
| Bitrate | 192 kbps |
| Sample rate | 48000 Hz |
| Channels | Mono |
| Duration | 20.76 seconds |
| File size | 488 KB |

## Playback Validation

- File exists: YES
- Format valid: YES (ffprobe confirms MP3)
- Duration: 20.76s (covers all 4 scenes)
- File size: 488 KB (well under 5 MB limit)
- Audio levels normalized: YES (-3 dBTP true peak)

## Script Coverage

All 4 scenes narrated in sequence:

1. **Scene 1** (0:00-0:03): "Claude Debug Copilot diagnoses backend failures in seconds, not hours."
2. **Scene 2** (0:03-0:07): "Paste your incident. One click launches a four-agent investigation pipeline."
3. **Scene 3** (0:07-0:12): "Router classifies the failure. Retriever gathers evidence. Skeptic challenges every assumption."
4. **Scene 4** (0:12-0:15): "Root cause identified. Confidence: ninety-two percent. Evidence first."

## Notes

- Duration is ~21s (slightly over the 15s target) due to natural TTS pacing with pauses between scenes
- To trim to exactly 15s, reduce speech rate or remove inter-scene pauses in post-production
- M4A version also available at `demo/output/demo-audio.m4a` as backup format
