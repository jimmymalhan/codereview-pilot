# Timing Checkpoints

Frame-accurate timing reference matching `demo/script.md` narration.

---

## Timeline

```
0:00                    0:03        0:07              0:12        0:15
 |--- Scene 1: Title ---|-- Scene 2 -|--- Scene 3 ----|-- Scene 4 -|
 |   Landing page       | Type+Click | Pipeline runs  | Results    |
```

---

## Checkpoint Details

### CP-1: Title Visible (0:00)

| Check          | Expected                                         |
|----------------|--------------------------------------------------|
| URL            | localhost:3000                                    |
| Active tab     | Diagnose                                         |
| Header         | "Claude Debug Copilot" visible                   |
| Form           | Empty textarea, button enabled                   |
| Pipeline       | "Submit an incident to start diagnosis"          |
| Screenshot     | `01-title.png`                                   |
| Narration sync | "Claude Debug Copilot diagnoses..."              |

### CP-2: Incident Typed (0:05)

| Check          | Expected                                         |
|----------------|--------------------------------------------------|
| Textarea       | Contains incident text                           |
| Button         | "Diagnose with Paperclip" enabled                |
| Cursor         | Blinking in textarea                             |
| Screenshot     | `02-incident-typed.png`                          |
| Narration sync | "Paste your incident."                           |

### CP-3: Diagnose Clicked (0:06)

| Check          | Expected                                         |
|----------------|--------------------------------------------------|
| Button         | Disabled (loading state)                         |
| Pipeline panel | Spinner + "Running 4-agent pipeline..."          |
| Screenshot     | `03-diagnose-clicked.png`                        |
| Narration sync | "One click launches a four-agent..."             |

### CP-4: Pipeline Running (0:07 - 0:12)

| Check          | Expected                                         |
|----------------|--------------------------------------------------|
| Spinner        | Visible and animating                            |
| Status text    | "Running 4-agent pipeline..."                    |
| Button         | Still disabled                                   |
| Screenshot     | `04-pipeline-running.png`                        |
| Narration sync | "Router classifies... Retriever gathers..."      |

Note: Real pipeline takes 16-24 seconds. For the demo video, this
section is **time-compressed in post-production** to fit the 5-second
window. The automation script captures the full duration; editing
handles the compression.

### CP-5: Pipeline Complete (0:12)

| Check          | Expected                                         |
|----------------|--------------------------------------------------|
| Status         | Green success: "Diagnosis complete"              |
| Results panel  | Visible with 4 stages populated                  |
| Router output  | Non-empty text                                   |
| Retriever      | Non-empty text with evidence                     |
| Skeptic        | Non-empty text with alternative theory           |
| Verifier       | Non-empty text with confidence score             |
| Screenshot     | `05-pipeline-complete.png`                       |
| Narration sync | (transition to Scene 4)                          |

### CP-6: Results Highlighted (0:13)

| Check          | Expected                                         |
|----------------|--------------------------------------------------|
| Scroll         | Results panel scrolled into view                 |
| Verifier stage | Visible with confidence score                    |
| Screenshot     | `06-results-visible.png`, `07-verifier-confidence.png` |
| Narration sync | "Root cause identified. Confidence: ninety-two percent." |

### CP-7: Final Frame (0:15)

| Check          | Expected                                         |
|----------------|--------------------------------------------------|
| View           | Full diagnosis visible                           |
| Orchestration  | Task ID, budget, status visible                  |
| Screenshot     | `08-orchestration.png`, `09-final-frame.png`     |
| Narration sync | "Evidence first."                                |

---

## Post-Production Timing Notes

The raw recording will be longer than 15 seconds because the real
API pipeline takes 16-24 seconds. The following edits are needed:

1. **Scene 1 (0:00-0:03)**: Use as-is. No editing needed.
2. **Scene 2 (0:03-0:07)**: Use as-is. Typing and click happen in real time.
3. **Scene 3 (0:07-0:12)**: Time-compress the pipeline wait. Options:
   - Speed ramp (2-4x) during spinner
   - Jump cut from spinner to results appearing
   - Crossfade from spinner to completed state
4. **Scene 4 (0:12-0:15)**: Use as-is. Scroll and hold on results.

---

## Validation Pass

After editing, verify each checkpoint frame exists at the correct
timestamp in the final 15-second video:

```
[ ] 0:00 - Landing page visible
[ ] 0:03 - Typing begins
[ ] 0:06 - Button clicked
[ ] 0:07 - Pipeline loading state
[ ] 0:12 - Results appear
[ ] 0:13 - Confidence score highlighted
[ ] 0:15 - Final frame held
[ ] Total duration = 15.0 seconds
```
