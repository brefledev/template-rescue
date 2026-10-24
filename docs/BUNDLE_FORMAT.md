# Bundle format v1

`manifest.json` names an exact set of UTF-8 payloads. The sample demonstrates the current schema; unknown keys are rejected. The manifest is capped at 64 KiB; no more than 64 payloads or 1 MiB aggregate payload bytes are allowed. Each payload is at most 64 KiB. Paths use `/`, stay inside the bundle, and contain no symlinks, traversal or executable file types. IDs and display names are unique within a bundle.

This is a project-defined portability format, not the native Grok configuration schema. It records role and dependency requirements as review data; it cannot install a role or dependency. Nonempty dependency requirements block the plan for manual review; no dependency is downloaded or inferred as satisfied.

| Field | Meaning |
|---|---|
| `schemaVersion` | `1` |
| `namespace` | Lowercase stable slug, used as every item ID prefix |
| `version` | Three-part numeric version |
| `role` | Human-readable bot purpose, at most 2048 characters |
| `dependencies` | Up to 16 `{ id, version, reason }` records; empty in the demo |
| `files` | Exact list of `{ id, name, description, kind, path, bytes, sha256, rights }` |
| File `description` | Explicitly authored one-line description, at most 512 characters |
| `kind` | `skill`, `instructions` or `policy` for Markdown; `routine` or `reference` for JSON |
| `rights` | `{ status: "original" or "authorized", license, source, evidence }`; human rights review still required |

Routine JSON is exactly `{ "id": "namespace/item", "prompt": "text", "enabled": false }`. It has no schedule, action hook or activation field. Skill text is framework source data; a native Grok format is not assumed.

Instructions, policies and JSON references are source-only review documents, not native skill/routine creation proposals. The original `bot/` bundle checksums all seven declared files: four recipes plus core instructions, routine policy and self-reference metadata. The manifest itself is the external integrity reference and must come from a reviewed immutable commit; its hashes do not authenticate it.

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

`content` may be `null` when retrieval is unsupported. Unknown existing content blocks a create proposal. The enabled flag must describe the current Bot view alongside an account-wide inventory; other Bots' enablement remains outside the snapshot. A complete empty `items` array is a declaration of absence, not proof. ID and case-insensitive name matching both matter. Existing source with equal bytes is unchanged even when disabled; it is never recreated or enabled by this tool.

Inventory timestamps use canonical UTC ISO form (`...Z`, optionally with three millisecond digits); invalid calendar dates are rejected. Display-name comparisons conservatively normalize Unicode with NFKC, trim surrounding whitespace and ignore case. Native IDs remain opaque and case-sensitive. Reordering equivalent inventory records or JSON object keys does not change the plan digest.

An existing active routine with identical source is an active no-op: the plan explicitly warns about its current state and proposes no pause or run. `enabled:false` is required for incoming routine definitions; it does not authorize changing a preexisting routine. Dependencies need manual review and block the plan; none are automatically installed.

Preview accepts a separately supplied 40-character Git commit claim, returns the exact files and line diffs, and hashes the plan for stable local replay comparison. Plan digests do not implement remote transactions. Every result has `accountWrites: false` and `requiresSeparateApproval: true`.

## Reported native mapping and open gates

A read-only capability report from one Grok Bot account on October 24, 2026 described `UpdateSkill` with action `write`, a display `name`, one-line `description` and Markdown `body`; omitting `id` creates and supplying it rewrites. This project has not invoked or independently verified that tool. Its fields are not a universal API contract. Our bundle ID is separate from any returned native ID, and no existing ID is passed for an automatic rewrite.

The same report described `UpdateRoutine` creation with a name, prompt, schedule or trigger, and `enabled` defaulting to true. Any future native creation must explicitly request `enabled:false` and verify the resulting paused state. The reported `get` fields do not establish that paused state can be read back, so routine acceptance remains blocked on direct evidence.

Both original bot recipes and synthetic examples carry authored one-line descriptions. The synthetic routine intentionally has no native timing and cannot be created as-is. A future adapter must require reviewed native fields and schema compatibility; it must not invent descriptions, schedules or triggers. No native adapter, native creation, enablement or scheduler test is implemented here.

## Acquisition review inputs

`match-preview` takes three JSON files. The request is `{templateId, templateUrl, creatorProfileUrl, version}`. The candidate is `{repositoryUrl, templateId, templateUrl, version}`; it may be `null`. The third file is an array of independently reviewed evidence records: `{kind, url, creatorProfileUrl, repositoryUrl, templateId, templateUrl, version, reviewedByOperator:true}`. Kind is `creator-controlled-crosslink` or `original-creator-confirmation`. Unknown version, mismatched identity or absent reviewed evidence requests screenshots. The review flag must reflect actual independent review; an imported repository cannot approve its own evidence. This tool checks declared consistency, not remote identity or truth.

`capture-preview` takes an array of exact expected names and an array of `{skillName, sequence, sourceImageId, startsAtBeginning, endsAtEnd, overlapReviewed, uncertainText}`. Sequence starts at 1 for each skill. All starts/ends and overlaps must be reviewed, uncertainty false, and every expected name covered before the result permits human content review. It still does not claim original-byte fidelity or installation. Image transcription is a separate user-reviewed activity.

## Source update inputs

`update-preview` takes baseline `{repositoryUrl, commit, files}`, current local `files`, and candidate `{repositoryUrl, commit, files}`. Each `files` is a JSON object mapping bounded relative Markdown/JSON paths to exact UTF-8 text. Both commits must be immutable 40-character values; the repository must match the independently recorded canonical source. Each snapshot is bounded to 64 files, 64 KiB per file and 1 MiB total; CLI input JSON remains capped at 64 KiB. Source snapshots and commit claims are supplied evidence, not authenticated by this offline tool.

Three-way comparison proposes changes only when local equals base, preserves local customizations when upstream equals base, and flags simultaneous edits as conflicts. Upstream removal needs manual review and never deletes an account resource. No relevant changes means no notification. Every result requires separate apply permission and changes no account permissions or scheduler state. Optional check preferences default off with weekly proposed cadence; manual/daily/weekly/monthly and user-selected day/time/timezone are proposals, not native routine creation.
