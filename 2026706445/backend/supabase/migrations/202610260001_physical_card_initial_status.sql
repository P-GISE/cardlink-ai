-- The backend service role retains its existing administrative workflow.
alter policy "Users create own physical card orders"
  on public.physical_card_orders
  with check (
    auth.uid() = user_id
    and status = 'payment_pending'
    and exists (
      select 1 from public.profiles
      where profiles.id = physical_card_orders.profile_id
      and profiles.user_id = auth.uid()
    )
  );
