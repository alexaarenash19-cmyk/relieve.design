-- Issue #17: collections + places (database.md)
-- Price stored in integer MXN cents (decisions.md §4).
-- aerial_url/thumb_url/model_url nullable — frontend must handle "no image yet" (decisions.md §6).

create table collections (
  id         serial primary key,
  slug       text unique not null,
  name       text not null,
  photo_url  text,
  sort       int default 0,
  active     boolean default true
);

create table places (
  id                serial primary key,
  collection_id     int references collections(id),
  slug              text unique not null,
  name              text not null,
  type              text check (type in ('ciudad','montana')) not null,
  country           text default 'MX',
  lat               numeric(9,6),
  lng               numeric(9,6),
  elevation_m       int,
  story             text,
  aerial_url        text,
  model_url         text,
  thumb_url         text,
  base_price_cents  int not null,
  status            text check (status in ('active','soldout','preorder','draft')) default 'active',
  created_at        timestamptz default now()
);
