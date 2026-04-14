create table holidays (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name            text not null,
  observed_date   date not null,
  created_at      timestamptz not null default now(),
  unique (organization_id, observed_date)
);
create index idx_holidays_org_date on holidays(organization_id, observed_date);
