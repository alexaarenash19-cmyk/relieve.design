-- Fase 3 del brief de marca (docs/relieve-brand-brief.md, sección 3 "Colecciones
-- (Series)" y sección 16 decisión 8) — agrega la columna real `places.series`.
--
-- Por qué una columna nueva y no derivarla de columnas existentes: `series`
-- ("Origen" = ciudades dentro de México, "Travesía" = ciudades fuera de
-- México, "Cumbre" = montañas/picos) NO se puede calcular de forma
-- confiable a partir de `type` (`ciudad`/`juego`) + `country`. Un relieve de
-- montaña vendido como pieza de pared tendría `type='ciudad'` en la forma
-- (se enmarca y se cuelga igual que cualquier otra pieza de pared) pero
-- conceptualmente seguiría siendo "Cumbre" — la serie describe el
-- contenido/naturaleza del lugar (¿es una ciudad mexicana? ¿extranjera? ¿una
-- montaña?), no cómo se fabrica o se vende la pieza. Por eso `series` vive
-- desacoplada de `type`/`country` en su propia columna, en vez de un cálculo
-- derivado en la API o el frontend.
alter table places
  add column series text check (series in ('origen', 'travesia', 'cumbre'));

-- Backfill de las 6 piezas reales del catálogo (confirmado contra
-- 20260727010001_catalog_cleanup_and_puzzle.sql: 5 piezas de pared
-- (barcelona, ciudad-de-mexico, londres, paris, shanghai, type='ciudad') +
-- 1 puzzle (nevado-de-toluca, type='juego')).
update places set series = 'origen'   where slug = 'ciudad-de-mexico';
update places set series = 'travesia' where slug in ('paris', 'londres', 'shanghai', 'barcelona');
update places set series = 'cumbre'   where slug = 'nevado-de-toluca';
