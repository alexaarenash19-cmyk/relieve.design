-- F1/C6 (reporte consolidado de bugs, 13 ago 2026) — /personaliza nunca
-- tuvo un endpoint real: el formulario solo hacía setSent(true) client-side
-- (Personalize.jsx, Issue #54 original). Esta tabla es el lado de datos de
-- ese lead-capture, mismo patrón mínimo que `waitlist`/`curva_de_nivel` en
-- 20260716120004_reviews_waitlist_capacity.sql / 20260807010001_curva_de_nivel.sql.
-- Sin place_id: a diferencia de waitlist, el lugar pedido no existe todavía
-- en `places` — es texto libre que Ale revisa a mano para decidir si es
-- fabricable, no un slug real del catálogo.
create table personalize_requests (
  id         serial primary key,
  name       text not null,
  email      text not null,
  location   text not null,
  notes      text,
  created_at timestamptz default now()
);

-- Mismo lockdown por defecto que 20260724010001_enable_rls_public_tables.sql
-- aplicó a las tablas que existían entonces: sin políticas para
-- anon/authenticated, todo el acceso real pasa por /api/* con
-- SUPABASE_SERVICE_KEY (bypassa RLS). Esta tabla nace después de esa
-- migración, así que necesita su propio ENABLE explícito para no quedar
-- expuesta por default.
alter table personalize_requests enable row level security;
