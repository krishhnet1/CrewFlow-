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
