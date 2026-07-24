-- PRD: checkout-abandonado + review-incentive (n8n). All price fields are
-- integer MXN cents (decisions.md §4). Additive only — no existing columns
-- touched.

create table carts (
  id                  serial primary key,
  email               text,
  items               jsonb not null,   -- snapshot: [{place_id, place_slug, custom_place, size_code, frame_code, color_code, orientation, plate_text, capelo, qty, unit_price_cents}]
  subtotal_cents      int not null,
  stripe_session_id   text,
  purchase_completed  boolean default false,
  abandoned_email_sent boolean default false,
  created_at          timestamptz default now(),
  updated_at          timestamptz default now()
);

create index carts_abandoned_query_idx on carts (purchase_completed, abandoned_email_sent, created_at);
create index carts_stripe_session_id_idx on carts (stripe_session_id);

alter table orders add column delivered_at timestamptz;
alter table orders add column review_coupon_sent_at timestamptz;

create index orders_review_incentive_query_idx on orders (status, delivered_at, review_coupon_sent_at);

-- Sets delivered_at automatically the moment status transitions INTO
-- 'delivered' — so no code path that PATCHes order status needs to
-- remember to also set the timestamp (PRD §9.2 recommendation).
create or replace function set_delivered_at()
returns trigger as $$
begin
  if new.status = 'delivered' and old.status is distinct from 'delivered' then
    new.delivered_at = now();
  end if;
  return new;
end;
$$ language plpgsql;

create trigger orders_set_delivered_at
  before update on orders
  for each row
  execute function set_delivered_at();
