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
