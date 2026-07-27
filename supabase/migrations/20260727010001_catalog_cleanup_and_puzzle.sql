-- Catalog cleanup: real catalog is 6 pieces (5 wall pieces at 15x15cm +
-- 1 puzzle at 20x20cm) confirmed by Ale — everything else was dev-phase
-- filler with no real photo and is removed, not just hidden.
--
-- Safety: order_items/reviews/waitlist reference places(id) with no ON
-- DELETE clause (default RESTRICT), so a hard delete would fail loudly if
-- a real order/review/waitlist signup already exists against one of these
-- filler places. Rather than assume that never happened on a live store,
-- this deletes each filler place only if nothing references it yet; any
-- place that IS referenced gets archived (status='draft', already a valid
-- status per places_status_check) instead, so it disappears from the
-- public catalog (api/catalog.js now excludes 'draft') without breaking a
-- real order's history.
do $$
declare
  v_slug text;
  v_id int;
  v_refs int;
  v_filler_slugs text[] := array[
    'monterrey', 'guadalajara', 'puebla', 'oaxaca', 'merida',
    'san-miguel-de-allende', 'angel-de-la-independencia', 'gran-via',
    'popocatepetl', 'pico-de-orizaba', 'autodromo-hermanos-rodriguez',
    'estadio-azteca'
  ];
begin
  foreach v_slug in array v_filler_slugs loop
    select id into v_id from places where slug = v_slug;
    if v_id is not null then
      select count(*) into v_refs from (
        select 1 from order_items where place_id = v_id
        union all
        select 1 from reviews where place_id = v_id
        union all
        select 1 from waitlist where place_id = v_id
      ) refs;

      if v_refs = 0 then
        delete from places where id = v_id;
      else
        update places set status = 'draft' where id = v_id;
      end if;
    end if;
  end loop;
end $$;

-- Ciudad de México no longer needs its own 'mexico' type now that every
-- other 'mexico'-type filler piece is gone — it rejoins the other 4 real
-- wall pieces as a plain 'ciudad', so the taxonomy isn't carrying a type
-- with exactly one member.
update places set type = 'ciudad' where slug = 'ciudad-de-mexico';

-- Real taxonomy going forward is just Pared ('ciudad') vs Juego ('juego')
-- — reusing places.type (see api/catalog.js: the separate `collections`
-- table/endpoint was already retired in favor of this single taxonomy),
-- not a new column.
alter table places drop constraint places_type_check;
alter table places add constraint places_type_check
  check (type in ('ciudad', 'juego'));

insert into collections (slug, name, sort) values
  ('juego', 'Juego', 3)
on conflict (slug) do nothing;

-- New piece: Nevado de Toluca puzzle. lat/lng/elevation_m intentionally
-- NULL — Ale asked not to use coordinates for this product at all (unlike
-- the wall pieces, it's not framed as "a map of an exact point"). story
-- left NULL for the same reason as the other placeholder fields in this
-- schema (decisions.md §6) — Product.jsx already skips the story
-- paragraph and the coordinates spec row when they're null, so this
-- renders cleanly today and Ale can fill in the real copy later.
insert into places (collection_id, slug, name, type, country, lat, lng, elevation_m, base_price_cents, status)
select c.id, 'nevado-de-toluca', 'Nevado de Toluca', 'juego', 'MX', null, null, null, 129900, 'active'
from collections c where c.slug = 'juego'
on conflict (slug) do nothing;

-- Real physical sizes confirmed by Ale for the 5 wall pieces — replaces
-- the placeholder dev-phase dims. 'grande' (Pieza de casa) is still
-- provisional ("déjame pensar") — Ale asked to use 80x80cm for now, to be
-- revisited.
update sizes set dims = '15x15 cm' where code = 'chico';
update sizes set dims = '64x64 cm' where code = 'mediano';
update sizes set dims = '80x80 cm' where code = 'grande'; -- PLACEHOLDER, pendiente de confirmar con Ale
update sizes set dims = '120x80 cm' where code = 'especial';

-- Puzzle has one fixed real size, no chico/mediano/grande/especial tiers.
insert into sizes (code, label, price_cents, dims, sort) values
  ('puzzle', 'Único', 129900, '20x20 cm', 5)
on conflict (code) do nothing;

-- Terracota color is dropped from the customer-facing selector (Ale
-- confirmed: contradicts the neutral-base brand standard) but the `colors`
-- row is intentionally NOT deleted here — same precedent as `nogal` in
-- frames (20260726010001_seed_ciudades_clasica.sql): kept only so any
-- existing order_items.color_code FK stays valid. The removal happens in
-- src/lib/catalog.js's COLORS export, not here.
