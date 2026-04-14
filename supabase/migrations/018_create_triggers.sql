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
