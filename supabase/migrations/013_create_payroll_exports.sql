create table payroll_exports (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  location_id     uuid references locations(id),
  period_start    date not null,
  period_end      date not null,
  exported_by     uuid not null references profiles(id),
  format          text not null check (format in ('csv','pdf')),
  file_path       text,
  total_hours     numeric(10,2),
  total_pay       numeric(12,2),
  created_at      timestamptz not null default now()
);
create index idx_payroll_org_period on payroll_exports(organization_id, period_start);

-- Hook the deferred FK from timesheets
alter table timesheets
  add constraint ts_paid_export_fk
  foreign key (paid_export_id) references payroll_exports(id) on delete set null;
