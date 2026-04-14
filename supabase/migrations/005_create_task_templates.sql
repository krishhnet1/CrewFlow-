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
