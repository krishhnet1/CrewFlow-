-- 020_add_missing_tables.sql
-- Adds tables identified as gaps in the Deputy → CrewFlow migration:
--   leave_requests, employee_availability, pay_agreements, message_comments
-- Plus roster confirmation columns on shifts.

-- =============================================================================
-- leave_requests
-- =============================================================================
create table if not exists leave_requests (
  id               uuid primary key default gen_random_uuid(),
  organization_id  uuid not null references organizations(id) on delete cascade,
  employee_id      uuid not null references profiles(id),
  leave_type       text not null check (leave_type in ('vacation','sick','personal','bereavement','unpaid')),
  start_date       date not null,
  end_date         date not null,
  notes            text,
  status           text not null default 'pending' check (status in ('pending','approved','declined','cancelled')),
  decided_by       uuid references profiles(id),
  decided_at       timestamptz,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now(),
  check (end_date >= start_date)
);
create index if not exists leave_requests_org_start_idx on leave_requests(organization_id, start_date);
create index if not exists leave_requests_employee_idx on leave_requests(employee_id);
alter table leave_requests enable row level security;

create policy leave_read on leave_requests for select
  using (organization_id = current_org_id() and (employee_id = auth.uid() or is_owner_or_manager()));
create policy leave_insert_self on leave_requests for insert
  with check (organization_id = current_org_id() and employee_id = auth.uid());
create policy leave_update_manager on leave_requests for update
  using (organization_id = current_org_id() and is_owner_or_manager())
  with check (organization_id = current_org_id() and is_owner_or_manager());
create policy leave_update_self_pending on leave_requests for update
  using (employee_id = auth.uid() and status = 'pending')
  with check (employee_id = auth.uid());
create policy leave_delete_manager on leave_requests for delete
  using (organization_id = current_org_id() and is_owner_or_manager());

create trigger trg_touch_leave_requests before update on leave_requests
  for each row execute procedure touch_updated_at();

-- =============================================================================
-- employee_availability
-- =============================================================================
create table if not exists employee_availability (
  id              uuid primary key default gen_random_uuid(),
  employee_id     uuid not null references profiles(id) on delete cascade,
  day_of_week     integer not null check (day_of_week between 0 and 6),
  available_from  time,
  available_to    time,
  is_unavailable  boolean not null default false,
  notes           text,
  created_at      timestamptz not null default now()
);
create index if not exists employee_availability_employee_idx on employee_availability(employee_id);
alter table employee_availability enable row level security;

create policy availability_read on employee_availability for select
  using (exists (
    select 1 from profiles p
    where p.id = employee_availability.employee_id
      and p.organization_id = current_org_id()
  ));
create policy availability_write_self on employee_availability for all
  using (employee_id = auth.uid())
  with check (employee_id = auth.uid());
create policy availability_write_manager on employee_availability for all
  using (is_owner_or_manager() and exists (
    select 1 from profiles p
    where p.id = employee_availability.employee_id
      and p.organization_id = current_org_id()
  ))
  with check (is_owner_or_manager() and exists (
    select 1 from profiles p
    where p.id = employee_availability.employee_id
      and p.organization_id = current_org_id()
  ));

-- =============================================================================
-- pay_agreements (historical pay-rate tracking)
-- =============================================================================
create table if not exists pay_agreements (
  id              uuid primary key default gen_random_uuid(),
  employee_id     uuid not null references profiles(id) on delete cascade,
  effective_date  date not null,
  rate_weekday    numeric(6,2),
  rate_saturday   numeric(6,2),
  rate_sunday     numeric(6,2),
  rate_holiday    numeric(6,2),
  salary_annual   numeric(10,2),
  created_by      uuid not null references profiles(id),
  notes           text,
  created_at      timestamptz not null default now()
);
create index if not exists pay_agreements_employee_effective_idx
  on pay_agreements(employee_id, effective_date desc);
alter table pay_agreements enable row level security;

create policy pay_agreements_read on pay_agreements for select
  using (exists (
    select 1 from profiles p
    where p.id = pay_agreements.employee_id
      and p.organization_id = current_org_id()
      and (p.id = auth.uid() or is_owner_or_manager())
  ));
create policy pay_agreements_write on pay_agreements for all
  using (is_owner_or_manager() and exists (
    select 1 from profiles p
    where p.id = pay_agreements.employee_id
      and p.organization_id = current_org_id()
  ))
  with check (is_owner_or_manager() and exists (
    select 1 from profiles p
    where p.id = pay_agreements.employee_id
      and p.organization_id = current_org_id()
  ));

-- =============================================================================
-- message_comments
-- =============================================================================
create table if not exists message_comments (
  id          uuid primary key default gen_random_uuid(),
  message_id  uuid not null references messages(id) on delete cascade,
  author_id   uuid not null references profiles(id),
  body        text not null,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index if not exists message_comments_message_idx
  on message_comments(message_id, created_at);
alter table message_comments enable row level security;

create policy message_comments_read on message_comments for select
  using (exists (
    select 1 from messages m
    join locations l on l.id = m.location_id
    where m.id = message_comments.message_id
      and l.organization_id = current_org_id()
  ));
create policy message_comments_insert_self on message_comments for insert
  with check (
    author_id = auth.uid()
    and exists (
      select 1 from messages m
      join locations l on l.id = m.location_id
      where m.id = message_comments.message_id
        and l.organization_id = current_org_id()
    )
  );
create policy message_comments_update_self on message_comments for update
  using (author_id = auth.uid())
  with check (author_id = auth.uid());
create policy message_comments_delete_self_or_manager on message_comments for delete
  using (
    author_id = auth.uid()
    or (is_owner_or_manager() and exists (
      select 1 from messages m
      join locations l on l.id = m.location_id
      where m.id = message_comments.message_id
        and l.organization_id = current_org_id()
    ))
  );

create trigger trg_touch_message_comments before update on message_comments
  for each row execute procedure touch_updated_at();

-- =============================================================================
-- shifts: roster confirmation
-- =============================================================================
alter table shifts add column if not exists confirmation_status text
  not null default 'unconfirmed'
  check (confirmation_status in ('unconfirmed','confirmed','declined'));
alter table shifts add column if not exists confirmed_at timestamptz;
