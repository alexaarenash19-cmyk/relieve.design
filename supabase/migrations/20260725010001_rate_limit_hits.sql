-- Backs lib/rateLimit.js — Supabase-based sliding-window rate limiting,
-- chosen over adding Redis/Upstash since Supabase is already in the stack
-- and the volume here doesn't need dedicated infra. RLS enabled (only the
-- backend, via service_role, ever touches this — same pattern as every
-- other table since the security review).

create table rate_limit_hits (
  id          serial primary key,
  bucket_key  text not null,
  created_at  timestamptz default now()
);

create index rate_limit_hits_bucket_created_idx on rate_limit_hits (bucket_key, created_at);

alter table rate_limit_hits enable row level security;

-- Old rows are only ever queried within the last few minutes (see
-- lib/rateLimit.js's windowMs) — without cleanup this table grows forever.
-- No pg_cron confirmed available on this Supabase plan, so this is a plain
-- function to run periodically (e.g. an n8n daily cron calling it via
-- `select cleanup_old_rate_limit_hits();`) rather than a built-in schedule.
create or replace function cleanup_old_rate_limit_hits()
returns void as $$
begin
  delete from rate_limit_hits where created_at < now() - interval '1 day';
end;
$$ language plpgsql;
