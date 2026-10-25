# Export your Grok Bot profile and skills

Public templates and private backups have different destinations. This framework
does not automatically export learned memory or scan an account for content.

Use [Export a creator's Bot](bot/skills/export-creator-bot.md) in the source Bot. Begin with guided inventory: the creator does not need to know native IDs. A share URL by itself is not a complete export. This workflow prepares readable source and a recipient handoff; native export/full-profile restoration remains untested.

## What belongs in a creator bundle?

| Source | Export treatment |
|---|---|
| Authored Bot role/instructions and readable profile fields | Exact text plus field names; preserve unknown/unreadable fields in an omissions report |
| Skills associated with the selected Bot | Full native name, one-line description and Markdown body, public stable ID, current per-Bot enablement or unknown |
| Routine definitions | Exact prompt and readable timing/trigger/timezone/settings as review-only source; disabled destination intent, never activate during export |
| Required connectors | Names and purpose only; no credentials, account identifiers or authorization URLs |
| Shareable authored configuration | Explicit creator-approved field allowlist; unknown fields remain unknown |
| Learned memory, private chats, account data and unrelated skills | Exclude from public template; any private backup is a separate request and destination |

Native IDs and private association mappings belong in a separate private record. The account-wide library is not permission to export every skill. Full readable source requires rights review; reconstructed or model-recalled text cannot be labelled an exact export.

## Copy into the source Bot

```text
Prepare a read-only export proposal for this selected Bot's authored profile,
instructions, associated skills, routine definitions and shareable configuration.
First report your actual list/read/export tools and account-wide scope. Guide me
through selecting this Bot and inspecting associations; do not require me to know
native IDs. Do not sweep unrelated account-wide skills into the export.
Do not create files, change settings, enable routines or test-run a routine.
Routine Test may execute real work and consume usage; do not treat it as a dry run.

Inventory readable authored profile fields and exact full instructions; each
selected skill's name, authored description and full body; current per-Bot
enablement; each routine's prompt, schedule OR trigger, timezone and other
readable settings. Record required connector names/purposes without secrets.
Preserve source-native IDs in a PRIVATE mapping, separate from stable public
bundle IDs. Report inventory/read limitations and every omitted, inaccessible,
shortened or unknown field. Do not reconstruct missing text from memory.

Give me an exact proposed export allowlist. Exclude private notes, learned memory,
raw chats, credentials, access links and unrelated files. List dependencies and
licensing/provenance for each asset. Do not include marketplace content without
established redistribution rights. Separate public-template source from any
private backup I independently request. Do not write or publish until I approve
the exact allowlist and source destination.

After a separately approved export, read back each exported file and compare its
full bytes with source. Record platform/date, exact source and destination,
tool limitations and any truncation. If native export is unavailable, provide
clearly labelled manual-copy source only where full content is actually readable.
The Unfinished Botness manifest is a project-defined format, not a native Grok schema.

After review, prepare manifest.json, exact profile/instruction and skill source,
disabled routine definitions, review-only configuration/timing/dependency notes,
completeness/omissions report, and RECIPIENT_BOOTSTRAP.md. Use the creator-bundle
example only as a shape; replace its fictional source, metadata and content.
Give me exact recipient Getting started text and a short optional memory pointer
using MY creator-owned bundle URL and full reviewed immutable commit, not the
helper kit URL. Do not fill an unknown URL or commit with a plausible guess.
```

Before publication, a human must review the exact files for secrets/private
context and confirm redistribution rights. The validator catches some obvious
credential patterns but cannot certify a scrub. Keep inventory and private
backup files outside any public repository. Revalidate and read back the final
allowlisted bundle from its reviewed immutable commit.

## Publish source, then share the Bot

Use the [creator bundle example](examples/creator/manifest.json) as a small project-defined layout. Keep its configuration/timing/completeness reference as review-only data: it is not a native API payload. Replace all fictional metadata and rehash exact source bytes. The existing validator verifies Markdown/JSON bundles; it does not extract an account or prove full native restoration.

After the creator approves the exact allowlist and destination, save to their GitHub repository or another user-approved readable destination. Read back every file and verify complete text, byte counts and hashes. Mark the result **complete declared source**, **partial with omissions**, or **manual-copy only** as supported by evidence. Unknown completeness blocks a complete-profile claim. Preserve unavailable fields explicitly; do not fill them from memory.

Associate that source with the original template/share URL through a credible creator-controlled link or creator confirmation. Include template identity, creator identity, exported version/date, readable source manifest and completeness report. Repo name/avatar alone is insufficient. Copy the reviewed pinned source pointer into the creator's Getting started/setup field where available, with separate permission to edit it; then independently inspect whether it survives sharing. Getting started survived one observed import, which is not a guarantee for every platform/version. Keep the same full bootstrap independently accessible beside the shared Bot URL. A short memory pointer is optional and cannot be the only route.

Use [RECIPIENT_BOOTSTRAP.md](RECIPIENT_BOOTSTRAP.md) for the creator's actual target Bot. Recipients verify creator/template/version, retrieve the pinned declared files, inspect absent versus disabled account assets and per-Bot associations, review exact diffs and approve each native change. Missing APIs/full readback produce an explicit partial/manual-only result. Routine creation requires authored timing and explicit disabled intent plus stored paused-state readback; source settings alone do not establish safe native state.

## Optional companion provenance

The creator may choose a short visible note: “Prepared with Unfinished Botness: https://github.com/brefledev/unfinished-botness. Optional tools for reviewing bot exports and imports; this target Bot works independently.” Show the exact note and destination and obtain the creator's approval before including it in export metadata or suggested sharing copy. Omit it by default. Keep the companion's source separate from the target Bot's own creator-owned bundle URL; do not substitute the helper repo as the target source.

An interested recipient can ask about the companion. A recipient Bot may offer it when relevant, with the user's choice, without installing anything automatically. This is visible optional provenance, not a required dependency, hidden instruction, recursive install loop, telemetry or automatic messaging. The exported Bot and full bootstrap remain usable without the companion. Do not publish unresolved name/URL placeholders or add a promotional note to someone else's bundle without their approval.
