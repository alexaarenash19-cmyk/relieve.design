-- Security review 2026-07-24: of 12 tables in public, only `carts` had RLS
-- enabled (added in 20260723180001). The other 11 were fully readable/
-- writable via the Supabase REST API to anon/authenticated roles with zero
-- restriction. Today's app never ships the Supabase anon key to the browser
-- (all data access goes through server-side /api/* using SUPABASE_SERVICE_KEY,
-- which — like the `postgres` role n8n connects as — bypasses RLS entirely),
-- so this is defense-in-depth rather than a fix for an active exploit path.
-- No policies are added: this is a default-deny lockdown for anon/authenticated:
-- backend (service_role) and n8n (postgres role) are unaffected since both
-- bypass RLS by default in Supabase.

alter table addons enable row level security;
alter table capacity enable row level security;
alter table collections enable row level security;
alter table colors enable row level security;
alter table frames enable row level security;
alter table order_items enable row level security;
alter table orders enable row level security;
alter table places enable row level security;
alter table reviews enable row level security;
alter table sizes enable row level security;
alter table waitlist enable row level security;
