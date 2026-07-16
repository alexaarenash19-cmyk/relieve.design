-- Issue #19: orders + order_items (database.md)
-- All price fields are integer MXN cents (decisions.md §4).

create table orders (
  id                 serial primary key,
  number             text unique not null,
  email              text not null,
  status             text check (status in ('paid','in_production','shipped','delivered','cancelled')) default 'paid',
  currency           text default 'MXN',
  subtotal_cents     int not null,
  shipping_cents     int default 0,
  total_cents        int not null,
  is_gift            boolean default false,
  gift_message       text,
  shipping_address   jsonb,
  stripe_session_id  text,
  cfdi_uuid          text,
  tracking_number    text,
  status_token       text unique,
  created_at         timestamptz default now()
);

create table order_items (
  id               serial primary key,
  order_id         int references orders(id) on delete cascade,
  place_id         int references places(id),
  custom_place     text,
  size_code        text references sizes(code),
  frame_code       text references frames(code),
  color_code       text references colors(code),
  orientation      text default 'horizontal',
  plate_text       text,
  capelo           boolean default false,
  unit_price_cents int not null,
  qty              int default 1
);
