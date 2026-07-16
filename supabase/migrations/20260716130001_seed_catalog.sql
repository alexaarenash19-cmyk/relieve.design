-- Issue #70: seed sizes/frames/colors/addons (database.md catálogos de personalización)
-- Placeholder MXN prices in cents (decisions.md §4) — adjust once real costing is set.

insert into sizes (code, label, price_cents, dims, sort) values
  ('chico',    'Chico',    99900,  '20x25 cm', 1),
  ('mediano',  'Mediano',  129900, '30x40 cm', 2),
  ('grande',   'Grande',   169900, '40x50 cm', 3),
  ('especial', 'Especial', 249900, '50x70 cm', 4)
on conflict (code) do nothing;

insert into frames (code, label, price_delta_cents, sort) values
  ('nogal', 'Nogal', 0,     1),
  ('roble', 'Roble', 20000, 2),
  ('negro', 'Negro', 0,     3)
on conflict (code) do nothing;

insert into colors (code, label, hex, sort) values
  ('blanco',    'Blanco',    '#FFFFFF', 1),
  ('arena',     'Arena',     '#C2B280', 2),
  ('grafito',   'Grafito',   '#4A4A4A', 3),
  ('terracota', 'Terracota', '#C1440E', 4)
on conflict (code) do nothing;

insert into addons (code, label, price_delta_cents) values
  ('capelo', 'Capelo de vidrio', 35000),
  ('placa',  'Placa grabada',    15000)
on conflict (code) do nothing;
