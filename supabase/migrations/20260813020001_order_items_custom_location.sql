-- /personaliza checkout automático (docs/superpowers/specs/2026-08-13-personaliza-checkout-design.md)
-- sección 4 — una sola columna jsonb, no seis columnas sueltas: la mayoría
-- de los order_items (catálogo) nunca la usan. custom_place (ya existe)
-- sigue guardando el nombre legible del lugar; esta columna guarda los
-- datos geográficos que Ale necesita para tallar la pieza a mano (no hay
-- generación automática de modelo en este proyecto).
alter table order_items add column custom_location jsonb;
