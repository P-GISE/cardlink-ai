\set ON_ERROR_STOP on
-- Run only against a disposable, empty PostgreSQL database as a superuser.
begin;
create role anon nologin;
create role authenticated nologin;
create role service_role nologin bypassrls;
create schema auth;
create table auth.users (id uuid primary key);
create function auth.uid() returns uuid language sql stable as $$
  select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid
$$;
create function auth.jwt() returns jsonb language sql stable as $$
  select coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}')::jsonb
$$;
\ir ../../supabase/migrations/202605210001_service_foundation.sql
\ir ../../supabase/migrations/202605280001_physical_business_cards.sql
\ir ../../supabase/migrations/202605300001_admin_workflows.sql
\ir ../../supabase/migrations/202605310001_admin_audit_logs.sql
\ir ../../supabase/migrations/202606090001_physical_card_print_specs.sql
grant usage on schema public, auth to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;
insert into auth.users values
  ('00000000-0000-0000-0000-000000000001'),
  ('00000000-0000-0000-0000-000000000002'),
  ('00000000-0000-0000-0000-000000000003');
insert into public.profiles (user_id, slug, display_name, is_published, contact_policy, email, phone)
values
  ('00000000-0000-0000-0000-000000000001', 'owner-draft', 'Synthetic owner', false, 'approval_required', 'owner@example.invalid', 'synthetic-owner'),
  ('00000000-0000-0000-0000-000000000002', 'approval', 'Synthetic approval', true, 'approval_required', 'approval@example.invalid', 'synthetic-approval'),
  ('00000000-0000-0000-0000-000000000003', 'instant', 'Synthetic instant', true, 'instant', 'instant@example.invalid', 'synthetic-instant');

set local role anon;
do $$ begin
  assert (select count(phone) from public.profiles) = 2, 'RED prerequisite: old policy exposes published contact columns';
end $$;
reset role;
\echo RED_CONFIRMED: old policy exposes two private contact rows

\ir ../../supabase/migrations/202610240001_private_profile_reads.sql
set local role anon;
do $$ begin
  assert (select count(*) from public.profiles) = 0, 'anonymous raw reads must be empty';
  assert (select count(email) from public.profiles where slug = 'approval') = 0, 'filtered private reads must be empty';
end $$;
reset role;
\echo PASS: anonymous full and filtered reads blocked

set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
set local request.jwt.claims = '{"user_metadata":{"role":"admin"}}';
do $$ begin
  assert (select count(*) from public.profiles) = 1, 'authenticated owner sees only own draft';
  assert (select phone from public.profiles where slug = 'owner-draft') = 'synthetic-owner', 'owner private read preserved';
  assert (select count(*) from public.profiles where is_published) = 0, 'unrelated published rows must stay hidden';
  update public.profiles set headline = 'owner update' where slug = 'owner-draft';
  assert found, 'owner update preserved';
  update public.profiles set headline = 'unauthorized update' where slug = 'approval';
  assert not found, 'unrelated update blocked';
end $$;
reset role;
\echo PASS: owner private read and update preserved; unrelated reads and writes blocked

set local role service_role;
do $$ begin
  assert (select count(*) from public.profiles) = 3, 'service backend must retain all profile access';
  assert (select count(*) from public.profiles where is_published) = 2, 'public API source preserved';
  assert (select phone from public.profiles where slug = 'approval') = 'synthetic-approval', 'approved-contact API source preserved';
end $$;
reset role;
\echo PASS: backend public, approved-contact, and admin data access preserved
rollback;
\echo PROFILE_PRIVACY_SQL_PASS
