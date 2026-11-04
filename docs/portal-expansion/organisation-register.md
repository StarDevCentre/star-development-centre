# Organisation name-only register

Schools and clubs can add non-STAR names to teams and year groups in **Teams, year groups & progress** without a portal parental-approval step.

## Register behaviour

- Each entry stores only a name and its organisation/group associations.
- Names can belong to several teams or year groups. Staff can rename them, remove a group assignment, or delete a name from all groups in that organisation.
- Adding an entry does not create an account, invite a parent, create a STAR player record, or search for or link a matching STAR player.
- Duplicate names are allowed because different children may have the same name.
- Register entries have no sign-in, goals, progress, portal access, or other player features.

## Access boundaries

The register is stored separately from STAR player profiles. Verified current organisation members and STAR managers can manage it while the organisation is active. Reads and writes enforce organisation scope, and group assignments require an active group in the same organisation. Tables deny direct client access.

The existing parent-approved STAR-player flow remains separate. Current parent sharing permission is required to view shared STAR development records and to submit goals or progress. A register entry ID cannot be used in that flow, and matching names confer no access.

## Delivery and validation

Migration: `supabase/migrations/20261104052514_organisation_name_only_register.sql`.

Rollback-only checks: `supabase/tests/organisation_register_rls.sql`. These cover creation without parent sharing, rename, multiple-group assignment, idempotent assignment, group removal, deletion with cascading memberships, organisation isolation, verified membership checks, denied development access for register IDs, and unchanged account/player/link counts.
