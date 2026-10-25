# Native Grok Bot export and readable-source bundles

Patch Cassidy adapts to available native export tools. A readable-source bundle offers review, backup, provenance and explicit omissions; users may choose the built-in export route where it meets their needs. This kit does not replace the Bot runtime or implement a native API adapter.

## Reported capabilities, not release or round-trip proof

One account's first-party tool-catalog/managed-skill report on October 24, 2026 described `CreateBotShareJson` and `export-bot-template`. Both were already mentioned earlier that day. No public release date or official documentation URL was established by that report, and neither native export nor recipient import was executed for it. Check the current tools/schema in the user's account; these details are not a universal contract.

| Reported native surface | Review before using it |
|---|---|
| `CreateBotShareJson` | Stages a private draft Marketplace template of the calling Bot from a recipe. New published templates are public; team visibility was not offered. Draft preparation does not authorize publication. |
| Profile | Name, short storefront description, optional avatar color/shape; host copies live avatar. Verify what full instructions/configuration the current schema actually preserves. |
| Skills | Name, prose content and optional description; only actually installed account-library skills are packed. The host reportedly builds bodies from prose and rejects copied SKILL.md/YAML-frontmatter/live-reference entries. Keep exact readable source separately when byte fidelity matters. |
| Routines | Slug, description and prose job text; mechanical IDs/schedules become fill-in placeholders, not copied automation.json. Preserve readable cron/trigger/timezone/settings in a review-only omissions/source record. Never infer stored paused state. |
| Memory facts | Portable job/convention facts; episode/note lines and memory folders are not copied. Public source still requires explicit private-context review and a file/content allowlist. |
| Plugins | Installed Marketplace plugin IDs. Custom MCP servers/non-Marketplace connectors are excluded; preserve required service names/purposes without credentials. Connection permission remains separate. |
| Getting started | Names one supplied, actually installed skill; reported first-conversation invocation needs recipient verification. Keep an independent full bootstrap. |
| Review card and limits | Changes require another tool call; reported template-size cap has no confirmed value. Preview exact source and omissions before approving another draft. |

The managed `export-bot-template` procedure reportedly inspects memories, skills, routines and plugins, keeps portable workflows, removes private material, prepares a short Getting started skill, then makes one draft call and reports retained/omitted content. Follow its actual current instructions when available. A name appearing in this repository is not permission to invoke it or create prerequisite skills.

## Creator-to-recipient acceptance remains separate

After explicit approval of a native draft or readable-source export, verify what was actually saved. For a separately authorized recipient test, inspect full destination skill content/IDs, Bot enablement and routine state against the reviewed source. Record exact differences and transformations. A draft card, a share URL, successful tool return or one reported helper installation does not establish delivery or full-profile restoration. No claim here says the missing-skills issue is fixed.

If native export is unavailable or transforms required fields, offer the reviewed files and RECIPIENT_BOOTSTRAP.md with an explicit completeness report. Skills are account-wide; collision/no-overwrite and customization protections still apply. Do not execute imported hooks, connect apps or activate routines during inspection. This project has not run the native export-to-recipient round trip.
