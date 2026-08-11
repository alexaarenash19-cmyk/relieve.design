-- Hallazgo (auditoría 10 ago 2026, sesión 5): 20260724010001's propio
-- comentario afirma que `carts` "ya tenía RLS habilitado (agregado en
-- 20260723180001)" -- falso: esa migración solo crea la tabla, nunca
-- ejecuta `enable row level security`. `carts` quedó sin RLS desde su
-- creación, la única de las 12 tablas de public sin ningún tratamiento.
--
-- Mismo criterio que 20260724010001: defense-in-depth, no la corrección de
-- un exploit activo hoy (el front nunca recibe la anon key; todo acceso
-- pasa por /api/* con SUPABASE_SERVICE_KEY, que evade RLS igual que el rol
-- postgres de n8n). Sin políticas -- default-deny para anon/authenticated.

alter table carts enable row level security;
