alter table public.profiles add column if not exists admin_hidden boolean not null default false;

-- Recover the last recorded moderator decision, including owner republishes since then.
with latest_decision as (
  select distinct on (target_id) target_id, metadata
  from public.admin_audit_logs
  where action = 'member_publication_updated' and target_type = 'profile'
    and jsonb_typeof(metadata -> 'isPublished') = 'boolean'
  order by target_id, created_at desc, id desc
)
update public.profiles p
set admin_hidden = not (d.metadata ->> 'isPublished')::boolean
from latest_decision d where p.id::text = d.target_id;

-- Only trusted server operations can change moderation or remove a hidden profile.
create or replace function public.protect_profile_moderation()
returns trigger language plpgsql set search_path = public as $$
begin
  if current_user not in ('postgres', 'service_role') then
    if tg_op = 'INSERT' and new.admin_hidden then
      raise exception 'Profile moderation requires administrator access';
    elsif tg_op = 'UPDATE' then
      if new.admin_hidden is distinct from old.admin_hidden
        or (old.admin_hidden and (new.id is distinct from old.id or new.user_id is distinct from old.user_id)) then
        raise exception 'Profile moderation requires administrator access';
      end if;
    elsif tg_op = 'DELETE' and old.admin_hidden then
      raise exception 'Hidden profiles require administrator removal';
    end if;
  end if;
  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger protect_profile_moderation
before insert or update or delete on public.profiles
for each row execute function public.protect_profile_moderation();
