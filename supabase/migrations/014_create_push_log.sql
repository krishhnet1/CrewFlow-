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
