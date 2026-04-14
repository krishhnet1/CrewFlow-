create table shifts (
  id                  uuid primary key default gen_random_uuid(),
  location_id         uuid not null references locations(id) on delete cascade,
  area_id             uuid not null references areas(id) on delete restrict,
  employee_id         uuid references profiles(id) on delete set null,
  original_employee_id uuid references profiles(id),
  starts_at           timestamptz not null,
  ends_at             timestamptz not null,
  break_minutes       integer not null default 0,
  notes               text,
  status              shift_status not null default 'draft',
  published_at        timestamptz,
  created_by          uuid not null references profiles(id),
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now(),
  check (ends_at > starts_at)
);
create index idx_shifts_loc_starts on shifts(location_id, starts_at);
create index idx_shifts_emp_starts on shifts(employee_id, starts_at);
create index idx_shifts_area_starts on shifts(area_id, starts_at);
create index idx_shifts_status on shifts(status);
