-- Issue #69: Storage buckets for GLB models and images (decisions.md §1)
-- Both public-read: aerial/thumb images and GLB models are served directly to the storefront.

insert into storage.buckets (id, name, public)
values ('models', 'models', true)
on conflict (id) do nothing;

insert into storage.buckets (id, name, public)
values ('images', 'images', true)
on conflict (id) do nothing;

create policy "Public read access for models and images"
on storage.objects for select
using (bucket_id in ('models', 'images'));
