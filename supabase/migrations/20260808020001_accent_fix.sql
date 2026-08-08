-- Corrección de acentos en places.name — 'Paris'/'Shanghai' se sembraron
-- sin acento en algún momento del desarrollo temprano; deberían ser
-- 'París'/'Shanghái' (español correcto, coincide con el resto del
-- catálogo: 'Ciudad de México', 'Ángel de la Independencia', etc.).
-- No afecta slugs ni ninguna otra columna.
--
-- Nota: ya se aplicó directamente contra la base de datos real — se agrega
-- aquí para que el historial de migraciones quede completo.

update places set name = 'París' where slug = 'paris';
update places set name = 'Shanghái' where slug = 'shanghai';
