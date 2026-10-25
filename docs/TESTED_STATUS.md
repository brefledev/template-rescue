# Tested status

This matrix describes intended acceptance scope. Run `node --test test/*.test.mjs` at the exact source revision to observe local results. No badge or statement here claims hosted CI or a native Grok test.

| Surface | Evidence available | Boundary |
|---|---|---|
| Exact manifest files, hashes, UTF-8 and limits | Local synthetic tests | Checks integrity, not author trust |
| Traversal, extra files and executable payloads | Local rejection tests | Stable local working copy assumed |
| Symlink rejection | Implemented; fixture creation denied by local host | Actual link test skipped/unverified here |
| Collisions and disabled existing skill | Local inventory fixtures | Real inventory access/completeness unverified |
| Long Unicode and truncation | Local byte-equality tests | Native platform limits unverified |
| Replay | Equivalent inventory order/JSON keys produce the same local plan digest | Remote idempotency unimplemented |
| Routines | Local schema refuses enabled routines | Native paused-state persistence unverified |
| Native skill creation/export | Reported tool mapping; no invocation | Actual round-trip acceptance unverified |
| Manual copy into Grok | Launcher and fallback provided | Actual acceptance and exact round trip unverified |
| Restore after partial failure | Design documented | No native writes or rollback implementation |
| Public source publication | Verify exact files at the reviewed commit | Repository existence alone does not prove source completeness |

Latest local revision run: 64 tests passed, zero failed, one host-restricted symlink test skipped (65 total). This includes the eight-file helper bundle, fictional creator-profile export with preserved timing/associations/omissions, partial/unknown completeness gates, creator-approved optional companion provenance, exact-source match consistency, screenshot coverage and update available/unchanged/local-conflict/approval-required cases. This is local synthetic evidence, not hosted CI or a native Grok round trip. No denied fixture creation was retried. Original artwork decodes as 40 frames at 1200×480; static WebP and SVG fallbacks are provided. The hosted GitHub README image rendered with natural dimensions 1200x480 on October 24, 2026; animation playback varies by client. Verify the canonical repository and every declared file at the immutable install source before claiming source readiness.

Investigate missing assets with direct account-wide inventories and enabled-state checks. An empty visible library or shortened model setup does not distinguish absence from disabled private skills. Do not assert a universal template-import defect.
