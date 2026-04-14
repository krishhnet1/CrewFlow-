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
