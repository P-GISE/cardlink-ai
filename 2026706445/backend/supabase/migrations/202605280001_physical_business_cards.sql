alter table public.profiles add column if not exists organization text;
alter table public.profiles add column if not exists position text;
alter table public.profiles add column if not exists phone text;
alter table public.profiles add column if not exists website_url text;
alter table public.profiles add column if not exists business_address text;
alter table public.profiles add column if not exists card_tagline text;

create table if not exists public.physical_card_orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  profile_id uuid not null references public.profiles(id) on delete cascade,
  template text not null default 'classic'
    check (template in ('classic', 'modern', 'portfolio')),
  accent_color text not null default '#2357d3',
  paper_type text not null default 'premium'
    check (paper_type in ('standard', 'premium', 'linen')),
  finish text not null default 'matte'
    check (finish in ('matte', 'glossy', 'none')),
  quantity integer not null default 100 check (quantity > 0),
  qr_placement text not null default 'back'
    check (qr_placement in ('front', 'back')),
  recipient_name text not null,
  recipient_phone text not null,
  shipping_address text not null,
  shipping_address_detail text,
  memo text,
  status text not null default 'payment_pending'
    check (status in ('payment_pending', 'preparing', 'printing', 'shipping', 'completed', 'cancelled')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists physical_card_orders_user_idx on public.physical_card_orders(user_id);
create index if not exists physical_card_orders_profile_idx on public.physical_card_orders(profile_id);
create index if not exists physical_card_orders_status_idx on public.physical_card_orders(status);

alter table public.physical_card_orders enable row level security;

create policy "Users read own physical card orders"
  on public.physical_card_orders for select
  using (auth.uid() = user_id);

create policy "Users create own physical card orders"
  on public.physical_card_orders for insert
  with check (
    auth.uid() = user_id
    and exists (
      select 1 from public.profiles
      where profiles.id = physical_card_orders.profile_id
      and profiles.user_id = auth.uid()
    )
  );
