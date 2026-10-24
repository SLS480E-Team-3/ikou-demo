alter table quests add column kana text;
update quests set kana = 'あ' where island_id = 1 and kana is null;
insert into quests (island_id, title, reward_points, kana)
select 1, k, (select reward_points from quests where island_id = 1 and kana = 'あ' limit 1), k
from unnest(array['い','う','え','お']) as k;

insert into quests (island_id, title, reward_points, kana)
select 1, k, (select reward_points from quests where island_id = 1 and kana = 'あ' limit 1), k
from unnest(array['か','き','く','け','こ','さ','し','す','せ','そ','た','ち','つ','て','と']) as k;

-- Quest tutorials: user_tutorials
create table user_tutorials (
  user_id uuid not null references auth.users on delete cascade,
  quest_type text not null,
  seen_at timestamptz not null default now(),
  primary key (user_id, quest_type)
);
alter table user_tutorials enable row level security;
create policy "read own tutorials" on user_tutorials
  for select using (auth.uid() = user_id);

-- Island 3 particle quests (Issue #60): に, で, then a mix
-- kana holds the step key read by npcsForParticles / ParticleQuestIsland
insert into quests (island_id, title, reward_points, kana)
select 3, t.title, (select reward_points from quests where island_id = 1 and kana = 'あ' limit 1), t.kana
from (values ('Particle: に', 'に', 1), ('Particle: で', 'で', 2), ('Particles: に and で', 'mix', 3)) as t(title, kana, ord)
order by t.ord;

-- Island editor (Issue #1): quest columns + storage buckets
-- level / quest_type / target are set per quest in /IslandEditor.
-- target is a kana string for dodge ("あ"), {"answer": [...], "decoys": [...]} for door,
-- or {"group": "pronoun" | "adnominal" | "adverb" | "naAdjective"} for matching (no schema change).
alter table quests add column if not exists level text;
alter table quests add column if not exists quest_type text;
alter table quests add column if not exists target jsonb;

-- island-editor: <island>_ver<N>.json files (private; the server reads them with the secret key)
-- sprites: uploaded sprite images + index.json (public, so the game can load the images)
insert into storage.buckets (id, name, public) values
  ('island-editor', 'island-editor', false),
  ('sprites', 'sprites', true)
on conflict (id) do nothing;

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

-- Quest timer (IslandEditor "timer" field): pick timer in ms for the matching / in-between quests
-- null = the quest's default (matching 10000, in-between 5000)
alter table quests add column if not exists timer_ms integer;
