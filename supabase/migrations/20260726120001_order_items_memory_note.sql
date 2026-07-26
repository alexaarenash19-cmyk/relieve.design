-- Sección 5 del brief Rayo X (jul 2026) — campo emocional opcional por pieza:
-- "En una frase, ¿por qué este lugar?" — se imprime en una tarjeta física
-- dentro del empaque. Vive en order_items (no en orders) porque es por
-- pieza, igual que plate_text.

alter table order_items add column if not exists memory_note text;
