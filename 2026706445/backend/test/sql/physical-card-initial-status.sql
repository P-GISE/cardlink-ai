\set ON_ERROR_STOP on
-- Disposable PostgreSQL only; no production credentials or rows.
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
\ir ../../supabase/migrations/202610240001_private_profile_reads.sql
\ir ../../supabase/migrations/202610260001_physical_card_initial_status.sql
grant usage on schema public, auth to anon, authenticated, service_role;
grant select, insert, update, delete on all tables in schema public to anon, authenticated, service_role;
insert into auth.users values ('00000000-0000-0000-0000-000000000001');
insert into public.profiles (id,user_id,slug,display_name,is_published)
values ('00000000-0000-0000-0000-000000000002',
        '00000000-0000-0000-0000-000000000001','synthetic-status','Synthetic status',false);
set local role authenticated;
set local request.jwt.claim.sub = '00000000-0000-0000-0000-000000000001';
do $$
declare next_status text;
begin
  foreach next_status in array array['production_pending','printed','completed','shipping'] loop
    begin
      insert into public.physical_card_orders
        (user_id,profile_id,recipient_name,recipient_phone,shipping_address,status)
      values (auth.uid(),'00000000-0000-0000-0000-000000000002',
              'Synthetic','synthetic-phone','Synthetic address',next_status);
    exception when insufficient_privilege then
      continue;
    end;
    raise exception 'regular user must not create an elevated initial status';
  end loop;
end $$;
insert into public.physical_card_orders
  (user_id,profile_id,recipient_name,recipient_phone,shipping_address,status)
values (auth.uid(),'00000000-0000-0000-0000-000000000002',
        'Synthetic','synthetic-phone','Synthetic address','payment_pending');
reset role;
set local role service_role;
insert into public.physical_card_orders
  (user_id,profile_id,recipient_name,recipient_phone,shipping_address,status)
values ('00000000-0000-0000-0000-000000000001','00000000-0000-0000-0000-000000000002',
        'Synthetic','synthetic-phone','Synthetic address','completed');
reset role;
rollback;
\echo PHYSICAL_CARD_INITIAL_STATUS_PASS
