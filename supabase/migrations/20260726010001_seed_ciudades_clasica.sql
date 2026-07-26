-- Adds the "Ciudades Clásica" line: Barcelona, París, Londres, Shanghái.
-- Price stored in integer MXN cents (decisions.md §4); reuses the same base_price_cents
-- as the existing pieces for now — adjust before launch if this line should price differently.
-- price_delta_cents for the new "parota" frame defaults to 0 (same pattern as 'nogal' in
-- 20260716130001_seed_catalog.sql) — adjust once real costing for Parota Nacional is set.

insert into collections (slug, name, sort) values
  ('ciudades-clasica', 'Ciudades Clásica', 2)
on conflict (slug) do nothing;

insert into places (collection_id, slug, name, type, country, lat, lng, elevation_m, base_price_cents, status)
select c.id, v.slug, v.name, v.type, v.country, v.lat, v.lng, v.elevation_m, 129900, 'active'
from (values
  ('barcelona', 'Barcelona', 'ciudad', 'ES',  41.385064,   2.173404, null),
  ('paris',     'París',     'ciudad', 'FR',  48.856613,   2.352222, null),
  ('londres',   'Londres',   'ciudad', 'GB',  51.507351,  -0.127758, null),
  ('shanghai',  'Shanghái',  'ciudad', 'CN',  31.230391, 121.473701, null)
) as v(slug, name, type, country, lat, lng, elevation_m)
cross join lateral (select id from collections where slug = 'ciudades-clasica') as c
on conflict (slug) do nothing;

insert into frames (code, label, price_delta_cents, sort) values
  ('parota', 'Parota Nacional', 0, 4)
on conflict (code) do nothing;

insert into colors (code, label, hex, sort) values
  ('negromate', 'Negro mate', '#1C1C1C', 5)
on conflict (code) do nothing;
