-- brand-brief.md §16 decisión 9 — "Curva de Nivel": comunidad a nivel
-- sitio (no por pieza, así que no hay place_id — a diferencia de
-- `waitlist`). Solo email + timestamp, mismo patrón mínimo que `waitlist`
-- en 20260716120004_reviews_waitlist_capacity.sql. Unique en email: es una
-- lista de correo, un mismo correo no debe insertar duplicados en cada
-- reintento/doble-click.

create table curva_de_nivel (
  id         serial primary key,
  email      text not null unique,
  created_at timestamptz default now()
);

-- Mismo lockdown por defecto que 20260724010001_enable_rls_public_tables.sql
-- aplicó a las 11 tablas que existían entonces: sin políticas para
-- anon/authenticated, todo el acceso real pasa por /api/* con
-- SUPABASE_SERVICE_KEY (bypassa RLS). Esta tabla nace después de esa
-- migración, así que necesita su propio ENABLE explícito para no quedar
-- expuesta por default.
alter table curva_de_nivel enable row level security;
