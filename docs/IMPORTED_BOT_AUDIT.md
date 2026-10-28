# Audit an imported bot

After Add Bot, give Patch Cassidy the bot's name once. Patch obtains the installed inventory directly, shows the exact local export/report file list, waits for approval, and sends one export request for all approved skills. The bot saves the files; Patch reads them and handles follow-up messages. The user approves writes. A read-only inventory request may precede the export request when the exact list is unknown.

The [audit recipe](../bot/skills/audit-imported-bot.md) owns messaging and approval. The CLI below checks local evidence and emits JSON; it performs no account or file writes. Direct messaging and shared storage must exist in the actual runtime. Native completion requires an observed imported bot and the acceptance run below.

## Export format

Use a new `/workspace/<bot>-skills/` directory. Map each exact skill name to a unique lowercase hyphenated `.md` filename and review this mapping before writes. Each file contains a JSON metadata line between delimiter lines, then the exact original body. For example, `review-note.md`:

```markdown
---
{"name":"Review note","description":"Review the supplied note."}
---
Read the note. Load video-format-movie when a movie is requested.
```

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

Save that structure as `inventory.json`. `complete` reports whether the bot enumerated every associated installed skill, including disabled entries. An unreadable skill remains in the inventory with `path: null`, `bytes: null` and an `error` string. It is installed according to the bot, with an unverified body. The bot reports saved byte counts and failures directly to Patch. The helper checks each file independently.

An optional expected-list JSON file is an array of exact `{name, description}` objects transcribed from a list the user already pasted. Patch prepares it only after file-write approval. It adds no copying chore for the user. A missing expected list leaves template completeness unverified.

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

The reader accepts at most 64 skills, 64 KiB per file, 1 MiB total source and a 64 KiB inventory. It rejects unsafe/duplicate filenames, duplicate normalized names, symlink payloads, invalid UTF-8 and oversize data. Unexpected directory entries are reported and skipped. Use a stable local copy during checking. Keep JSON/Markdown audit reports outside the skill directory at the separately approved destinations.

Reference scanning recognizes load/use/invoke/run/require phrases with quoted names or hyphenated identifiers, and `skills/name.md` or `skills/name/SKILL.md` links. Filename slugs and exact normalized display names identify known entries. Candidates need full-body review: aliases, examples, conditional instructions and other prose can change their meaning. Patch reads every body and adds confirmed dependencies that the pattern scan misses. An absent reference in a complete bot-reported inventory is labelled **referenced but not installed**. A partial inventory yields **reference installation unverified**. Saved hashes prove the exported bytes; the bot's enumeration and its claims about full source retain their provenance.

## Repairs and reports

Only real original full text plus the original description can supply a repair. Review the exact skill list, bodies, destinations, collisions and effects; wait for approval, then read back any approved native writes. Names and references supply no replacement body. Missing references with no source go into the approved report as a short support message with bot/template identity if known, names, referring quotations and a request for the original source. Sending or publishing that report needs separate permission.

Screenshots are the last resort after direct export is unavailable, refused or incomplete and original source cannot otherwise be obtained. Request only missing evidence and follow the reconstruction recipe. The helper cannot inspect template bodies before import, use its own catalog to inspect another bot's skills, or verify instructions/memories/routines without separately approved exports of those fields.

## Native acceptance run — open

Use a consenting test bot with known original source and a supplied expected list. Record the actual runtime and tools. The user clicks Add Bot, gives the name once and approves the exact local writes. Patch resolves the bot, obtains the inventory, sends the export request, reads every shared file and produces the approved JSON/Markdown reports and one short chat summary. Observe that no user copy/paste or message relay is needed.

Check a complete export, a missing listed skill, a body referencing `video-format-movie` absent from the bot, a changed description, an unreadable body and an export refusal. Confirm approval precedes each write set, missing source is never invented, and the final report names all verification limits. Inspect the produced file set and messages as evidence. Automated local fixtures cover the checker; they do not supply this native-runtime acceptance evidence.
