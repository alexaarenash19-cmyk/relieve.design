-- Explorar spec (docs/superpowers/specs/2026-07-26-explorar-colecciones-
-- design.md) wants Ciudad de México classified as its own "Mexico" filter
-- category, distinct from the international "Ciudad" pieces (Shanghái,
-- París, Londres, Barcelona) — the opposite of what
-- 20260727010001_catalog_cleanup_and_puzzle.sql deliberately did days
-- earlier (merged CDMX back into plain 'ciudad' and locked the type
-- check to only 'ciudad'/'juego'). Re-opening it here per that spec.
--
-- NOT auto-applied: no Supabase credentials in the environment this was
-- written in. Ale runs this manually in the Supabase SQL editor, same as
-- every other migration in this repo. The frontend (src/lib/categories.js)
-- already handles either state gracefully — CDMX shows under "Ciudad"
-- until this runs, then under "Mexico" automatically, no frontend change
-- needed either way.
alter table places drop constraint places_type_check;
alter table places add constraint places_type_check
  check (type in ('ciudad', 'mexico', 'juego'));

update places set type = 'mexico' where slug = 'ciudad-de-mexico';
