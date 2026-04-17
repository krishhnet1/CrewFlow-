
-- =============================================================================
-- 001_create_enums.sql
-- =============================================================================

-- Core enums used across multiple tables.
create type user_role        as enum ('owner', 'manager', 'employee');
create type employment_type  as enum ('hourly', 'salaried');
create type shift_status     as enum ('draft', 'published', 'locked', 'offered', 'claim_pending', 'cancelled');
create type timesheet_status as enum ('upcoming', 'in_progress', 'pending', 'approved', 'late', 'discarded', 'auto_closed', 'paid');
create type day_type         as enum ('weekday', 'saturday', 'sunday', 'public_holiday');
create type clock_source     as enum ('qr', 'kiosk', 'phone_geofence', 'manager_manual');
create type trade_status     as enum ('pending_claim', 'claim_pending_approval', 'approved', 'denied', 'cancelled');

-- =============================================================================
-- 002_create_organizations.sql
-- =============================================================================

create table organizations (
  id               uuid primary key default gen_random_uuid(),
  name             text not null,
  owner_user_id    uuid not null references auth.users(id) on delete restrict,
  overtime_threshold_hours numeric(5,2) not null default 40.0,
  overtime_multiplier      numeric(4,2) not null default 1.5,
  pay_period       text not null default 'biweekly' check (pay_period in ('weekly','biweekly','semimonthly')),
  currency         text not null default 'USD',
  qr_signing_secret text not null default encode(gen_random_bytes(32), 'base64'),
  allow_unscheduled_clock_in boolean not null default false,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index idx_orgs_owner on organizations(owner_user_id);

-- =============================================================================
-- 003_create_profiles.sql
-- =============================================================================

create table profiles (
  id                  uuid primary key references auth.users(id) on delete cascade,
  organization_id     uuid not null references organizations(id) on delete cascade,
  first_name          text not null,
  last_name           text not null,
  email               text,
  phone               text,
  role                user_role not null default 'employee',
  employment_type     employment_type not null default 'hourly',
  avatar_color        text not null default '#FF6B2C',
  pin_hash            text,
  pin_failed_attempts integer not null default 0,
  pin_locked_until    timestamptz,
  rate_weekday        numeric(6,2),
  rate_saturday       numeric(6,2),
  rate_sunday         numeric(6,2),
  rate_public_holiday numeric(6,2),
  salary_annual       numeric(10,2),
  primary_area_id     uuid,
  -- NOTE: Array type is fine for <50 employees per org. Migrate to a junction
  -- table (employee_areas) if scaling beyond that.
  secondary_area_ids  uuid[] not null default '{}',
  start_date          date,
  archived_at         timestamptz,
  expo_push_token     text,
  locale              text not null default 'en',
  created_at          timestamptz not null default now(),
  updated_at          timestamptz not null default now()
);
create index idx_profiles_org on profiles(organization_id);
create index idx_profiles_role on profiles(role);
create unique index idx_profiles_email on profiles(lower(email)) where email is not null;

-- =============================================================================
-- 004_create_locations_areas.sql
-- =============================================================================

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

-- =============================================================================
-- 005_create_task_templates.sql
-- =============================================================================

create table area_task_templates (
  id          uuid primary key default gen_random_uuid(),
  area_id     uuid not null references areas(id) on delete cascade,
  title       text not null,
  sort_order  integer not null default 0,
  required    boolean not null default true,
  archived_at timestamptz,
  created_at  timestamptz not null default now()
);
create index idx_area_task_templates_area on area_task_templates(area_id);

-- =============================================================================
-- 006_create_shifts.sql
-- =============================================================================

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

-- =============================================================================
-- 007_create_shift_trades.sql
-- =============================================================================

create table shift_trade_offers (
  id                 uuid primary key default gen_random_uuid(),
  shift_id           uuid not null references shifts(id) on delete cascade,
  offered_by         uuid not null references profiles(id),
  reason             text,
  claimed_by         uuid references profiles(id),
  claimed_at         timestamptz,
  status             trade_status not null default 'pending_claim',
  manager_decision_by uuid references profiles(id),
  manager_decision_at timestamptz,
  created_at         timestamptz not null default now(),
  updated_at         timestamptz not null default now()
);
create index idx_trades_shift on shift_trade_offers(shift_id);
create index idx_trades_status on shift_trade_offers(status);

-- Only one active claim-pending-approval per shift at a time
create unique index idx_trades_single_active_claim
  on shift_trade_offers(shift_id)
  where status = 'claim_pending_approval';

-- =============================================================================
-- 008_create_timesheets.sql
-- =============================================================================

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

-- =============================================================================
-- 009_create_task_completions.sql
-- =============================================================================

create table task_completions (
  id                uuid primary key default gen_random_uuid(),
  timesheet_id      uuid not null references timesheets(id) on delete cascade,
  task_template_id  uuid not null references area_task_templates(id),
  title_snapshot    text not null,
  completed         boolean not null default false,
  completed_at      timestamptz,
  client_event_uuid uuid unique,
  created_at        timestamptz not null default now()
);
create index idx_task_completions_ts on task_completions(timesheet_id);

-- =============================================================================
-- 010_create_audit_log.sql
-- =============================================================================

create table timesheet_audit_log (
  id             uuid primary key default gen_random_uuid(),
  timesheet_id   uuid not null references timesheets(id) on delete cascade,
  actor_id       uuid not null references profiles(id),
  action         text not null,
  before_data    jsonb,
  after_data     jsonb,
  reason         text,
  created_at     timestamptz not null default now()
);
create index idx_ts_audit_ts on timesheet_audit_log(timesheet_id);

-- Append-only enforcement
create or replace function audit_log_no_mutate() returns trigger language plpgsql as $$
begin
  raise exception 'timesheet_audit_log is append-only';
end $$;

create trigger trg_audit_no_update before update on timesheet_audit_log
  for each row execute procedure audit_log_no_mutate();

create trigger trg_audit_no_delete before delete on timesheet_audit_log
  for each row execute procedure audit_log_no_mutate();

-- =============================================================================
-- 011_create_messages.sql
-- =============================================================================

create table messages (
  id            uuid primary key default gen_random_uuid(),
  location_id   uuid not null references locations(id) on delete cascade,
  author_id     uuid not null references profiles(id),
  body          text not null,
  pinned        boolean not null default false,
  silent        boolean not null default false,
  archived_at   timestamptz,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index idx_messages_loc_time on messages(location_id, created_at desc);
create index idx_messages_pinned on messages(location_id, pinned) where pinned = true;

create table message_reactions (
  id           uuid primary key default gen_random_uuid(),
  message_id   uuid not null references messages(id) on delete cascade,
  profile_id   uuid not null references profiles(id) on delete cascade,
  emoji        text not null check (emoji in ('👍','👀','✅')),
  created_at   timestamptz not null default now(),
  unique (message_id, profile_id, emoji)
);
create index idx_reactions_msg on message_reactions(message_id);

-- =============================================================================
-- 012_create_holidays.sql
-- =============================================================================

create table holidays (
  id              uuid primary key default gen_random_uuid(),
  organization_id uuid not null references organizations(id) on delete cascade,
  name            text not null,
  observed_date   date not null,
  created_at      timestamptz not null default now(),
  unique (organization_id, observed_date)
);
create index idx_holidays_org_date on holidays(organization_id, observed_date);

-- =============================================================================
-- 013_create_payroll_exports.sql
-- =============================================================================

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

-- =============================================================================
-- 014_create_push_log.sql
-- =============================================================================

create table push_notification_log (
  id           uuid primary key default gen_random_uuid(),
  profile_id   uuid not null references profiles(id) on delete cascade,
  title        text not null,
  body         text not null,
  data         jsonb,
  sent_at      timestamptz not null default now(),
  delivered    boolean,
  error        text
);
create index idx_push_profile_time on push_notification_log(profile_id, sent_at desc);

-- =============================================================================
-- 015_create_rls_functions.sql
-- =============================================================================

create or replace function current_profile()
returns profiles language sql stable as $$
  select * from profiles where id = auth.uid() limit 1;
$$;

create or replace function current_org_id()
returns uuid language sql stable as $$
  select organization_id from profiles where id = auth.uid();
$$;

create or replace function is_owner_or_manager()
returns boolean language sql stable as $$
  select role in ('owner','manager') from profiles where id = auth.uid();
$$;

create or replace function is_owner()
returns boolean language sql stable as $$
  select role = 'owner' from profiles where id = auth.uid();
$$;

-- =============================================================================
-- 016_enable_rls.sql
-- =============================================================================

alter table organizations         enable row level security;
alter table profiles              enable row level security;
alter table locations             enable row level security;
alter table areas                 enable row level security;
alter table area_task_templates   enable row level security;
alter table shifts                enable row level security;
alter table shift_trade_offers    enable row level security;
alter table timesheets            enable row level security;
alter table task_completions      enable row level security;
alter table timesheet_audit_log   enable row level security;
alter table messages              enable row level security;
alter table message_reactions     enable row level security;
alter table holidays              enable row level security;
alter table payroll_exports       enable row level security;
alter table push_notification_log enable row level security;

-- =============================================================================
-- 017_create_rls_policies.sql
-- =============================================================================

-- organizations
create policy org_read on organizations for select using (id = current_org_id());
create policy org_update on organizations for update using (id = current_org_id() and is_owner());

-- profiles
create policy profiles_read on profiles for select using (organization_id = current_org_id());
create policy profiles_update_self on profiles for update using (id = auth.uid()) with check (id = auth.uid());
create policy profiles_write_admin on profiles for all
  using (organization_id = current_org_id() and is_owner_or_manager())
  with check (organization_id = current_org_id() and is_owner_or_manager());

-- locations
create policy locations_read on locations for select using (organization_id = current_org_id());
create policy locations_write on locations for all
  using (organization_id = current_org_id() and is_owner_or_manager())
  with check (organization_id = current_org_id() and is_owner_or_manager());

-- areas
create policy areas_read on areas for select
  using (exists (select 1 from locations l where l.id = areas.location_id and l.organization_id = current_org_id()));
create policy areas_write on areas for all
  using (exists (select 1 from locations l where l.id = areas.location_id and l.organization_id = current_org_id()) and is_owner_or_manager())
  with check (exists (select 1 from locations l where l.id = areas.location_id and l.organization_id = current_org_id()) and is_owner_or_manager());

-- area_task_templates
create policy tasktmpl_read on area_task_templates for select
  using (exists (select 1 from areas a join locations l on l.id = a.location_id where a.id = area_task_templates.area_id and l.organization_id = current_org_id()));
create policy tasktmpl_write on area_task_templates for all
  using (exists (select 1 from areas a join locations l on l.id = a.location_id where a.id = area_task_templates.area_id and l.organization_id = current_org_id()) and is_owner_or_manager())
  with check (exists (select 1 from areas a join locations l on l.id = a.location_id where a.id = area_task_templates.area_id and l.organization_id = current_org_id()) and is_owner_or_manager());

-- shifts
create policy shifts_read on shifts for select using (
  exists (select 1 from locations l where l.id = shifts.location_id and l.organization_id = current_org_id())
  and (is_owner_or_manager() or employee_id = auth.uid() or status in ('published','offered'))
);
create policy shifts_write on shifts for all
  using (exists (select 1 from locations l where l.id = shifts.location_id and l.organization_id = current_org_id()) and is_owner_or_manager())
  with check (exists (select 1 from locations l where l.id = shifts.location_id and l.organization_id = current_org_id()) and is_owner_or_manager());

-- shift_trade_offers
create policy trades_read on shift_trade_offers for select
  using (exists (select 1 from shifts s join locations l on l.id = s.location_id where s.id = shift_trade_offers.shift_id and l.organization_id = current_org_id()));
create policy trades_write_self on shift_trade_offers for insert
  with check (offered_by = auth.uid());
create policy trades_update on shift_trade_offers for update
  using (
    exists (select 1 from shifts s join locations l on l.id = s.location_id where s.id = shift_trade_offers.shift_id and l.organization_id = current_org_id())
    and (is_owner_or_manager() or claimed_by = auth.uid() or offered_by = auth.uid())
  );

-- timesheets
create policy ts_read on timesheets for select
  using (organization_id = current_org_id() and (employee_id = auth.uid() or is_owner_or_manager()));
create policy ts_insert_self on timesheets for insert
  with check (organization_id = current_org_id() and employee_id = auth.uid());
create policy ts_update_manager on timesheets for update
  using (organization_id = current_org_id() and is_owner_or_manager())
  with check (organization_id = current_org_id() and is_owner_or_manager());
create policy ts_update_self_open on timesheets for update
  using (employee_id = auth.uid() and clock_out_at is null)
  with check (employee_id = auth.uid());

-- task_completions
create policy tc_rw on task_completions for all
  using (exists (select 1 from timesheets t where t.id = task_completions.timesheet_id
                   and t.organization_id = current_org_id()
                   and (t.employee_id = auth.uid() or is_owner_or_manager())))
  with check (exists (select 1 from timesheets t where t.id = task_completions.timesheet_id
                        and t.organization_id = current_org_id()
                        and (t.employee_id = auth.uid() or is_owner_or_manager())));

-- audit log (read-only for managers)
create policy audit_read on timesheet_audit_log for select
  using (exists (select 1 from timesheets t where t.id = timesheet_audit_log.timesheet_id and t.organization_id = current_org_id()) and is_owner_or_manager());

-- messages
create policy messages_read on messages for select
  using (exists (select 1 from locations l where l.id = messages.location_id and l.organization_id = current_org_id()));
create policy messages_write on messages for all
  using (exists (select 1 from locations l where l.id = messages.location_id and l.organization_id = current_org_id()) and is_owner_or_manager())
  with check (exists (select 1 from locations l where l.id = messages.location_id and l.organization_id = current_org_id()) and is_owner_or_manager());

-- reactions
create policy reactions_rw on message_reactions for all
  using (profile_id = auth.uid()
         and exists (select 1 from messages m join locations l on l.id = m.location_id where m.id = message_reactions.message_id and l.organization_id = current_org_id()))
  with check (profile_id = auth.uid());

-- holidays
create policy holidays_read on holidays for select using (organization_id = current_org_id());
create policy holidays_write on holidays for all
  using (organization_id = current_org_id() and is_owner())
  with check (organization_id = current_org_id() and is_owner());

-- payroll_exports
create policy payroll_rw on payroll_exports for all
  using (organization_id = current_org_id() and is_owner_or_manager())
  with check (organization_id = current_org_id() and is_owner_or_manager());

-- push_notification_log
create policy push_read_self on push_notification_log for select using (profile_id = auth.uid() or is_owner_or_manager());

-- =============================================================================
-- 018_create_triggers.sql
-- =============================================================================

-- Generic updated_at bumper
create or replace function touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end $$;

do $$ declare t text;
begin
  for t in select unnest(array['organizations','profiles','locations','areas','shifts',
                               'shift_trade_offers','timesheets','messages','payroll_exports']) loop
    execute format('create trigger trg_touch_%I before update on %I
                    for each row execute procedure touch_updated_at();', t, t);
  end loop;
end $$;

-- Auto-compute hours, pay rate, and pay amount when a timesheet is closed
create or replace function compute_timesheet_pay()
returns trigger language plpgsql as $$
declare
  emp profiles%rowtype;
  loc locations%rowtype;
  dt day_type;
  rate numeric(6,2);
  hours numeric(6,2);
begin
  if new.clock_out_at is null then return new; end if;
  select * into emp from profiles where id = new.employee_id;
  select * into loc from locations where id = new.location_id;
  hours := round(extract(epoch from (new.clock_out_at - new.clock_in_at)) / 3600.0 - (new.break_minutes / 60.0), 2);
  if hours < 0 then hours := 0; end if;
  if exists (
    select 1 from holidays
    where organization_id = new.organization_id
      and observed_date = (new.clock_in_at at time zone coalesce(loc.timezone, 'America/Chicago'))::date
  ) then
    dt := 'public_holiday';
  else
    case extract(dow from new.clock_in_at at time zone coalesce(loc.timezone, 'America/Chicago'))
      when 0 then dt := 'sunday';
      when 6 then dt := 'saturday';
      else dt := 'weekday';
    end case;
  end if;
  case dt
    when 'weekday'        then rate := emp.rate_weekday;
    when 'saturday'       then rate := emp.rate_saturday;
    when 'sunday'         then rate := emp.rate_sunday;
    when 'public_holiday' then rate := emp.rate_public_holiday;
  end case;
  new.hours_worked := hours;
  new.day_type := dt;
  new.pay_rate_applied := coalesce(rate, emp.rate_weekday, 0);
  new.pay_amount := round(new.hours_worked * new.pay_rate_applied, 2);
  return new;
end $$;

create trigger trg_compute_pay
  before insert or update of clock_out_at, break_minutes
  on timesheets
  for each row
  execute procedure compute_timesheet_pay();

-- QR rotation helper + cron
create extension if not exists pg_cron;

create or replace function rotate_qr_if_needed(p_location_id uuid)
returns void language plpgsql as $$
declare loc locations%rowtype; today_local date;
begin
  select * into loc from locations where id = p_location_id;
  today_local := (now() at time zone coalesce(loc.timezone, 'America/Chicago'))::date;
  if loc.qr_nonce_date is distinct from today_local then
    update locations set qr_nonce = encode(gen_random_bytes(12), 'base64'),
                        qr_nonce_date = today_local,
                        updated_at = now()
      where id = p_location_id;
  end if;
end $$;

select cron.schedule(
  'rotate-qr-nonces',
  '0 * * * *',
  $$ select rotate_qr_if_needed(id) from locations where archived_at is null $$
);

-- Auto clock-out cron (every 5 min)
create or replace function auto_close_overdue_timesheets()
returns integer language plpgsql as $$
declare updated_count integer;
begin
  with to_close as (
    select t.id, s.ends_at
    from timesheets t join shifts s on s.id = t.shift_id
    where t.clock_out_at is null and t.status = 'in_progress'
      and s.ends_at + interval '10 minutes' < now()
  )
  update timesheets t
    set clock_out_at = tc.ends_at,
        status = 'auto_closed',
        auto_closed = true,
        updated_at = now()
    from to_close tc where t.id = tc.id;
  get diagnostics updated_count = row_count;
  return updated_count;
end $$;

select cron.schedule('auto-clock-out', '*/5 * * * *', $$ select auto_close_overdue_timesheets() $$);

-- =============================================================================
-- 019_seed_teddys_chevron.sql
-- =============================================================================

-- Seed Teddy's Chevron — ONLY for development. Do not run in production.
-- Assumes auth.users row for rajeev has been created via Supabase dashboard.
-- Replace '<rajeev-auth-uid>' with the real UID before running.

do $$
declare
  v_org_id      uuid := '00000000-0000-0000-0000-000000000001';
  v_loc_id      uuid := '00000000-0000-0000-0000-000000000010';
  v_rajeev_uid  uuid := '<rajeev-auth-uid>';
  v_cashier_id  uuid;
  v_manager_id  uuid;
  v_stocker_id  uuid;
  v_overnight_id uuid;
begin
  insert into organizations (id, name, owner_user_id)
    values (v_org_id, 'Teddy''s Chevron', v_rajeev_uid)
    on conflict (id) do nothing;

  insert into profiles (id, organization_id, first_name, last_name, email, role, rate_weekday, rate_saturday, rate_sunday, rate_public_holiday)
    values (v_rajeev_uid, v_org_id, 'Rajeev', 'Paudel', 'rajeev@crewflow.dev', 'owner', 0, 0, 0, 0)
    on conflict (id) do nothing;

  insert into locations (id, organization_id, name, address, timezone)
    values (v_loc_id, v_org_id, 'Plum Grove', '7940 Plum Grove Rd, Plum Grove, TX 77327', 'America/Chicago')
    on conflict (id) do nothing;

  insert into areas (location_id, name, color, sort_order) values
    (v_loc_id, 'Cashier',         '#FF6B2C', 1) returning id into v_cashier_id;
  insert into areas (location_id, name, color, sort_order) values
    (v_loc_id, 'Manager',         '#3B82F6', 2) returning id into v_manager_id;
  insert into areas (location_id, name, color, sort_order) values
    (v_loc_id, 'STOCKER',         '#10B981', 3) returning id into v_stocker_id;
  insert into areas (location_id, name, color, sort_order) values
    (v_loc_id, 'Overnight Shift', '#8B5CF6', 4) returning id into v_overnight_id;

  insert into area_task_templates (area_id, title, sort_order) values
    (v_stocker_id, 'Refilled ice machine', 1),
    (v_stocker_id, 'Restocked coolers', 2),
    (v_stocker_id, 'Checked expiration dates', 3),
    (v_stocker_id, 'Swept floor', 4),
    (v_stocker_id, 'Emptied trash', 5);

  insert into holidays (organization_id, name, observed_date) values
    (v_org_id, 'New Year''s Day', '2026-01-01'),
    (v_org_id, 'Memorial Day',   '2026-05-25'),
    (v_org_id, 'Independence Day','2026-07-04'),
    (v_org_id, 'Labor Day',      '2026-09-07'),
    (v_org_id, 'Thanksgiving',   '2026-11-26'),
    (v_org_id, 'Christmas Day',  '2026-12-25')
  on conflict do nothing;
end $$;

-- =============================================================================
-- 020_add_missing_tables.sql
-- =============================================================================

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
