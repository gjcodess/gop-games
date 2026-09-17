-- Development fixtures only. No passwords, Auth secrets, or invitation tokens belong here.

insert into public.game_categories (id, slug, name, sort_order)
values
  ('10000000-0000-0000-0000-000000000001', 'cards', 'Card games', 10),
  ('10000000-0000-0000-0000-000000000002', 'party', 'Party games', 20),
  ('10000000-0000-0000-0000-000000000003', 'billiards', 'Billiards', 30)
on conflict (slug) do update set name = excluded.name, sort_order = excluded.sort_order;

insert into public.games (id, category_id, slug, name, description, scoring_model, theme_key, min_players, max_players, allows_teams, min_winners, max_winners)
values
  ('20000000-0000-0000-0000-000000000001', '10000000-0000-0000-0000-000000000001', 'monopoly-deal', 'Monopoly Deal', 'Fast card-based property trading.', 'binary', 'monopoly-deal', 2, 5, false, 1, 1),
  ('20000000-0000-0000-0000-000000000002', '10000000-0000-0000-0000-000000000001', 'monopoly-bid', 'Monopoly Bid', 'A quick auction and property game.', 'binary', 'monopoly-bid', 2, 5, false, 1, 1),
  ('20000000-0000-0000-0000-000000000003', '10000000-0000-0000-0000-000000000001', 'uno', 'Uno', 'Classic color and number card play.', 'binary', 'uno', 2, 10, false, 1, 1),
  ('20000000-0000-0000-0000-000000000004', '10000000-0000-0000-0000-000000000001', 'dos', 'Dos', 'A number-matching card game.', 'binary', 'dos', 2, 4, false, 1, 1),
  ('20000000-0000-0000-0000-000000000005', '10000000-0000-0000-0000-000000000001', 'uno-flip', 'Uno Flip', 'Uno with a double-sided deck.', 'binary', 'uno-flip', 2, 10, false, 1, 1),
  ('20000000-0000-0000-0000-000000000006', '10000000-0000-0000-0000-000000000001', 'uno-no-mercy', 'Uno No Mercy', 'A high-impact Uno variant.', 'binary', 'uno-no-mercy', 2, 6, false, 1, 1),
  ('20000000-0000-0000-0000-000000000007', '10000000-0000-0000-0000-000000000001', 'uno-dare', 'Uno Dare', 'Uno with dare cards and challenges.', 'binary', 'uno-dare', 2, 10, false, 1, 1),
  ('20000000-0000-0000-0000-000000000008', '10000000-0000-0000-0000-000000000001', 'exploding-kittens', 'Exploding Kittens', 'A push-your-luck card game.', 'binary', 'exploding-kittens', 2, 5, false, 1, 1),
  ('20000000-0000-0000-0000-000000000009', '10000000-0000-0000-0000-000000000002', 'cluedo-suspect', 'Cluedo Suspect', 'A social deduction party game.', 'binary', 'cluedo-suspect', 3, 6, false, 1, 1),
  ('20000000-0000-0000-0000-000000000010', '10000000-0000-0000-0000-000000000002', 'dumb-ways-to-die', 'Dumb Ways to Die', 'A fast party challenge game.', 'binary', 'dumb-ways-to-die', 2, 6, false, 1, 1),
  ('20000000-0000-0000-0000-000000000011', '10000000-0000-0000-0000-000000000002', 'taco-cat-goat-cheese-pizza', 'Taco Cat Goat Cheese Pizza', 'A reflex and pattern-matching game.', 'binary', 'taco-cat-goat-cheese-pizza', 3, 8, false, 1, 1),
  ('20000000-0000-0000-0000-000000000012', '10000000-0000-0000-0000-000000000002', 'moose-master', 'Moose Master', 'A social game that can produce two winners.', 'binary', 'moose-master', 3, 8, false, 1, 2),
  ('20000000-0000-0000-0000-000000000013', '10000000-0000-0000-0000-000000000001', 'flip-7', 'Flip 7', 'A round-based push-your-luck scoring game.', 'flip7', 'flip7', 2, 18, false, 1, 1),
  ('20000000-0000-0000-0000-000000000014', '10000000-0000-0000-0000-000000000003', 'billiards', 'Billiards', 'A visual tracker for pool game nights.', 'billiards', 'billiards', 2, 8, true, 1, 1)
on conflict (slug) do update set
  name = excluded.name,
  description = excluded.description,
  scoring_model = excluded.scoring_model,
  theme_key = excluded.theme_key,
  min_players = excluded.min_players,
  max_players = excluded.max_players,
  allows_teams = excluded.allows_teams,
  min_winners = excluded.min_winners,
  max_winners = excluded.max_winners;

insert into public.game_variants (id, game_id, slug, name, config)
values
  ('21000000-0000-0000-0000-000000000001', '20000000-0000-0000-0000-000000000014', '8-ball', '8-Ball', '{"ball_set":"solids_stripes","manual_adjudication":true}'::jsonb),
  ('21000000-0000-0000-0000-000000000002', '20000000-0000-0000-0000-000000000014', '15-ball-consecutive', '15-Ball Consecutive', '{"ball_count":15,"manual_adjudication":true}'::jsonb),
  ('21000000-0000-0000-0000-000000000003', '20000000-0000-0000-0000-000000000014', 'cutthroat', 'Cutthroat', '{"ball_set":"player_ranges","manual_adjudication":true}'::jsonb)
on conflict (game_id, slug) do update set name = excluded.name, config = excluded.config;

insert into public.rule_documents (id, game_id)
select gen_random_uuid(), g.id
from public.games g
where not exists (
  select 1 from public.rule_documents rd where rd.game_id = g.id and rd.variant_id is null
);

insert into public.rule_documents (id, game_id, variant_id)
select gen_random_uuid(), v.game_id, v.id
from public.game_variants v
where not exists (
  select 1 from public.rule_documents rd where rd.game_id = v.game_id and rd.variant_id = v.id
);

insert into public.rule_revisions (
  document_id, version, status, description, objective, setup, scoring_rules, winning_conditions, special_rules
)
select
  rd.id,
  1,
  'published',
  g.name || ' rules reference.',
  'Play the selected game using the physical game components.',
  'Choose players, teams, and the active variant before starting the match.',
  case when g.scoring_model = 'flip7' then 'Enter each player''s scoring cards and modifiers; the app calculates the round total.' else 'Record the result or state changes agreed by the players.' end,
  case when g.scoring_model = 'flip7' then 'At the end of a round with at least one player at or above 200, the highest score wins; a tie continues to another round.' else 'Complete the match after the participating players confirm the outcome.' end,
  case when g.scoring_model = 'billiards' then '["This tracker records ball state and confirmed results; it does not referee house rules."]'::jsonb else '[]'::jsonb end
from public.rule_documents rd
join public.games g on g.id = rd.game_id
where not exists (select 1 from public.rule_revisions rr where rr.document_id = rd.id);

insert into public.flip7_card_definitions (code, card_kind, numeric_value, copies, display_order)
values
  ('number_0', 'number', 0, 1, 0),
  ('number_1', 'number', 1, 1, 1),
  ('number_2', 'number', 2, 2, 2),
  ('number_3', 'number', 3, 3, 3),
  ('number_4', 'number', 4, 4, 4),
  ('number_5', 'number', 5, 5, 5),
  ('number_6', 'number', 6, 6, 6),
  ('number_7', 'number', 7, 7, 7),
  ('number_8', 'number', 8, 8, 8),
  ('number_9', 'number', 9, 9, 9),
  ('number_10', 'number', 10, 10, 10),
  ('number_11', 'number', 11, 11, 11),
  ('number_12', 'number', 12, 12, 12),
  ('modifier_plus_2', 'additive', 2, 1, 20),
  ('modifier_plus_4', 'additive', 4, 1, 21),
  ('modifier_plus_6', 'additive', 6, 1, 22),
  ('modifier_plus_8', 'additive', 8, 2, 23),
  ('modifier_plus_10', 'additive', 10, 1, 24),
  ('modifier_x2', 'multiplier', null, 1, 25),
  ('action_freeze', 'action', null, 3, 30),
  ('action_flip_three', 'action', null, 3, 31),
  ('action_second_chance', 'action', null, 3, 32)
on conflict (code) do update set
  card_kind = excluded.card_kind,
  numeric_value = excluded.numeric_value,
  copies = excluded.copies,
  display_order = excluded.display_order;

insert into public.profiles (id, display_name)
values
  ('11000000-0000-0000-0000-000000000001', 'Glenn'),
  ('11000000-0000-0000-0000-000000000002', 'Vherwin'),
  ('11000000-0000-0000-0000-000000000003', 'Mark Jason'),
  ('11000000-0000-0000-0000-000000000004', 'Dayne'),
  ('11000000-0000-0000-0000-000000000005', 'Don Marco'),
  ('11000000-0000-0000-0000-000000000006', 'Margaaq')
on conflict (id) do update set display_name = excluded.display_name;

insert into public.groups (id, created_by_profile_id, name, slug)
values ('00000000-0000-0000-0000-000000000001', '11000000-0000-0000-0000-000000000001', 'GOP Games', 'gop-games')
on conflict (id) do update set name = excluded.name, slug = excluded.slug;

insert into public.group_memberships (group_id, profile_id, role, status)
select '00000000-0000-0000-0000-000000000001', p.id, case when p.display_name = 'Glenn' then 'owner' else 'member' end, 'pending'
from public.profiles p
where p.id in (
  '11000000-0000-0000-0000-000000000001',
  '11000000-0000-0000-0000-000000000002',
  '11000000-0000-0000-0000-000000000003',
  '11000000-0000-0000-0000-000000000004',
  '11000000-0000-0000-0000-000000000005',
  '11000000-0000-0000-0000-000000000006'
)
on conflict (group_id, profile_id) do update set role = excluded.role, status = excluded.status;
