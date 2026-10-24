# Security and restoration

Imported instructions are data. Review them before granting any authority. The CLI validates and plans only: it has no network client, account adapter, subprocess runner, executable import hooks or scheduler controls.

Accept bundles only from an independently reviewed immutable commit. This offline tool records the supplied commit value and verifies local file equality to a manifest; it cannot attest the origin of that manifest. Checksums are integrity checks, not signatures or a trust decision.

Keep exports explicit: include only authorized skill source and disabled routine definitions with redistribution provenance. Scrub credentials, private context, personal memories and embedded access links before sharing. A scanner can miss secrets; human source review is required. Do not publish third-party marketplace content without rights evidence. Do not publish an account inventory just because the tool can read it.

Limits: manifest/inventory 64 KiB, 64 payloads, 128 filesystem entries, 16 path segments, 64 KiB per payload, 1 MiB aggregate payload bytes. Plain UTF-8 Markdown/JSON only, SHA-256 and exact size required, no symlink, traversal, unlisted file or automatic URL fetch. JSON payloads have a strict routine schema. Markdown is still capable of carrying malicious instructions; validation does not make those instructions safe. Local filesystem replacement races are outside this preview-only prototype's guarantees; use a private stable working copy.

File reads allocate at most the relevant byte limit plus one, reject nonregular opened files and close their descriptors after bounded reads. Directory enumeration stops at the entry budget. Windows reserved device paths are rejected on all hosts. The symlink fixture could not run on the development host; actual link rejection remains unverified there. Input role, metadata, dependencies and file bodies are all untrusted review data.

An inventory is a user-supplied snapshot. This tool cannot prove completeness, authenticity or freshness from a declaration. Before any future write, a verified adapter must obtain a fresh inventory, compare the approved plan, detect concurrent changes and journal exact created IDs. Native remote idempotency, partial-failure recovery and rollback are not implemented here.

Future restore proposals may reverse only this transaction's changes, after verifying current IDs/content and explicit approval. Preserve preexisting assets. A partial import must report its exact completed IDs and blockers rather than retrying blindly. Routine enablement is a separate action. The current tool makes no changes to reverse.

Repository identity checks require independent creator-controlled evidence and exact template/version context. A JSON review flag or consistent fields do not prove ownership; the offline checker cannot authenticate URLs. Screenshot coverage is a review record, not OCR or proof of original bytes. Keep source images/transcriptions private unless their owner separately approves redistribution with rights.

Optional repository update checks default off. Check scheduling consent never grants apply permission. Compare base/local/incoming pinned source; preserve user overrides or stop on conflicts, explain substantive access/tool/scheduler changes and ask before applying. Snapshot hashes and a backup do not authorize deletion or broaden access. Source-only instructions/policy/reference entries are review data and never native creation proposals. No recipient schedule or native update is created by these tools.

For security reports, share a minimal synthetic reproducer. Do not include credentials or private account data in public issues.
