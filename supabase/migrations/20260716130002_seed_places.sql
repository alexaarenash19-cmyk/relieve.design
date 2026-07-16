-- Issue #71: seed pilot collection + 8-12 places (database.md principios, decisions.md §6)
-- Real coordinates for all places. aerial_url/thumb_url/model_url left NULL —
-- catalog launches on renders/placeholders per decisions.md §6, not blocking.

insert into collections (slug, name, sort) values
  ('ciudades-mexico', 'Ciudades de México', 1)
on conflict (slug) do nothing;

insert into places (collection_id, slug, name, type, country, lat, lng, elevation_m, base_price_cents, status)
select c.id, v.slug, v.name, v.type, v.country, v.lat, v.lng, v.elevation_m, 129900, 'active'
from (values
  ('monterrey',                  'Monterrey',                   'ciudad',  'MX', 25.686613, -100.316116, null),
  ('ciudad-de-mexico',           'Ciudad de México',             'ciudad',  'MX', 19.432608,  -99.133209, null),
  ('guadalajara',                'Guadalajara',                  'ciudad',  'MX', 20.659699, -103.349609, null),
  ('puebla',                     'Puebla',                       'ciudad',  'MX', 19.041297,  -98.206200, null),
  ('oaxaca',                     'Oaxaca',                       'ciudad',  'MX', 17.073185,  -96.726560, null),
  ('merida',                     'Mérida',                       'ciudad',  'MX', 20.967370,  -89.592586, null),
  ('san-miguel-de-allende',      'San Miguel de Allende',        'ciudad',  'MX', 20.914042, -100.744461, null),
  ('angel-de-la-independencia',  'Ángel de la Independencia',    'ciudad',  'MX', 19.427108,  -99.167577, null),
  ('gran-via',                   'Gran Vía',                     'ciudad',  'ES', 40.420191,   -3.705298, null),
  ('popocatepetl',               'Popocatépetl',                 'montana', 'MX', 19.023056,  -98.622778, 5426),
  ('pico-de-orizaba',            'Pico de Orizaba',               'montana', 'MX', 19.030556,  -97.268056, 5636)
) as v(slug, name, type, country, lat, lng, elevation_m)
cross join lateral (select id from collections where slug = 'ciudades-mexico') as c
on conflict (slug) do nothing;
