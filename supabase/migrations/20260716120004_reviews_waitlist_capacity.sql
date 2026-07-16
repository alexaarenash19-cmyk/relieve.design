-- Issue #20: reviews + waitlist + capacity (database.md)

create table reviews (
  id         serial primary key,
  place_id   int references places(id),
  customer   text,
  city       text,
  rating     int check (rating between 1 and 5),
  photo_url  text,
  comment    text,
  approved   boolean default false,
  created_at timestamptz default now()
);

create table waitlist (
  id         serial primary key,
  place_id   int references places(id),
  size_code  text,
  email      text not null,
  notified   boolean default false,
  created_at timestamptz default now()
);

create table capacity (
  month     date primary key,
  max_units int,
  used      int default 0
);
