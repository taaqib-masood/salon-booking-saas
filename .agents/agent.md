# Routing Policy for Taaqib Masood
## Phase 1: Planning (Architect)
- Every new feature request starts with `/agents architect`.
- Architect must produce a `plan.md` before writing code.

## Phase 2: Execution (Worker)
- Once `plan.md` is approved, delegate file creation to `/agents worker`.
- Worker uses Flash to keep latency low and save Pro quota.

## Phase 3: Verification (Worker -> Architect)
- Worker runs `npm test` or `render-deploy-check`.
- **Automatic Escalation:** If `shell_execute` returns an error status > 1 and the Worker cannot fix it in 60 seconds, trigger `/agents architect` for deep debugging.