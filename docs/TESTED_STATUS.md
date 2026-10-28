# Tested status

This matrix describes intended acceptance scope. Run `node --test test/*.test.mjs` at the exact source revision to observe local results. No badge or statement here claims hosted CI or a native Grok test.

Local 0.2.2 candidate, October 28, 2026: 102 tests pass with zero failures or skips on Node.js 24.22.1 / Windows. Three new regression tests preserve trailing `-*` in prose, commands, quotes and links; resolve matching installed skill prefixes; retain unmatched wildcards and exact missing names; and keep the three missing Director format references flagged. The helper bundle, legacy demo and creator example validate. Public commit and publication were explicitly approved on October 28, 2026. A wildcard match establishes at least one installed family member. Fresh-import native acceptance remains open.

Local 0.2.1 candidate, October 28, 2026: 99 tests pass on Node.js 24.22.1 / Windows. The supplied Director arrow/semicolon excerpt reproduces the missed-reference case; a ten-file synthetic export flags `video-format-movie`, `video-format-microdrama` and `video-format-ugc-ad`, while accepting the installed music-video format. JSON and name/description frontmatter, quoted/folded fields, preserved body bytes, missing-inventory creation and replay are covered. The helper treats an explicit audit request as authorization for its named local audit files; native changes retain separate approval. Public commit and publication for this follow-up were explicitly approved on October 28, 2026.

The Director's actual ten-file audit is user-reported evidence. These local fixtures use the supplied excerpt and synthetic source; native end-to-end acceptance remains open. The scanner deliberately fails unresolved same-prefix candidates, including possible false alarms. A file-derived inventory has unverified native completeness. The 0.2.0 record below preserves its earlier behavior and evidence.

Local 0.2.0 candidate, October 28, 2026: 93 tests passed with zero failures or skips on Node.js 24.22.1 / Windows. The nine-file helper bundle (six skills), legacy demo and creator example validate. Twelve new tests exercise exported UTF-8 bytes and hashes, metadata comparison, missing skills/references, partial and unreadable exports, malformed bodies, unsafe paths, size limits and the read-only CLI. Startup routes use direct imported-bot export after exact file-write approval. Screenshots remain the last resort. Public commit and publication were authorized for this candidate on October 28, 2026. Resolve the installation URL to an immutable commit and verify its declared files.

The local fixtures establish file-checker behavior. Direct bot messaging, native export completeness and the no-relay user flow require the [native acceptance run](IMPORTED_BOT_AUDIT.md#native-acceptance-run--open). The reference scanner reports explicit-pattern candidates; Patch must also read every full body. Original template source, native state and non-exported instructions/memories/routines retain explicit verification limits.

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
| Imported-bot file audit | Synthetic files, byte/body hashes, metadata checks, missing references, partial/unreadable exports and read-only CLI tests | Direct messaging and shared-file export remain untested in a native bot session |
| Restore after partial failure | Design documented | No native writes or rollback implementation |
| Public source publication | Verify exact files at the reviewed commit | Repository existence alone does not prove source completeness |

Local 0.1.3 candidate: 81 tests passed, zero failed, zero skipped on Node.js 24.22.1 / Windows. The eight-file helper bundle, three-file legacy demo and five-file creator example validate. The rebrand adds display names independent of namespaces, bounded optional `legacyNames`, conservative collision matching and matched native IDs in preview. Tests cover enabled/disabled legacy skills, opaque native IDs, unknown/changed content, normalized aliases, split matches, malformed aliases and older manifests. Existing creator-export, screenshot, source-update, approval and byte-integrity checks remain covered. Native Grok export/import remains untested; installed Bots were untouched. Brennan approved this rebrand for commit and publication to main on October 25, 2026. Resolve the installation URL to the full published commit and verify its declared files. The self-reference leaves publishedCommit null because a commit cannot embed its own hash. Current artwork/source/license evidence is documented in assets/signal-assembly/README.md and assets/article/README.md. Three retired Template Rescue hero assets remain recoverable in Git history.

The symlink fixture can be skipped explicitly with `UNFINISHED_BOTNESS_SKIP_SYMLINK_FIXTURE=1`; the legacy `TEMPLATE_RESCUE_SKIP_SYMLINK_FIXTURE=1` setting remains recognized. A skipped fixture carries its own unverified result.

Investigate missing assets with direct account-wide inventories and enabled-state checks. An empty visible library or shortened model setup does not distinguish absence from disabled private skills. Do not assert a universal template-import defect.
