-- Core enums used across multiple tables.
create type user_role        as enum ('owner', 'manager', 'employee');
create type employment_type  as enum ('hourly', 'salaried');
create type shift_status     as enum ('draft', 'published', 'locked', 'offered', 'claim_pending', 'cancelled');
create type timesheet_status as enum ('upcoming', 'in_progress', 'pending', 'approved', 'late', 'discarded', 'auto_closed', 'paid');
create type day_type         as enum ('weekday', 'saturday', 'sunday', 'public_holiday');
create type clock_source     as enum ('qr', 'kiosk', 'phone_geofence', 'manager_manual');
create type trade_status     as enum ('pending_claim', 'claim_pending_approval', 'approved', 'denied', 'cancelled');
