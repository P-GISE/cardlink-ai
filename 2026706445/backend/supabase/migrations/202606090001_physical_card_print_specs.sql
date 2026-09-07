alter table public.physical_card_orders add column if not exists card_size text not null default 'kr_standard';

alter table public.physical_card_orders alter column paper_type set default 'snow_250';

alter table public.physical_card_orders
  drop constraint if exists physical_card_orders_card_size_check;

alter table public.physical_card_orders
  add constraint physical_card_orders_card_size_check
  check (card_size in ('kr_standard', 'eu_standard', 'us_standard'));

alter table public.physical_card_orders
  drop constraint if exists physical_card_orders_paper_type_check;

alter table public.physical_card_orders
  add constraint physical_card_orders_paper_type_check
  check (paper_type in ('snow_250', 'art_300', 'rendezvous_310'));
