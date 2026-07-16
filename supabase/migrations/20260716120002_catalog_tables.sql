-- Issue #18: customization catalog tables (database.md)
-- All price fields are integer MXN cents (decisions.md §4).

create table sizes (
  code   text primary key,
  label  text,
  price_cents int,
  dims   text,
  sort   int
);

create table frames (
  code   text primary key,
  label  text,
  price_delta_cents int default 0,
  sort   int
);

create table colors (
  code  text primary key,
  label text,
  hex   text,
  sort  int
);

create table addons (
  code  text primary key,
  label text,
  price_delta_cents int default 0
);
