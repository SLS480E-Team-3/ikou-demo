-- Full Supabase setup for a fresh ikou-demo project, in run order.
-- Built from src/utils/schema.ts (*_SQL) and docs/SQL-query.md. Island 3 particle quests are left out (not in the demo).
begin;

-- USERS_SQL
create table profiles (
  id         uuid primary key references auth.users(id) on delete cascade,
  username   text not null unique check (btrim(username) <> '' and position('@' in username) = 0),
  name       text not null check (btrim(name) <> ''),
  color      text,
  created_at timestamptz not null default now()
);

-- ISLANDS_SQL
create table islands (
  id             bigint generated always as identity primary key,
  name           text not null,
  threshold      int  not null default 0,
  sort_order     int  not null unique
);

create table user_islands (
  user_id        uuid   not null references auth.users(id) on delete cascade,
  island_id      bigint not null references islands(id) on delete cascade,
  current_points int    not null default 0,
  unlocked_at    timestamptz,
  primary key (user_id, island_id)
);

-- ISLANDS_RLS_SQL
alter table islands      enable row level security;
alter table user_islands enable row level security;

create policy "islands readable by signed-in users"
  on islands for select
  to authenticated
  using (true);

create policy "users read own island progress"
  on user_islands for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- QUESTS_SQL
create table quests (
  id            bigint generated always as identity primary key,
  island_id     bigint not null references islands(id),
  title         text not null,
  reward_points int  not null default 0,
  kana          text
);

create table user_quests (
  user_id      uuid   not null references auth.users(id) on delete cascade,
  quest_id     bigint not null references quests(id) on delete cascade,
  started_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now(),
  completed_at timestamptz,
  primary key (user_id, quest_id)
);

-- QUESTS_RLS_SQL
alter table quests      enable row level security;
alter table user_quests enable row level security;

create policy "quests readable by signed-in users"
  on quests for select
  to authenticated
  using (true);

create policy "users read own quest progress"
  on user_quests for select
  to authenticated
  using ((select auth.uid()) = user_id);

-- FIRST_ISLAND_SEED_SQL
insert into islands (name, threshold, sort_order)
values ('Hajime Island', 0, 1)
on conflict (sort_order) do nothing;

insert into quests (island_id, title, reward_points)
select i.id, q.title, q.reward_points
from islands i
cross join (values
  ('Hiragana: a i u e o', 10),
  ('Greetings: konnichiwa', 10)
) as q(title, reward_points)
where i.sort_order = 1
  and not exists (select 1 from quests where quests.island_id = i.id and quests.title = q.title);

-- SIGNUP_TRIGGER_SQL
create function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = ''
as $$
begin
  insert into public.profiles (id, username, name)
  values (
    new.id,
    new.raw_user_meta_data ->> 'username',
    new.raw_user_meta_data ->> 'name'
  );
  insert into public.user_islands (user_id, island_id, unlocked_at)
  select new.id, id, now() from public.islands
  order by sort_order limit 1;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- PROFILE_LAST_ISLAND_SQL
alter table profiles
  add column last_island_id bigint references islands(id) on delete set null;

-- USERS_RLS_SQL
alter table profiles enable row level security;

create policy "profiles readable by signed-in users"
  on profiles for select
  to authenticated
  using (true);

create policy "users update own profile"
  on profiles for update
  to authenticated
  using ((select auth.uid()) = id)
  with check ((select auth.uid()) = id);

-- LOGIN_LOOKUP_SQL
create function public.email_for_username(p_username text)
returns text
language sql
stable
security definer set search_path = ''
as $$
  select u.email
  from auth.users u
  join public.profiles p on p.id = u.id
  where p.username = p_username;
$$;

revoke execute on function public.email_for_username(text) from public, anon, authenticated;
grant  execute on function public.email_for_username(text) to service_role;

-- docs/SQL-query.md: kana quests (the kana column is already in QUESTS_SQL)
update quests set kana = 'あ' where island_id = 1 and kana is null;
insert into quests (island_id, title, reward_points, kana)
select 1, k, (select reward_points from quests where island_id = 1 and kana = 'あ' limit 1), k
from unnest(array['い','う','え','お','か','き','く','け','こ','さ','し','す','せ','そ','た','ち','つ','て','と']) as k;

-- docs/SQL-query.md: quest tutorials
create table user_tutorials (
  user_id uuid not null references auth.users on delete cascade,
  quest_type text not null,
  seen_at timestamptz not null default now(),
  primary key (user_id, quest_type)
);
alter table user_tutorials enable row level security;
create policy "read own tutorials" on user_tutorials
  for select using (auth.uid() = user_id);

-- docs/SQL-query.md: island editor (Issue #1)
alter table quests add column if not exists level text;
alter table quests add column if not exists quest_type text;
alter table quests add column if not exists target jsonb;
insert into storage.buckets (id, name, public) values
  ('island-editor', 'island-editor', false),
  ('sprites', 'sprites', true)
on conflict (id) do nothing;

commit;

-- Islands 2–5 (ikko-vision.pdf): maps + NPCs, placeholder quests
-- The code keys maps by islands.id, so on a fresh project ids 2–5 must match sort_order 2–5.
-- threshold = points needed on the previous island: island 1 has 21 quests (210 points), islands 2–4 have 5 placeholders (50).
insert into islands (name, threshold, sort_order) values
  ('Kosoado Meadow', 100, 2),
  ('Forest Island', 50, 3),
  ('Port Town', 50, 4),
  ('Boss Island', 50, 5)
on conflict (sort_order) do nothing;

-- placeholder quests: one per island NPC (kana あ–お), run as the dodge quest
-- until each island's real quests are planned in its "Island X" GitHub issue; delete these then
insert into quests (island_id, title, reward_points, kana)
select i.id, 'Island ' || i.sort_order || ' placeholder: ' || k.kana, 10, k.kana
from islands i
cross join unnest(array['あ','い','う','え','お']) as k(kana)
where i.sort_order between 2 and 5
  and not exists (select 1 from quests q where q.island_id = i.id and q.kana = k.kana);
