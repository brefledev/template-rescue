# Bundle format v1

`manifest.json` names an exact set of UTF-8 payloads. Repository text uses LF line endings, enforced by `.gitattributes`, so Windows checkouts preserve payload hashes. External bundles are checked against their own exact declared bytes. The sample demonstrates the current schema; unknown keys are rejected. The manifest is capped at 64 KiB; no more than 64 payloads or 1 MiB aggregate payload bytes are allowed. Each payload is at most 64 KiB. Paths use `/`, stay inside the bundle, and contain no symlinks, traversal or executable file types. IDs are unique within a bundle. Current and legacy display names share one Unicode-normalized uniqueness check. Older bundles that omit `legacyNames` remain valid.

This is a project-defined portability format, not the native Grok configuration schema. It records role and dependency requirements as review data; it cannot install a role or dependency. Nonempty dependency requirements block the plan for manual review; no dependency is downloaded or inferred as satisfied.

| Field | Meaning |
|---|---|
| `schemaVersion` | `1` |
| `namespace` | Lowercase stable slug, used as every item ID prefix |
| `version` | Three-part numeric version |
| `role` | Human-readable bot purpose, at most 2048 characters |
| `dependencies` | Up to 16 `{ id, version, reason }` records; empty in the demo |
| `files` | Exact list of `{ id, name, description, kind, path, bytes, sha256, rights }` |
| File `name` | Human-readable display name, independent of the ID namespace; 1–160 characters, single line, nonblank |
| File `legacyNames` | Optional array of up to 16 former display names, with the same name bounds; used for collision detection |
| File `description` | Explicitly authored one-line description, at most 512 characters |
| `kind` | `skill`, `instructions` or `policy` for Markdown; `routine` or `reference` for JSON |
| `rights` | `{ status: "original" or "authorized", license, source, evidence }`; human rights review still required |

Routine JSON is exactly `{ "id": "namespace/item", "prompt": "text", "enabled": false }`. It has no schedule, action hook or activation field. Skill text is framework source data; a native Grok format is not assumed.

Instructions, policies and JSON references are source-only review documents, not native skill/routine creation proposals. The original `bot/` bundle checksums all nine declared files: six recipes plus core instructions, routine policy and self-reference metadata. The manifest itself is the external integrity reference and must come from a reviewed immutable commit; its hashes do not authenticate it.

The inventory JSON is:

```json
{
  "scope": "account-wide",
  "complete": true,
  "capturedAt": "2026-10-24T00:00:00Z",
  "items": [
    {
      "id": "template-rescue-demo/review-note",
      "name": "template-rescue-demo / Review note",
      "kind": "skill",
      "enabled": false,
      "content": "Exact full source bytes as UTF-8 text"
    }
  ]
}
```

`content` may be `null` when retrieval is unsupported. Unknown existing content blocks a create proposal. The enabled flag must describe the current Bot view alongside an account-wide inventory; other Bots' enablement remains outside the snapshot. A complete empty `items` array is a declaration of absence, not proof. ID and Unicode-normalized current/legacy name matching all matter. Existing source with equal bytes is unchanged even when disabled; it is never recreated or enabled by this tool.

Inventory timestamps use canonical UTC ISO form (`...Z`, optionally with three millisecond digits); invalid calendar dates are rejected. Display-name comparisons conservatively normalize Unicode with NFKC, trim surrounding whitespace and ignore case. Native IDs remain opaque and case-sensitive. Reordering equivalent inventory records or JSON object keys does not change the plan digest.

An existing active routine with identical source is an active no-op: the plan explicitly warns about its current state and proposes no pause or run. `enabled:false` is required for incoming routine definitions; it does not authorize changing a preexisting routine. Dependencies need manual review and block the plan; none are automatically installed.

Preview accepts a separately supplied 40-character Git commit claim, returns the exact files and line diffs, and hashes the plan for stable local replay comparison. Plan digests do not implement remote transactions. Every result has `accountWrites: false` and `requiresSeparateApproval: true`.

## Creator profile export source

`examples/creator/` demonstrates a selected Bot's authored profile, full skill source, disabled routine definition, target-Bot recipient bootstrap and review-only configuration reference. It is fictional and explicitly partial. `configuration.json` preserves readable profile fields, original skill names/descriptions, per-Bot associations, routine schedule/trigger/timezone/settings, connector names and omissions. It is not a native API payload. Private native IDs and account mappings stay outside the public bundle. Full source must be obtained through actual read capabilities or supplied readable files, not model recall.

A reference may declare `exportCompleteness: {status: "complete" | "partial" | "unknown", omissions: ["..."]}`. Status is creator-declared, not independently verified. A complete declaration with nonempty omissions is rejected. A partial/unknown declaration blocks the import plan's complete-profile path. All profile/configuration/bootstrap reference or instruction payloads remain source-only review, never automated native creation. Explicitly approved manual partial work must list omitted fields and cannot be called a complete restoration.

The routine payload still contains only ID, prompt and `enabled:false`; readable authored timing/trigger/timezone is preserved separately in the review-only configuration. A future native operation must map it using actual tools, explicit permission and paused-state readback. No timing is invented or activated by validation. Required connector names/purposes require separate recipient review/authorization, with no credentials or automatic connection. See EXPORT.md and RECIPIENT_BOOTSTRAP.md for creator-to-recipient handoff.

The helper retains its `template-rescue/*` stable IDs and `template-rescue` namespace. Its current display names use `Patch Cassidy / ...`; each entry declares its former `template-rescue / ...` name in `legacyNames`. For example, `template-rescue/getting-started` now displays as `Patch Cassidy / Getting started` and recognizes `template-rescue / Getting started`. The demo keeps its original namespace and display names as an older-format compatibility fixture.

Preview matches an inventory item by stable ID, current name or any legacy name. `existingMatches` reports every matching native ID/name/kind. A current exact ID/name/kind/content match remains a no-op; a legacy-name match, different native ID, unknown content or multiple matches blocks creation for explicit review. Current and legacy names are normalized with NFKC, surrounding whitespace trimming and case folding. Aliases overlapping another entry's current or legacy name are rejected, including normalized duplicates within one entry. Any approved migration must map to the existing returned native ID and preserve associations. These offline planners perform zero account writes.

The helper's name/persona is **Patch Cassidy** and the source project is **Unfinished Botness**. That name is included in INSTRUCTIONS.md, GETTING_STARTED.md and SELF_REFERENCE.json for all recipients. New installations use the manifest's Patch Cassidy display names. Existing installations are recognized through stable IDs and legacy names; changing their native names requires a separately approved migration. A single account's earlier install/readback report is secondary evidence, not proof of universal acceptance or the final source revision. Native export uses current platform capabilities where available; see NATIVE_EXPORT.md for reported transformations and open recipient-delivery tests.

An optional companion reference uses `{included, creatorApproved, sourceUrl, note}`. It defaults to omitted; inclusion without creator approval is rejected. The HTTPS source must have no credentials, query or fragment. This is visible review-only provenance, never a manifest dependency or native install operation. The target Bot remains independently usable. Publication still requires source review and replacing any unresolved owner-selected name.

## Native tools and open gates

A read-only capability report from one Grok Bot account on October 24, 2026 described `UpdateSkill` with action `write`, a display `name`, one-line `description` and Markdown `body`; omitting `id` creates and supplying it rewrites. This project has not invoked or independently verified that tool. Its fields are not a universal API contract. Our bundle ID is separate from any returned native ID, and no existing ID is passed for an automatic rewrite.

The same report described `UpdateRoutine` creation with a name, prompt, schedule or trigger, and `enabled` defaulting to true. Any future native creation must explicitly request `enabled:false` and verify the resulting paused state. The reported `get` fields do not establish that paused state can be read back, so routine acceptance remains blocked on direct evidence.

Both original bot recipes and synthetic examples carry authored one-line descriptions. The synthetic routine intentionally has no native timing and cannot be created as-is. A future adapter must require reviewed native fields and schema compatibility; it must not invent descriptions, schedules or triggers. No native adapter, native creation, enablement or scheduler test is implemented here.

## Acquisition review inputs

`match-preview` takes three JSON files. The request is `{templateId, templateUrl, creatorProfileUrl, version}`. The candidate is `{repositoryUrl, templateId, templateUrl, version}`; it may be `null`. The third file is an array of independently reviewed evidence records: `{kind, url, creatorProfileUrl, repositoryUrl, templateId, templateUrl, version, reviewedByOperator:true}`. Kind is `creator-controlled-crosslink` or `original-creator-confirmation`. Unknown version, mismatched identity or absent reviewed evidence routes to an imported-bot audit after Add Bot; screenshots remain the last resort after direct export fails or is refused and original source is unavailable. The review flag must reflect actual independent review; an imported repository cannot approve its own evidence. This tool checks declared consistency, not remote identity or truth.

`capture-preview` takes an array of exact expected names and an array of `{skillName, sequence, sourceImageId, startsAtBeginning, endsAtEnd, overlapReviewed, uncertainText}`. Sequence starts at 1 for each skill. All starts/ends and overlaps must be reviewed, uncertainty false, and every expected name covered before the result permits human content review. It still does not claim original-byte fidelity or installation. Image transcription is a separate user-reviewed activity.

## Source update inputs

`update-preview` takes baseline `{repositoryUrl, commit, files}`, current local `files`, and candidate `{repositoryUrl, commit, files}`. Each `files` is a JSON object mapping bounded relative Markdown/JSON paths to exact UTF-8 text. Both commits must be immutable 40-character values; the repository must match the independently recorded canonical source. Each snapshot is bounded to 64 files, 64 KiB per file and 1 MiB total; CLI input JSON remains capped at 64 KiB. Source snapshots and commit claims are supplied evidence, not authenticated by this offline tool.

Three-way comparison proposes changes only when local equals base, preserves local customizations when upstream equals base, and flags simultaneous edits as conflicts. Upstream removal needs manual review and never deletes an account resource. No relevant changes means no notification. Every result requires separate apply permission and changes no account permissions or scheduler state. Optional check preferences default off with weekly proposed cadence; manual/daily/weekly/monthly and user-selected day/time/timezone are proposals, not native routine creation.
