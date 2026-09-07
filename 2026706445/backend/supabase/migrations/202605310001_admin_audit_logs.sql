create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  actor_user_id uuid,
  actor_email text,
  action text not null,
  target_type text not null,
  target_id text not null,
  target_label text,
  metadata jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists admin_audit_logs_created_idx
  on public.admin_audit_logs(created_at desc);

create index if not exists admin_audit_logs_actor_idx
  on public.admin_audit_logs(actor_user_id);

create index if not exists admin_audit_logs_target_idx
  on public.admin_audit_logs(target_type, target_id);

alter table public.admin_audit_logs enable row level security;

create policy "Admins read audit logs"
  on public.admin_audit_logs for select
  using ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');

create policy "Admins create audit logs"
  on public.admin_audit_logs for insert
  with check ((auth.jwt() -> 'app_metadata' ->> 'role') = 'admin');
