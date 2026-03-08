# Tabletop Drill Schedule (OPS-8)

## Purpose
One tabletop exercise per runbook. Complete all 6 drills before Phase 3 starts.

## Schedule

| Drill | Runbook | Scenario | Target SLA | Date |
|-------|---------|----------|------------|------|
| 1 | Agent Timeout | Simulate agent heartbeat failure -> on-call kills agent -> verify recovery | 2-5 min | Before Phase 3 |
| 2 | API Failure | Simulate Anthropic API 500 error -> on-call switches to queue mode -> verify recovery | 15-30 min | Before Phase 3 |
| 3 | Approval Deadlock | Simulate task stuck in awaiting_approver for 4+ hours -> on-call notifies user -> verify escalation | 1-4 hr | Before Phase 3 |
| 4 | Budget Exhausted | Simulate org budget at 100% -> on-call stops new tasks -> verify midnight reset | Resolution at reset | Before Phase 3 |
| 5 | Audit Trail Gap | Simulate missing audit entry -> on-call investigates -> verify reconstruction | 2-4 hr | Before Phase 3 |
| 6 | Skeptic/Verifier Override | Simulate user governance override -> on-call verifies authorization + logs justification | 15-30 min | Before Phase 3 |

## Drill Procedure

For each drill:
1. Facilitator describes scenario to on-call engineer
2. On-call opens corresponding runbook
3. On-call walks through steps verbally (or executes in staging if available)
4. Record time-to-resolution
5. Identify any gaps in runbook steps
6. Revise runbook if gaps found
7. Sign off: on-call confirms comfort level

## Sign-Off

Each drill requires:
- On-call engineer confirms they can execute the runbook independently
- Ops lead verifies time-to-resolution meets SLA
- Any runbook revisions committed before Phase 3
