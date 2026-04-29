-- Adds lights, automation scenes, and notes for the family calendar.
-- Idempotent-ish: assumes 0001 has run.

------------------------------------------------------------------
-- light_devices
------------------------------------------------------------------
create table light_devices (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  ip text not null,
  mac text,
  name text not null default 'Light',
  room text,
  last_seen timestamptz,
  position int not null default 0,
  created_at timestamptz not null default now(),
  unique (household_id, ip)
);
create index on light_devices (household_id);

------------------------------------------------------------------
-- automation_scenes
------------------------------------------------------------------
create table automation_scenes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  name text not null,
  emoji text,
  description text,
  actions jsonb not null default '[]'::jsonb,
  position int not null default 0,
  last_run_at timestamptz,
  created_at timestamptz not null default now()
);
create index on automation_scenes (household_id);

------------------------------------------------------------------
-- notes (family pinboard)
------------------------------------------------------------------
create table notes (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  author_member_id uuid references family_members on delete set null,
  body text not null,
  color text,
  pinned boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index on notes (household_id, created_at desc);
create index on notes (household_id, pinned);

------------------------------------------------------------------
-- RLS: same per-household pattern as 0001
------------------------------------------------------------------
alter table light_devices enable row level security;
alter table automation_scenes enable row level security;
alter table notes enable row level security;

do $$
declare t text;
begin
  for t in select unnest(array['light_devices','automation_scenes','notes'])
  loop
    execute format($f$
      create policy %I_select on %I for select using (is_household_member(household_id));
      create policy %I_insert on %I for insert with check (is_household_member(household_id));
      create policy %I_update on %I for update using (is_household_member(household_id));
      create policy %I_delete on %I for delete using (is_household_member(household_id));
    $f$, t, t, t, t, t, t, t, t);
  end loop;
end $$;

------------------------------------------------------------------
-- Realtime: enable replication for the notes table so clients can subscribe
------------------------------------------------------------------
do $$ begin
  if not exists (
    select 1 from pg_publication_tables where pubname = 'supabase_realtime' and tablename = 'notes'
  ) then
    alter publication supabase_realtime add table notes;
  end if;
exception
  when undefined_object then null;
end $$;

------------------------------------------------------------------
-- Notes: keep updated_at fresh
------------------------------------------------------------------
create or replace function notes_touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists trg_notes_touch on notes;
create trigger trg_notes_touch
  before update on notes
  for each row execute function notes_touch_updated_at();

------------------------------------------------------------------
-- Extend on_household_created to seed starter scenes
------------------------------------------------------------------
create or replace function on_household_created()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.created_by is not null then
    insert into household_users (household_id, user_id, role)
    values (new.id, new.created_by, 'owner')
    on conflict do nothing;
  end if;

  insert into lists (household_id, name, kind, position) values
    (new.id, 'Groceries', 'grocery', 0),
    (new.id, 'To Do', 'todo', 1)
  on conflict do nothing;

  insert into automation_scenes (household_id, name, emoji, description, actions, position) values
    (new.id, 'Wake Up',     '☀️', 'All lights, daylight scene at 80%',
      '[{"type":"lights.scene","target":"all","scene":"daylight","dimming":80}]'::jsonb, 0),
    (new.id, 'Movie Night', '🎬', 'All lights to cozy at 25%',
      '[{"type":"lights.scene","target":"all","scene":"cozy","dimming":25}]'::jsonb, 1),
    (new.id, 'Bedtime',     '🌙', 'All lights to bedtime, very dim',
      '[{"type":"lights.scene","target":"all","scene":"bedtime","dimming":15}]'::jsonb, 2),
    (new.id, 'Away',        '🚪', 'All lights off',
      '[{"type":"lights.off","target":"all"}]'::jsonb, 3);

  return new;
end $$;
