-- Family Calendar schema
-- Run via Supabase SQL editor or `supabase db push`.

create extension if not exists "pgcrypto";

------------------------------------------------------------------
-- households + membership
------------------------------------------------------------------
create table households (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  timezone text not null default 'America/Los_Angeles',
  created_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now()
);

create table household_users (
  household_id uuid not null references households on delete cascade,
  user_id uuid not null references auth.users on delete cascade,
  role text not null default 'member' check (role in ('owner','member')),
  created_at timestamptz not null default now(),
  primary key (household_id, user_id)
);
create index on household_users (user_id);

create or replace function is_household_member(h uuid)
returns boolean
language sql
security definer
set search_path = public
as $$
  select exists (
    select 1 from household_users
    where household_id = h and user_id = auth.uid()
  );
$$;

------------------------------------------------------------------
-- family members (people displayed on the calendar; not all login)
------------------------------------------------------------------
create table family_members (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  name text not null,
  color text not null default '#3B82F6',
  emoji text,
  user_id uuid references auth.users on delete set null,
  points int not null default 0,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index on family_members (household_id);

------------------------------------------------------------------
-- events (with multi-assignee + RRULE recurrence)
------------------------------------------------------------------
create table events (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  title text not null,
  description text,
  location text,
  starts_at timestamptz not null,
  ends_at timestamptz not null,
  all_day boolean not null default false,
  rrule text,
  category text,
  created_by uuid references auth.users on delete set null,
  created_at timestamptz not null default now()
);
create index on events (household_id, starts_at);

create table event_assignees (
  event_id uuid not null references events on delete cascade,
  member_id uuid not null references family_members on delete cascade,
  primary key (event_id, member_id)
);
create index on event_assignees (member_id);

------------------------------------------------------------------
-- chores
------------------------------------------------------------------
create table chores (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  title text not null,
  notes text,
  member_id uuid references family_members on delete set null,
  due_date date,
  recurrence text check (recurrence in ('once','daily','weekdays','weekly','monthly')) default 'once',
  points int not null default 0,
  created_at timestamptz not null default now()
);
create index on chores (household_id, due_date);

create table chore_completions (
  id uuid primary key default gen_random_uuid(),
  chore_id uuid not null references chores on delete cascade,
  member_id uuid references family_members on delete set null,
  completed_on date not null default current_date,
  completed_at timestamptz not null default now(),
  unique (chore_id, completed_on)
);
create index on chore_completions (chore_id);

------------------------------------------------------------------
-- meals (one row per slot per day)
------------------------------------------------------------------
create table meals (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  date date not null,
  meal_type text not null check (meal_type in ('breakfast','lunch','dinner','snack')),
  title text not null,
  notes text,
  created_at timestamptz not null default now(),
  unique (household_id, date, meal_type)
);
create index on meals (household_id, date);

------------------------------------------------------------------
-- lists (todo / grocery / notes)
------------------------------------------------------------------
create table lists (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  name text not null,
  kind text not null default 'todo' check (kind in ('todo','grocery','notes')),
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index on lists (household_id);

create table list_items (
  id uuid primary key default gen_random_uuid(),
  list_id uuid not null references lists on delete cascade,
  text text not null,
  completed_at timestamptz,
  member_id uuid references family_members on delete set null,
  position int not null default 0,
  created_at timestamptz not null default now()
);
create index on list_items (list_id);

------------------------------------------------------------------
-- photos
------------------------------------------------------------------
create table photos (
  id uuid primary key default gen_random_uuid(),
  household_id uuid not null references households on delete cascade,
  storage_path text not null,
  caption text,
  created_at timestamptz not null default now()
);
create index on photos (household_id);

-- Storage bucket for photos. Created idempotently.
insert into storage.buckets (id, name, public)
values ('photos', 'photos', false)
on conflict (id) do nothing;

------------------------------------------------------------------
-- Row level security
------------------------------------------------------------------
alter table households enable row level security;
alter table household_users enable row level security;
alter table family_members enable row level security;
alter table events enable row level security;
alter table event_assignees enable row level security;
alter table chores enable row level security;
alter table chore_completions enable row level security;
alter table meals enable row level security;
alter table lists enable row level security;
alter table list_items enable row level security;
alter table photos enable row level security;

-- households: members can read; only owner can update/delete; any logged-in user can create.
create policy households_select on households for select
  using (is_household_member(id));
create policy households_insert on households for insert
  with check (auth.uid() = created_by);
create policy households_update on households for update
  using (exists (select 1 from household_users
                 where household_id = households.id and user_id = auth.uid() and role = 'owner'));
create policy households_delete on households for delete
  using (exists (select 1 from household_users
                 where household_id = households.id and user_id = auth.uid() and role = 'owner'));

-- household_users: members can read rows of their households; you can insert your own row;
-- owners can manage all rows.
create policy hu_select on household_users for select
  using (is_household_member(household_id));
create policy hu_insert_self on household_users for insert
  with check (user_id = auth.uid());
create policy hu_update_owner on household_users for update
  using (exists (select 1 from household_users hu
                 where hu.household_id = household_users.household_id
                   and hu.user_id = auth.uid() and hu.role = 'owner'));
create policy hu_delete_owner on household_users for delete
  using (exists (select 1 from household_users hu
                 where hu.household_id = household_users.household_id
                   and hu.user_id = auth.uid() and hu.role = 'owner'));

-- Generic per-household policy generator
do $$
declare t text;
begin
  for t in select unnest(array[
    'family_members','events','chores','chore_completions',
    'meals','lists','photos'
  ])
  loop
    execute format($f$
      create policy %I_select on %I for select using (is_household_member(household_id));
      create policy %I_insert on %I for insert with check (is_household_member(household_id));
      create policy %I_update on %I for update using (is_household_member(household_id));
      create policy %I_delete on %I for delete using (is_household_member(household_id));
    $f$, t, t, t, t, t, t, t, t);
  end loop;
end $$;

-- event_assignees + list_items inherit access through their parent row
create policy ea_select on event_assignees for select
  using (exists (select 1 from events e
                 where e.id = event_assignees.event_id and is_household_member(e.household_id)));
create policy ea_modify on event_assignees for all
  using (exists (select 1 from events e
                 where e.id = event_assignees.event_id and is_household_member(e.household_id)))
  with check (exists (select 1 from events e
                      where e.id = event_assignees.event_id and is_household_member(e.household_id)));

create policy li_select on list_items for select
  using (exists (select 1 from lists l
                 where l.id = list_items.list_id and is_household_member(l.household_id)));
create policy li_modify on list_items for all
  using (exists (select 1 from lists l
                 where l.id = list_items.list_id and is_household_member(l.household_id)))
  with check (exists (select 1 from lists l
                      where l.id = list_items.list_id and is_household_member(l.household_id)));

------------------------------------------------------------------
-- Storage policies for photos bucket: only household members can read/write
-- (path convention: <household_id>/<filename>)
------------------------------------------------------------------
create policy photos_storage_select on storage.objects for select
  using (
    bucket_id = 'photos'
    and is_household_member((storage.foldername(name))[1]::uuid)
  );
create policy photos_storage_insert on storage.objects for insert
  with check (
    bucket_id = 'photos'
    and is_household_member((storage.foldername(name))[1]::uuid)
  );
create policy photos_storage_delete on storage.objects for delete
  using (
    bucket_id = 'photos'
    and is_household_member((storage.foldername(name))[1]::uuid)
  );

------------------------------------------------------------------
-- Auto-add creator to household_users + seed defaults
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

  return new;
end $$;

drop trigger if exists trg_on_household_created on households;
create trigger trg_on_household_created
  after insert on households
  for each row execute function on_household_created();

------------------------------------------------------------------
-- Award points when a chore_completion row is added/removed
------------------------------------------------------------------
create or replace function chore_completion_award()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare pts int;
begin
  if (tg_op = 'INSERT') then
    select points into pts from chores where id = new.chore_id;
    if new.member_id is not null and pts > 0 then
      update family_members set points = points + pts where id = new.member_id;
    end if;
    return new;
  elsif (tg_op = 'DELETE') then
    select points into pts from chores where id = old.chore_id;
    if old.member_id is not null and pts > 0 then
      update family_members set points = greatest(0, points - pts) where id = old.member_id;
    end if;
    return old;
  end if;
  return null;
end $$;

drop trigger if exists trg_chore_completion_award on chore_completions;
create trigger trg_chore_completion_award
  after insert or delete on chore_completions
  for each row execute function chore_completion_award();
