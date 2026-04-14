create table locations (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name            text not null,
  address         text,
  timezone        text not null default 'America/Chicago',
  phone           text,
  latitude        numeric(9,6),
  longitude       numeric(9,6),
  geofence_radius_m integer not null default 100,
  enforce_geofence_on_qr boolean not null default false,
  qr_nonce        text,
  qr_nonce_date   date,
  archived_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_locations_org on locations(organization_id);

create table areas (
  id              uuid primary key default gen_random_uuid(),
  location_id     uuid not null references locations(id) on delete cascade,
  name            text not null,
  color           text not null default '#FF6B2C',
  sort_order      integer not null default 0,
  archived_at     timestamptz,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);
create index idx_areas_location on areas(location_id);

alter table profiles
  add constraint profiles_primary_area_fk
  foreign key (primary_area_id) references areas(id) on delete set null;
