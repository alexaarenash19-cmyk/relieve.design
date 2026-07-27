-- Sección 5 del brief Rayo X (jul 2026) — campo emocional opcional por pieza:
-- "En una frase, ¿por qué este lugar?" — se imprime en una tarjeta física
-- dentro del empaque. Vive en order_items (no en orders) porque es por
-- pieza, igual que plate_text.
--
-- Nota: esta columna ya fue agregada manualmente en Supabase (verificado
-- 2026-07-26) antes de que este archivo se subiera al repo — el `if not
-- exists` la hace idempotente, así que correrla de nuevo no hace nada.
-- Se documenta aquí para que el historial de migraciones quede completo.

alter table order_items add column if not exists memory_note text;
