-- brand-brief.md §18/§16 — numeración real de pieza/edición (decidida con
-- Ale, 8 ago 2026): secuencia global por pedido pagado. "Pieza N.º" y
-- "Edición N.º" son el mismo número (misma secuencia), no dos contadores
-- separados.
--
-- Se implementa como DEFAULT de columna, no como lógica en el webhook: la
-- única vía que inserta en order_items es createOrderFromSession en
-- api/webhooks/stripe.js, y solo se llama en checkout.session.completed —
-- es decir, order_items solo existen para pedidos ya pagados (no hay
-- concepto de order_item "borrador" en este schema; `carts` cubre esa
-- función antes del pago). Un DEFAULT nextval(...) en la columna logra
-- exactamente "asignar en el momento del pago" sin tocar el webhook ni
-- arriesgar que alguien inserte sin pasar por el valor.
--
-- Nota: este archivo documenta un cambio que ya se aplicó directamente
-- contra la base de datos real (mismo patrón de caveat que las migraciones
-- anteriores de series/curva_de_nivel) — se agrega aquí para que el
-- historial de migraciones quede completo.

create sequence if not exists piece_number_seq start 1;

alter table order_items add column if not exists piece_number int;

alter table order_items alter column piece_number set default nextval('piece_number_seq');
