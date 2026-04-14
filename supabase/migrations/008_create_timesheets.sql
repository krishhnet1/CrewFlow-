-- Note: payroll_exports is created later (013); we add the FK then via ALTER.
create table timesheets (
  id                   uuid primary key default gen_random_uuid(),
  organization_id      uuid not null references organizations(id) on delete cascade,
  location_id          uuid not null references locations(id) on delete cascade,
  area_id              uuid not null references areas(id),
  employee_id          uuid not null references profiles(id),
  shift_id             uuid references shifts(id),
  clock_in_at          timestamptz not null,
  clock_out_at         timestamptz,
  break_minutes        integer not null default 0,
  clock_in_source      clock_source not null,
  clock_out_source     clock_source,
  clock_in_lat         numeric(9,6),
  clock_in_lng         numeric(9,6),
  device_reported_at   timestamptz,
  status               timesheet_status not null default 'in_progress',
  auto_closed          boolean not null default false,
  hours_worked         numeric(6,2),
  pay_rate_applied     numeric(6,2),
  pay_amount           numeric(8,2),
  day_type             day_type,
  approved_by          uuid references profiles(id),
  approved_at          timestamptz,
  paid_export_id       uuid,
  client_event_uuid    uuid unique,
  created_at           timestamptz not null default now(),
  updated_at           timestamptz not null default now()
);
create index idx_ts_org_clockin on timesheets(organization_id, clock_in_at);
create index idx_ts_emp_clockin on timesheets(employee_id, clock_in_at);
create index idx_ts_status on timesheets(status);
create index idx_ts_shift on timesheets(shift_id);
