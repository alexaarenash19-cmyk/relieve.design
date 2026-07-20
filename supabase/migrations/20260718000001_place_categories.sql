-- Expands places.type from ('ciudad','montana') to the full category
-- taxonomy (src/lib/categories.js) — reused by the experience view's
-- "tipo" filter and /colecciones' "por categoría" view, one taxonomy
-- instead of a separate collections-based grouping.

alter table places drop constraint places_type_check;
alter table places add constraint places_type_check
  check (type in ('ciudad','estadio','f1','mexico','montana'));

update places set type = 'mexico' where slug = 'ciudad-de-mexico';

insert into places (collection_id, slug, name, type, country, lat, lng, elevation_m, base_price_cents, status)
select c.id, v.slug, v.name, v.type, v.country, v.lat, v.lng, v.elevation_m, 129900, 'active'
from (values
  ('autodromo-hermanos-rodriguez', 'Autódromo Hermanos Rodríguez', 'f1',      'MX', 19.404200, -99.090700, null::integer),
  ('estadio-azteca',               'Estadio Azteca',               'estadio', 'MX', 19.302900, -99.150500, null::integer)
) as v(slug, name, type, country, lat, lng, elevation_m)
cross join lateral (select id from collections where slug = 'ciudades-mexico') as c
on conflict (slug) do nothing;
