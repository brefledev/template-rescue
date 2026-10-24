# Guided export

Public templates and private backups have different destinations. This framework
does not automatically export learned memory or scan an account for content.

Copy this request into the source Bot for read-only preparation:

```text
Prepare a read-only export proposal for the exact skill and disabled-routine IDs
I name. First report your actual list/read/export tools and account-wide scope.
Do not create files, change settings, enable routines or test-run a routine.
Routine Test may execute real work and consume usage; do not treat it as a dry run.

Show the exact full source bodies, source IDs, content byte counts, current Bot
enablement and routine state if your tools can read them. Mark inaccessible or
shortened content unknown. Do not reconstruct missing text from memory.

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
The Template Rescue manifest is a project-defined format, not a native Grok schema.
```

Before publication, a human must review the exact files for secrets/private
context and confirm redistribution rights. The validator catches some obvious
credential patterns but cannot certify a scrub. Keep inventory and private
backup files outside any public repository. Revalidate and read back the final
allowlisted bundle from its reviewed immutable commit.
