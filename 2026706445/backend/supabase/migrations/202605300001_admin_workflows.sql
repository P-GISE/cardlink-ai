alter table public.project_applications
  drop constraint if exists project_applications_status_check;

alter table public.project_applications
  add constraint project_applications_status_check
  check (status in ('pending', 'accepted', 'rejected', 'withdrawn'));

alter table public.physical_card_orders drop constraint if exists physical_card_orders_status_check;

alter table public.physical_card_orders
  add constraint physical_card_orders_status_check
  check (
    status in (
      'payment_pending',
      'production_pending',
      'preparing',
      'printing',
      'printed',
      'shipping',
      'completed',
      'cancelled'
    )
  );

create index if not exists project_applications_applicant_idx
  on public.project_applications(applicant_profile_id);

create index if not exists project_applications_status_idx
  on public.project_applications(status);

create index if not exists contact_requests_requester_idx
  on public.contact_requests(requester_profile_id);
