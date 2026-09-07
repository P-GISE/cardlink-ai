create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null unique references auth.users(id) on delete cascade,
  slug text not null unique,
  display_name text not null,
  role text,
  headline text,
  bio text,
  location text,
  avatar_url text,
  email text,
  github_url text,
  portfolio_url text,
  contact_policy text not null default 'approval_required'
    check (contact_policy in ('instant', 'approval_required')),
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.profile_skills (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  unique (profile_id, name)
);

create table if not exists public.profile_interests (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  unique (profile_id, name)
);

create table if not exists public.profile_projects (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  name text not null,
  description text,
  period text,
  project_url text,
  sort_order integer not null default 0
);

create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  owner_profile_id uuid not null references public.profiles(id) on delete cascade,
  title text not null,
  description text not null,
  status text not null default 'recruiting'
    check (status in ('planning', 'recruiting', 'closed')),
  deadline date,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.project_roles (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  unique (project_id, name)
);

create table if not exists public.project_skills (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  unique (project_id, name)
);

create table if not exists public.project_interests (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  name text not null,
  unique (project_id, name)
);

create table if not exists public.project_applications (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references public.projects(id) on delete cascade,
  applicant_profile_id uuid not null references public.profiles(id) on delete cascade,
  message text,
  status text not null default 'pending'
    check (status in ('pending', 'accepted', 'rejected', 'withdrawn')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (project_id, applicant_profile_id)
);

create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  target_profile_id uuid not null references public.profiles(id) on delete cascade,
  requester_profile_id uuid not null references public.profiles(id) on delete cascade,
  status text not null default 'pending'
    check (status in ('pending', 'approved', 'rejected')),
  request_type text not null
    check (request_type in ('instant_reveal', 'approval_request')),
  message text,
  decided_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (target_profile_id, requester_profile_id)
);

create table if not exists public.recommendation_runs (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid not null references public.profiles(id) on delete cascade,
  source text not null default 'db_rules',
  created_at timestamptz not null default now()
);

create table if not exists public.recommendations (
  id uuid primary key default gen_random_uuid(),
  run_id uuid not null references public.recommendation_runs(id) on delete cascade,
  target_profile_id uuid not null references public.profiles(id) on delete cascade,
  recommended_profile_id uuid not null references public.profiles(id) on delete cascade,
  score integer not null check (score >= 0 and score <= 100),
  reason text not null,
  created_at timestamptz not null default now()
);

create index if not exists profiles_slug_idx on public.profiles(slug);
create index if not exists profiles_published_idx on public.profiles(is_published);
create index if not exists projects_published_idx on public.projects(is_published);
create index if not exists project_applications_project_idx on public.project_applications(project_id);
create index if not exists contact_requests_target_idx on public.contact_requests(target_profile_id);
create index if not exists recommendations_target_idx on public.recommendations(target_profile_id);

alter table public.profiles enable row level security;
alter table public.profile_skills enable row level security;
alter table public.profile_interests enable row level security;
alter table public.profile_projects enable row level security;
alter table public.projects enable row level security;
alter table public.project_roles enable row level security;
alter table public.project_skills enable row level security;
alter table public.project_interests enable row level security;
alter table public.project_applications enable row level security;
alter table public.contact_requests enable row level security;
alter table public.recommendation_runs enable row level security;
alter table public.recommendations enable row level security;

create policy "Published profiles are publicly readable"
  on public.profiles for select
  using (is_published = true or auth.uid() = user_id);

create policy "Users manage own profile"
  on public.profiles for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Published projects are publicly readable"
  on public.projects for select
  using (is_published = true);

create policy "Project owners manage own projects"
  on public.projects for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = projects.owner_profile_id
      and profiles.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = projects.owner_profile_id
      and profiles.user_id = auth.uid()
    )
  );

create policy "Published profile skills are publicly readable"
  on public.profile_skills for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = profile_skills.profile_id
      and (profiles.is_published = true or profiles.user_id = auth.uid())
    )
  );

create policy "Published profile interests are publicly readable"
  on public.profile_interests for select
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = profile_interests.profile_id
      and (profiles.is_published = true or profiles.user_id = auth.uid())
    )
  );

create policy "Users manage own profile skills"
  on public.profile_skills for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = profile_skills.profile_id
      and profiles.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = profile_skills.profile_id
      and profiles.user_id = auth.uid()
    )
  );

create policy "Users manage own profile interests"
  on public.profile_interests for all
  using (
    exists (
      select 1 from public.profiles
      where profiles.id = profile_interests.profile_id
      and profiles.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.profiles
      where profiles.id = profile_interests.profile_id
      and profiles.user_id = auth.uid()
    )
  );
