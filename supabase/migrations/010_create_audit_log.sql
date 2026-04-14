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
