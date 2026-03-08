# Operational Runbooks - Paperclip Integration

**Owner**: Operations/DevOps Lead
**Created**: 2026-03-08
**Status**: COMPLETE (6/6 runbooks documented)

---

## Quick Reference

| # | Runbook | Severity | Trigger | Recovery SLA | On-Call Authority |
|---|---------|----------|---------|--------------|-------------------|
| 1 | [Agent Timeout](runbook-01-agent-timeout.md) | CRITICAL | Heartbeat miss >120s | 2-5 min | Independent |
| 2 | [API Failure](runbook-02-api-failure.md) | CRITICAL | API 5xx / unreachable | 15-30 min | Independent (local-only); CTO if >1hr |
| 3 | [Approval Deadlock](runbook-03-approval-deadlock.md) | WARNING->CRITICAL | Task stuck >2hr | 1-4 hr | Escalate for override decisions |
| 4 | [Budget Exhausted](runbook-04-budget-exhausted.md) | CRITICAL | Budget >= 100% | Next day reset or CEO override | Independent (pause); CEO for increase |
| 5 | [Audit Trail Gap](runbook-05-audit-trail-gap.md) | CRITICAL | Gaps detected >0 | 2-4 hr | Investigate; escalate to security |
| 6 | [Skeptic/Verifier Override](runbook-06-skeptic-verifier-override.md) | WARNING | User override request | 15-30 min | Facilitate only; CEO/Eng Lead authorizes |

## On-Call Initial Response SLA

All runbooks target **< 5 minutes** for initial on-call response (acknowledge alert, begin investigation). Resolution times vary per runbook as documented above.

## Training Checklist

- [ ] On-call engineer has read all 6 runbooks
- [ ] Tabletop exercise completed for Runbook #1 (Agent Timeout)
- [ ] Tabletop exercise completed for Runbook #2 (API Failure)
- [ ] Tabletop exercise completed for Runbook #4 (Budget Exhausted)
- [ ] On-call engineer knows escalation contacts (Engineering Lead, CTO, CEO, Security)
- [ ] On-call engineer has access to: Paperclip dashboard, PagerDuty, Slack channels, monitoring dashboards
- [ ] Drill schedule: quarterly (next drill: TBD)
