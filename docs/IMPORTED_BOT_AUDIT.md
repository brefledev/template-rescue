# Audit an imported bot

After Add Bot, give Patch Cassidy the bot's name once. An explicit "audit <bot>" request authorizes local writes under `/workspace/<bot>-skills/` and `/workspace/<bot>-audit.json`, `/workspace/<bot>-audit.md` and `/workspace/<bot>-audit-expected.json` when needed. Patch states the paths, obtains the installed inventory directly and sends one export request for every selected skill. The bot saves the files; Patch reads them and handles follow-up messages. Local inventory discovery and audit writes need no second approval. Native changes require separate review and approval.

The [audit recipe](../bot/skills/audit-imported-bot.md) owns messaging and authorization scope. The CLI checks local evidence, creates inventory.json when absent, and emits JSON. It preserves existing inventories and skill files and performs no account writes. Direct messaging and shared storage must exist in the actual runtime. Native completion requires an observed imported bot and the acceptance run below.

## Export format

Use a new `/workspace/<bot>-skills/` directory. Map each exact skill name to a unique lowercase hyphenated `.md` filename. For a repeat audit, use a fresh run subdirectory inside that root and point the checker there. Each file contains JSON or name/description frontmatter between delimiter lines, then the exact original body. For example, `review-note.md`:

```markdown
---
{"name":"Review note","description":"Review the supplied note."}
---
Read the note. Load video-format-movie when a movie is requested.
```

Ordinary frontmatter is also accepted:

```markdown
---
name: video-director
description: Select the format for a supplied scene.
---
Load the matching format skill: music video → video-format-music-video; acted story → video-format-movie; …
```

The parser supports flat plain scalars, JSON-style double-quoted strings, YAML single-quoted strings and folded `>-` descriptions. Tags, aliases and complex values for name/description are rejected. Extra frontmatter fields remain source data. The supplied Director excerpt above is the regression case; the earlier file is synthetic.

The wrapper uses UTF-8/LF; the body retains its actual characters and line endings. Preserve its ending exactly. This example is synthetic. `bytes` below is measured from the whole saved file, including metadata and delimiters; use actual byte counts rather than the illustrative placeholder:

```json
{
  "schemaVersion": 1,
  "botName": "Example Bot",
  "complete": true,
  "skills": [
    {
      "name": "Review note",
      "description": "Review the supplied note.",
      "path": "review-note.md",
      "bytes": 177
    }
  ]
}
```

Save that structure as `inventory.json`. If the bot omits it, the checker builds it from the saved skill metadata and measured byte counts, with `inventorySource: "derived-from-files"` and `complete: false`. The directory basename supplies the report label; native bot identity and inventory completeness retain their verification limits. An existing inventory is preserved, including when malformed. `complete` reports whether the bot enumerated every associated installed skill, including disabled entries. An unreadable skill remains in the inventory with `path: null`, `bytes: null` and an `error` string. It is installed according to the bot, with an unverified body. The bot reports saved byte counts and failures directly to Patch. The helper checks each file independently.

An optional expected-list JSON file is an array of exact `{name, description}` objects transcribed from a list the user already pasted. The audit request authorizes Patch to prepare it as the named audit-expected report. It adds no copying chore for the user. A missing expected list leaves template completeness unverified.

## Local checker

In a terminal with Node.js 22+ available, from the reviewed repository directory:

```text
node src/cli.mjs audit-import /workspace/example-bot-skills
```

With an approved expected-list file:

```text
node src/cli.mjs audit-import /workspace/example-bot-skills expected.json
```

Output includes measured file/body byte counts and SHA-256 hashes, per-skill PASS/FAIL/UNVERIFIED checks, expected skills missing from the inventory, missing-reference candidates with body lines and quotations, verification limits and a short summary. Exit 0 means processing completed without a failed check; overall completeness remains UNVERIFIED. Exit 2 means a failed audit check. Exit 1 means malformed/unsafe inputs or a checker error. No exit status proves original-template fidelity.

The reader accepts at most 64 skills, 64 KiB per file, 1 MiB total source and a 64 KiB inventory. It rejects unsafe/duplicate filenames, duplicate normalized names, symlink payloads, invalid UTF-8 and oversize data. Unexpected directory entries are reported and skipped. Use a stable local copy during checking. Keep JSON/Markdown audit reports outside the skill directory at the named audit report destinations.

Reference scanning recognizes load/use/invoke/run/require phrases with quoted names or hyphenated identifiers, `skills/name.md` or `skills/name/SKILL.md` links, and every lowercase hyphenated token with the same first prefix segment as an installed skill name or filename slug. Thus any `video-...` token is a candidate when the inventory contains `video-director`, including arrows, semicolons, tables, examples and URLs. Every unresolved candidate produces FAIL; conservative false alarms are intentional. Filename slugs and exact normalized display names identify known entries. Candidates need full-body review: aliases, examples, conditional instructions and other prose can change their meaning. Patch reads every body and adds confirmed dependencies that the pattern scan misses. An absent reference in a complete bot-reported inventory is labelled **referenced but not installed**. A partial or file-derived inventory yields **reference installation unverified**, while the unresolved candidate still fails for review. Saved hashes prove the exported bytes; the bot's enumeration and its claims about full source retain their provenance.

## Repairs and reports

Only real original full text plus the original description can supply a repair. Review the exact skill list, bodies, destinations, collisions and effects; wait for approval, then read back any approved native writes. Names and references supply no replacement body. Missing references with no source go into the audit report as a short support message with bot/template identity if known, names, referring quotations and a request for the original source. Sending or publishing that report needs separate permission.

Screenshots are the last resort after direct export is unavailable, refused or incomplete and original source cannot otherwise be obtained. Request only missing evidence and follow the reconstruction recipe. The helper cannot inspect template bodies before import, use its own catalog to inspect another bot's skills, or verify instructions/memories/routines without separately approved exports of those fields.

## Native acceptance run — open

Use a consenting test bot with known original source and a supplied expected list. Record the actual runtime and tools. The user clicks Add Bot and requests "audit <bot>" once, authorizing the named local audit files. Patch resolves the bot, obtains the inventory, sends the export request, reads every shared file and produces the approved JSON/Markdown reports and one short chat summary. Observe that no user copy/paste or message relay is needed.

Check a complete export, a missing listed skill, a body referencing `video-format-movie` absent from the bot, a changed description, an unreadable body and an export refusal. Confirm the audit request authorizes its local files, native changes still require separate approval, missing source is never invented, and the final report names all verification limits. Inspect the produced file set and messages as evidence. Automated local fixtures cover the checker; they do not supply this native-runtime acceptance evidence.
