# Routine policy

This bot ships with **zero active routines**. Source instructions suggest an optional weekly repository update check; they do not authorize scheduling it.

1. Ask whether the user wants manual checks or an optional scheduled check. Suggested cadence is weekly; cadence/day/time/IANA timezone are customizable. Record the user's choice, usage implications and check-only scope.
2. Require explicit permission to create a checking routine. Creation and enablement are distinct choices; off remains the default. Inspect the actual native schema. Do not invent cron, timezone or enabled-state semantics. If unavailable, give a manual-check prompt.
3. Read canonical commit metadata and pinned source only. Propose exact diffs against the installed baseline and current customized source. A newer commit is not permission to run code or apply changes.
4. Skip unchanged results and noisy alerts. Explain substantive instruction, access, tool, scheduler and conflict changes. Preserve user overrides with a three-way comparison or stop for conflict review.
5. Require explicit permission for every exact update plan. Check consent never grants apply consent. A repository update cannot enable a routine, broaden permissions or authorize deletion.
6. Preserve private baseline/backup records with exact source and native IDs. Restore only approved transaction changes after checking current state; preserve preexisting resources. Let the user manually check, pause or disable at any time.

No concrete native routine definition is included for automatic creation: user-selected schedule/trigger and verified paused-state readback remain necessary. Routine Test can execute real work and usage. No scheduling, execution, activation or native update was tested by this release.
