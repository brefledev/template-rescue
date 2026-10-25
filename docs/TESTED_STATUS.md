# Tested status

This matrix describes intended acceptance scope. Run `node --test test/*.test.mjs` at the exact source revision to observe local results. No badge or statement here claims hosted CI or a native Grok test.

| Surface | Evidence available | Boundary |
|---|---|---|
| Exact manifest files, hashes, UTF-8 and limits | Local synthetic tests | Checks integrity, not author trust |
| Traversal, extra files and executable payloads | Local rejection tests | Stable local working copy assumed |
| Symlink rejection | Windows junction fixture created and rejected in the current local run | Other hosts may skip when fixture creation is denied |
| Collisions and disabled existing skill | Local inventory fixtures | Real inventory access/completeness unverified |
| Rebrand compatibility | Stable IDs; current and legacy names; opaque native IDs; normalized and ambiguous collisions | Existing account names require a separately approved migration |
| Checkout bytes | LF attributes preserve all three bundle manifests under Windows `core.autocrlf=true` | External bundles still require their exact declared bytes |
| Long Unicode and truncation | Local byte-equality tests | Native platform limits unverified |
| Replay | Equivalent inventory order/JSON keys produce the same local plan digest | Remote idempotency unimplemented |
| Routines | Local schema refuses enabled routines | Native paused-state persistence unverified |
| Initial native helper creation | One account reported five installed skills plus a Bot profile with character readback of an earlier revision | Secondary report; not independently reproduced or a final-revision export/import test |
| Native export and recipient import | CreateBotShareJson/export-bot-template capability report; neither invoked for that report | Exported-template skill delivery and full-profile round trip untested |
| Manual copy into Grok | Launcher and fallback provided | Actual acceptance and exact round trip unverified |
| Restore after partial failure | Design documented | No native writes or rollback implementation |
| Public source publication | Verify exact files at the reviewed commit | Repository existence alone does not prove source completeness |

Local 0.1.3 candidate: 81 tests passed, zero failed, zero skipped on Node.js 24.22.1 / Windows. The eight-file helper bundle, three-file legacy demo and five-file creator example validate. The rebrand adds display names independent of namespaces, bounded optional `legacyNames`, conservative collision matching and matched native IDs in preview. Tests cover enabled/disabled legacy skills, opaque native IDs, unknown/changed content, normalized aliases, split matches, malformed aliases and older manifests. Existing creator-export, screenshot, source-update, approval and byte-integrity checks remain covered. Native Grok export/import remains untested; installed Bots were untouched. Brennan approved this rebrand for commit and publication to main on October 25, 2026. Resolve the installation URL to the full published commit and verify its declared files. The self-reference leaves publishedCommit null because a commit cannot embed its own hash. Current artwork/source/license evidence is documented in assets/signal-assembly/README.md and assets/article/README.md. Three retired Template Rescue hero assets remain recoverable in Git history.

The symlink fixture can be skipped explicitly with `UNFINISHED_BOTNESS_SKIP_SYMLINK_FIXTURE=1`; the legacy `TEMPLATE_RESCUE_SKIP_SYMLINK_FIXTURE=1` setting remains recognized. A skipped fixture carries its own unverified result.

Investigate missing assets with direct account-wide inventories and enabled-state checks. An empty visible library or shortened model setup does not distinguish absence from disabled private skills. Do not assert a universal template-import defect.
