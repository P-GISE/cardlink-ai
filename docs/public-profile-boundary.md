# Public profile privacy boundary

Published profiles are served through `GET /api/profiles` and
`GET /api/profiles/:slug`. These routes use the server-only Supabase service-role
client and an explicit public serializer. The browser's Supabase client is used
for authentication; profile reads and writes use the Express API.

Public fields include identity/card presentation, business address, skills,
interests, and project descriptions/links. The existing business-address card
display remains public. Users should only put public information in these fields.
Phone, email, website URL, GitHub URL, portfolio URL, and auth user ID are not
returned by public profile endpoints. The public database queries also omit them.
The authenticated owner can still read/edit their private profile. Existing
contact requests reveal email, GitHub, and portfolio only after approval, or
immediately for an authenticated request when `contact_policy = 'instant'`.
Phone and website remain owner-only through the current API.

Migration `202610240001_private_profile_reads.sql` removes the policy that let
anonymous and unrelated authenticated clients read every column of a published
profile through Supabase REST. The existing owner policy is retained. Admin
operations continue through the authenticated admin API and its service-role
client; direct raw profile reads are not additionally granted to admin JWTs.
No rows, columns, authentication providers, or UI features are removed.
Related skill/interest policies that query profiles also stop returning other
users' rows directly; API service-role reads continue to provide these relations.

Apply all migrations in filename order before exposing a new database. Keep the
service-role key server-only. This change does not revoke data already fetched
under the old policy.

## Regression commands

From `2026706445/backend`, run `npm test` for API/profile-owner/contact regressions.
The privacy SQL fixture requires an empty disposable PostgreSQL database and a
superuser (never run its synthetic auth setup against Supabase or production):

```sh
psql -X -v ON_ERROR_STOP=1 "$TEST_DATABASE_URL" -f test/sql/profile-privacy.sql
```

It executes all existing migrations with synthetic `auth.users`, `auth.uid()`,
and `auth.jwt()` equivalents; grants normal data privileges; reproduces the old
anonymous leak; then applies the fix and uses actual non-superuser `SET ROLE`
queries to assert anonymous/unrelated reads are empty, owner reads and updates
work, unrelated updates fail, and the service-role retains API access. Assertions
fail the psql process. Success ends with `PROFILE_PRIVACY_SQL_PASS`; all fixture
changes are rolled back. API tests separately verify filtered HTTP responses and
the pending/approved contact flow; the SQL fixture does not simulate GoTrue or
PostgREST itself.
