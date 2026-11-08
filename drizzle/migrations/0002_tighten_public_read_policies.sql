drop policy "anyone logs events" on public.analytics_events;
create policy "anyone logs valid events" on public.analytics_events for insert to anon, authenticated
with check (event_type in ('search','whatsapp_click','product_view') and created_at > now() - interval '1 minute' and created_at < now() + interval '1 minute');

drop policy "public inventory" on public.inventory;
create policy "public inventory of published products" on public.inventory for select to anon, authenticated
using (
  (exists (select 1 from public.products p where p.id = product_id and p.status = 'published')
   and exists (select 1 from public.branches b where b.id = branch_id and b.is_active))
  or public.can(auth.uid(), 'product:read')
);

drop policy "public settings" on public.store_settings;
create policy "public settings row" on public.store_settings for select to anon, authenticated using (id = 1);
revoke select on public.store_settings from anon;
grant select (id, store_name, about, show_prices, show_quantities, currency, contact_address, whatsapp_channel_url, hero_image_url, updated_at) on public.store_settings to anon;

drop policy "anyone reads product images" on storage.objects;
create policy "read images used in the store" on storage.objects for select to anon, authenticated
using (
  bucket_id = 'product-images' and (
    public.can(auth.uid(), 'product:read')
    or exists (select 1 from public.products p where p.status = 'published' and p.images @> jsonb_build_array(jsonb_build_object('path', name)))
    or exists (select 1 from public.offers o where o.is_active and o.image_url = name)
    or exists (select 1 from public.store_settings s where s.id = 1 and s.hero_image_url = name)
  )
);