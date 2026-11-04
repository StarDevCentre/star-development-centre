# Teams, year groups and shared progress

Organisation staff and STAR managers have a Teams & progress tab. Create/rename/archive teams or year groups and add/remove parent-approved linked players. Multiple memberships are allowed. Archiving preserves data; grouping does not enrol, link or grant access to a player.

Organisation staff suggest player goals. STAR managers approve/decline pending suggestions, add feedback and mark approved suggestions completed. Revision checks reject stale reviews. Progress notes are append-only and can target approved organisation suggestions or current shared STAR development goals. Suggested goals are clearly separate from the player's IDP and do not automatically rewrite it. Prior notes on achieved STAR goals remain visible but those goals no longer accept new notes.

The new authenticated RPC uses verified identity, live active organisation membership or STAR manager access, and live parent sharing permission. Player-scoped reads and mutations filter by organisation and consent; mutations lock the linked-player row, serialising with consent updates. Every table is private, has RLS and an explicit deny policy, and has no direct browser grants. The public wrapper is invoker; the internal definer has an empty search path and explicit checks. Parent consent disclosure includes groups, goal suggestions and progress. No new access to private family information or photographs.

Validation: TypeScript and production build; rollback-only synthetic SQL verifies membership, approvals, pending-goal denial, existing-goal progress, stale-review rejection, cross-organisation denial, consent withdrawal, unverified denial, direct table/anonymous RPC denial, archive/remove behaviour and achieved-goal history. Synthetic fixtures and notes rolled back. No browser/usability tests or real player changes. Security advisor has no findings for the new objects.

Future resource-library work remains a separate batch.
