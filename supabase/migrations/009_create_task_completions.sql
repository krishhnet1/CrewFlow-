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
