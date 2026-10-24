-- Public profiles are served by the API's allowlisted serializer, not raw rows.
drop policy if exists "Published profiles are publicly readable" on public.profiles;
