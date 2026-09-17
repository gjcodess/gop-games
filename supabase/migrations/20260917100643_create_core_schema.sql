begin;

create extension if not exists pgcrypto;
create schema if not exists private;

create table public.profiles (
  id uuid primary key default gen_random_uuid(),
  auth_user_id uuid unique references auth.users (id) on delete set null,
  display_name text not null check (char_length(btrim(display_name)) between 1 and 80),
  avatar_path text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.profile_preferences (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  theme_mode text not null default 'system' check (theme_mode in ('system', 'light', 'dark')),
  reduced_motion_override boolean,
  last_group_id uuid,
  updated_at timestamptz not null default now()
);

create table public.groups (
  id uuid primary key default gen_random_uuid(),
  created_by_profile_id uuid references public.profiles (id) on delete set null,
  name text not null check (char_length(btrim(name)) between 1 and 100),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  archived_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.group_memberships (
  group_id uuid not null references public.groups (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete restrict,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  status text not null default 'pending' check (status in ('pending', 'active', 'suspended', 'left')),
  joined_at timestamptz,
  left_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  primary key (group_id, profile_id),
  check ((status = 'active' and joined_at is not null) or status <> 'active'),
  check (status = 'left' or left_at is null)
);

create table private.system_roles (
  profile_id uuid primary key references public.profiles (id) on delete cascade,
  role text not null check (role in ('system_admin')),
  created_at timestamptz not null default now()
);

create table private.group_invitations (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete cascade,
  target_profile_id uuid references public.profiles (id) on delete set null,
  email text not null check (char_length(btrim(email)) between 3 and 320),
  token_digest text not null unique,
  role text not null default 'member' check (role in ('owner', 'admin', 'member')),
  invited_by_profile_id uuid references public.profiles (id) on delete set null,
  expires_at timestamptz not null,
  accepted_by_auth_user_id uuid references auth.users (id) on delete set null,
  accepted_at timestamptz,
  revoked_at timestamptz,
  created_at timestamptz not null default now(),
  check (accepted_at is null or accepted_by_auth_user_id is not null)
);

create table public.game_categories (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(btrim(name)) between 1 and 80),
  sort_order integer not null default 0,
  created_at timestamptz not null default now()
);

create table public.games (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.game_categories (id) on delete restrict,
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  description text,
  scoring_model text not null check (scoring_model in ('binary', 'flip7', 'billiards')),
  theme_key text not null,
  min_players smallint not null default 2 check (min_players > 0),
  max_players smallint check (max_players is null or max_players >= min_players),
  allows_teams boolean not null default false,
  min_winners smallint not null default 1 check (min_winners > 0),
  max_winners smallint not null default 1 check (max_winners >= min_winners),
  config jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.game_variants (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  slug text not null check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  name text not null check (char_length(btrim(name)) between 1 and 120),
  config jsonb not null default '{}'::jsonb,
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (game_id, slug),
  unique (id, game_id)
);

create table public.rule_documents (
  id uuid primary key default gen_random_uuid(),
  game_id uuid not null references public.games (id) on delete cascade,
  variant_id uuid references public.game_variants (id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (id, game_id)
);

create table public.rule_revisions (
  id uuid primary key default gen_random_uuid(),
  document_id uuid not null references public.rule_documents (id) on delete cascade,
  version integer not null check (version > 0),
  status text not null check (status in ('draft', 'published', 'superseded')),
  description text not null default '',
  objective text not null default '',
  setup text not null default '',
  scoring_rules text not null default '',
  winning_conditions text not null default '',
  special_rules jsonb not null default '[]'::jsonb,
  source_url text,
  updated_by_profile_id uuid references public.profiles (id) on delete set null,
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (document_id, version)
);

create table public.flip7_card_definitions (
  code text primary key check (code ~ '^[a-z0-9_-]+$'),
  card_kind text not null check (card_kind in ('number', 'additive', 'multiplier', 'action')),
  numeric_value smallint,
  copies smallint not null check (copies > 0),
  display_order smallint not null,
  check ((card_kind in ('number', 'additive') and numeric_value is not null) or (card_kind in ('multiplier', 'action') and numeric_value is null))
);

create table public.matches (
  id uuid primary key default gen_random_uuid(),
  group_id uuid not null references public.groups (id) on delete restrict,
  game_id uuid not null references public.games (id) on delete restrict,
  variant_id uuid,
  rules_revision_id uuid references public.rule_revisions (id) on delete restrict,
  created_by_profile_id uuid not null references public.profiles (id) on delete restrict,
  status text not null default 'setup' check (status in ('setup', 'active', 'completed', 'cancelled', 'archived')),
  scoring_model_snapshot text not null check (scoring_model_snapshot in ('binary', 'flip7', 'billiards')),
  scoring_engine_version text not null default 'v1',
  version bigint not null default 0 check (version >= 0),
  settings jsonb not null default '{}'::jsonb,
  notes text,
  started_at timestamptz,
  completed_at timestamptz,
  archived_at timestamptz,
  archived_by_profile_id uuid references public.profiles (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (status <> 'completed' or completed_at is not null),
  check (status <> 'archived' or archived_at is not null),
  unique (id, group_id)
);

alter table public.matches
  add constraint matches_variant_game_fk
  foreign key (variant_id, game_id) references public.game_variants (id, game_id) on delete restrict;

create table public.match_teams (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  name text,
  position smallint not null check (position > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (match_id, position),
  unique (id, match_id)
);

create table public.match_participants (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  profile_id uuid not null references public.profiles (id) on delete restrict,
  seat_order smallint not null check (seat_order > 0),
  status text not null default 'active' check (status in ('active', 'left', 'removed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (match_id, profile_id),
  unique (match_id, seat_order),
  unique (id, match_id)
);

create table public.match_team_members (
  match_id uuid not null references public.matches (id) on delete cascade,
  team_id uuid not null,
  participant_id uuid not null,
  created_at timestamptz not null default now(),
  primary key (match_id, team_id, participant_id),
  unique (match_id, participant_id),
  foreign key (team_id, match_id) references public.match_teams (id, match_id) on delete cascade,
  foreign key (participant_id, match_id) references public.match_participants (id, match_id) on delete cascade
);

create table public.match_results (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  team_id uuid not null,
  outcome text not null check (outcome in ('win', 'loss', 'draw', 'no_contest')),
  placement smallint check (placement is null or placement > 0),
  recorded_by_profile_id uuid references public.profiles (id) on delete set null,
  revision integer not null default 1 check (revision > 0),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (match_id, team_id),
  foreign key (team_id, match_id) references public.match_teams (id, match_id) on delete cascade
);

create table public.match_events (
  id bigint generated always as identity primary key,
  event_id uuid not null default gen_random_uuid() unique,
  match_id uuid not null references public.matches (id) on delete cascade,
  sequence bigint not null check (sequence > 0),
  event_type text not null,
  actor_profile_id uuid references public.profiles (id) on delete set null,
  client_event_id uuid not null,
  base_version bigint not null check (base_version >= 0),
  result_version bigint not null check (result_version > base_version),
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (match_id, sequence),
  unique (match_id, client_event_id)
);

create table public.match_rounds (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  round_number integer not null check (round_number > 0),
  revision integer not null default 1 check (revision > 0),
  status text not null default 'draft' check (status in ('draft', 'finalized', 'superseded', 'voided')),
  version bigint not null default 0 check (version >= 0),
  finalized_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (match_id, round_number, revision),
  unique (id, match_id),
  check (status not in ('finalized', 'superseded') or finalized_at is not null)
);

create table public.score_events (
  id bigint generated always as identity primary key,
  event_id uuid not null default gen_random_uuid() unique,
  match_id uuid not null references public.matches (id) on delete cascade,
  round_id uuid,
  participant_id uuid not null,
  delta integer not null,
  event_kind text not null check (event_kind in ('round_score', 'adjustment', 'reversal')),
  reversal_of_id bigint references public.score_events (id) on delete restrict,
  actor_profile_id uuid references public.profiles (id) on delete set null,
  client_event_id uuid not null,
  created_at timestamptz not null default now(),
  unique (match_id, client_event_id),
  foreign key (round_id, match_id) references public.match_rounds (id, match_id) on delete restrict,
  foreign key (participant_id, match_id) references public.match_participants (id, match_id) on delete restrict
);

create table public.match_scores (
  match_id uuid not null references public.matches (id) on delete cascade,
  participant_id uuid not null,
  total integer not null default 0 check (total >= 0),
  last_round_id uuid,
  updated_at timestamptz not null default now(),
  primary key (match_id, participant_id),
  foreign key (participant_id, match_id) references public.match_participants (id, match_id) on delete cascade,
  foreign key (last_round_id, match_id) references public.match_rounds (id, match_id) on delete set null
);

create table public.flip7_round_player_state (
  match_id uuid not null references public.matches (id) on delete cascade,
  round_id uuid not null,
  participant_id uuid not null,
  status text not null default 'pending' check (status in ('pending', 'stayed', 'busted', 'finalized')),
  calculated_points integer not null default 0 check (calculated_points >= 0),
  busted boolean not null default false,
  has_multiplier boolean not null default false,
  additive_points integer not null default 0 check (additive_points >= 0),
  number_card_count smallint not null default 0 check (number_card_count >= 0),
  input_version bigint not null default 0 check (input_version >= 0),
  finalized_at timestamptz,
  updated_at timestamptz not null default now(),
  primary key (round_id, participant_id),
  foreign key (round_id, match_id) references public.match_rounds (id, match_id) on delete cascade,
  foreign key (participant_id, match_id) references public.match_participants (id, match_id) on delete cascade
);

create table public.flip7_round_cards (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  round_id uuid not null,
  participant_id uuid not null,
  card_code text not null references public.flip7_card_definitions (code) on delete restrict,
  entry_order smallint not null check (entry_order > 0),
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  unique (round_id, participant_id, entry_order),
  foreign key (round_id, match_id) references public.match_rounds (id, match_id) on delete cascade,
  foreign key (participant_id, match_id) references public.match_participants (id, match_id) on delete cascade
);

create table public.billiards_match_state (
  match_id uuid primary key references public.matches (id) on delete cascade,
  mode text not null check (mode in ('8_ball', '15_ball_consecutive', 'cutthroat')),
  phase text not null default 'setup' check (phase in ('setup', 'break', 'play', 'complete')),
  active_team_id uuid,
  active_participant_id uuid,
  version bigint not null default 0 check (version >= 0),
  updated_at timestamptz not null default now(),
  foreign key (active_team_id, match_id) references public.match_teams (id, match_id) on delete set null,
  foreign key (active_participant_id, match_id) references public.match_participants (id, match_id) on delete set null
);

create table public.billiards_ball_states (
  match_id uuid not null references public.matches (id) on delete cascade,
  ball_number smallint not null check (ball_number between 1 and 15),
  state text not null default 'on_table' check (state in ('on_table', 'pocketed', 'removed')),
  assignment_team_id uuid,
  pocketed_by_participant_id uuid,
  pocketed_order integer,
  updated_at timestamptz not null default now(),
  primary key (match_id, ball_number),
  foreign key (assignment_team_id, match_id) references public.match_teams (id, match_id) on delete set null,
  foreign key (pocketed_by_participant_id, match_id) references public.match_participants (id, match_id) on delete set null
);

create table public.billiards_assignments (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  team_id uuid not null,
  assignment_type text not null check (assignment_type in ('solids', 'stripes', 'cutthroat_set', 'custom')),
  ball_numbers smallint[] not null default '{}'::smallint[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  foreign key (team_id, match_id) references public.match_teams (id, match_id) on delete cascade,
  check (cardinality(ball_numbers) <= 15),
  check (ball_numbers <@ array[1,2,3,4,5,6,7,8,9,10,11,12,13,14,15]::smallint[])
);

create table public.billiards_turns (
  id uuid primary key default gen_random_uuid(),
  match_id uuid not null references public.matches (id) on delete cascade,
  turn_number integer not null check (turn_number > 0),
  team_id uuid,
  participant_id uuid,
  status text not null default 'active' check (status in ('active', 'complete', 'skipped')),
  started_at timestamptz not null default now(),
  ended_at timestamptz,
  unique (match_id, turn_number),
  foreign key (team_id, match_id) references public.match_teams (id, match_id) on delete set null,
  foreign key (participant_id, match_id) references public.match_participants (id, match_id) on delete set null,
  check (status = 'active' or ended_at is not null)
);

create table public.billiards_events (
  id bigint generated always as identity primary key,
  event_id uuid not null default gen_random_uuid() unique,
  match_id uuid not null references public.matches (id) on delete cascade,
  turn_id uuid references public.billiards_turns (id) on delete set null,
  sequence bigint not null check (sequence > 0),
  event_type text not null check (event_type in ('ball_toggled', 'assignment_changed', 'turn_started', 'turn_ended', 'result_declared', 'correction')),
  ball_number smallint check (ball_number is null or ball_number between 1 and 15),
  actor_profile_id uuid references public.profiles (id) on delete set null,
  client_event_id uuid not null,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now(),
  unique (match_id, sequence),
  unique (match_id, client_event_id)
);

create unique index rule_documents_global_game_uidx
  on public.rule_documents (game_id)
  where variant_id is null;
create unique index rule_documents_variant_uidx
  on public.rule_documents (game_id, variant_id)
  where variant_id is not null;
create unique index rule_revisions_one_published_uidx
  on public.rule_revisions (document_id)
  where status = 'published';
create index profiles_auth_user_id_idx on public.profiles (auth_user_id);
create index group_memberships_profile_status_idx on public.group_memberships (profile_id, status);
create index group_memberships_group_status_idx on public.group_memberships (group_id, status);
create index games_category_active_idx on public.games (category_id, is_active);
create index variants_game_active_idx on public.game_variants (game_id, is_active);
create index rule_revisions_document_status_idx on public.rule_revisions (document_id, status);
create index matches_group_status_updated_idx on public.matches (group_id, status, updated_at desc);
create index matches_game_completed_idx on public.matches (game_id, completed_at desc);
create index matches_active_idx on public.matches (group_id, updated_at desc) where status in ('setup', 'active');
create index match_teams_match_idx on public.match_teams (match_id);
create index match_participants_profile_idx on public.match_participants (profile_id, created_at desc);
create index team_members_team_idx on public.match_team_members (team_id, match_id);
create index match_results_match_outcome_idx on public.match_results (match_id, outcome);
create index match_events_match_sequence_idx on public.match_events (match_id, sequence desc);
create index match_events_client_event_idx on public.match_events (match_id, client_event_id);
create index match_rounds_match_status_idx on public.match_rounds (match_id, status, round_number);
create index score_events_match_participant_idx on public.score_events (match_id, participant_id, created_at);
create index score_events_round_idx on public.score_events (round_id);
create index flip7_round_cards_participant_idx on public.flip7_round_cards (round_id, participant_id, entry_order);
create index billiards_ball_states_match_state_idx on public.billiards_ball_states (match_id, state);
create index billiards_assignments_match_idx on public.billiards_assignments (match_id, team_id);
create index billiards_events_match_sequence_idx on public.billiards_events (match_id, sequence desc);
create index private_invitations_group_email_idx on private.group_invitations (group_id, lower(email)) where accepted_at is null and revoked_at is null;

create or replace function private.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function private.current_profile_id()
returns uuid
language sql
stable
security definer
set search_path = ''
as $$
  select p.id
  from public.profiles p
  where p.auth_user_id = (select auth.uid())
  limit 1;
$$;

create or replace function private.is_group_member(p_group_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_memberships gm
    join public.profiles p on p.id = gm.profile_id
    where gm.group_id = p_group_id
      and gm.status = 'active'
      and p.auth_user_id = (select auth.uid())
  );
$$;

create or replace function private.has_group_role(p_group_id uuid, p_roles text[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.group_memberships gm
    join public.profiles p on p.id = gm.profile_id
    where gm.group_id = p_group_id
      and gm.status = 'active'
      and gm.role = any (p_roles)
      and p.auth_user_id = (select auth.uid())
  );
$$;

create or replace function private.is_system_admin()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from private.system_roles sr
    join public.profiles p on p.id = sr.profile_id
    where sr.role = 'system_admin'
      and p.auth_user_id = (select auth.uid())
  );
$$;

create or replace function private.can_view_profile(p_profile_id uuid)
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles target
    where target.id = p_profile_id
      and (
        target.auth_user_id = (select auth.uid())
        or exists (
          select 1
          from public.group_memberships viewer_membership
          join public.group_memberships target_membership
            on target_membership.group_id = viewer_membership.group_id
          where viewer_membership.profile_id = private.current_profile_id()
            and viewer_membership.status = 'active'
            and target_membership.profile_id = target.id
            and target_membership.status = 'active'
        )
      )
  );
$$;

revoke all on function private.set_updated_at() from public, anon, authenticated;
revoke all on function private.current_profile_id() from public, anon;
revoke all on function private.is_group_member(uuid) from public, anon;
revoke all on function private.has_group_role(uuid, text[]) from public, anon;
revoke all on function private.is_system_admin() from public, anon;
revoke all on function private.can_view_profile(uuid) from public, anon;
revoke all on schema private from public;
grant usage on schema private to authenticated;
grant execute on function private.current_profile_id() to authenticated;
grant execute on function private.is_group_member(uuid) to authenticated;
grant execute on function private.has_group_role(uuid, text[]) to authenticated;
grant execute on function private.is_system_admin() to authenticated;
grant execute on function private.can_view_profile(uuid) to authenticated;

create trigger profiles_set_updated_at before update on public.profiles for each row execute function private.set_updated_at();
create trigger profile_preferences_set_updated_at before update on public.profile_preferences for each row execute function private.set_updated_at();
create trigger groups_set_updated_at before update on public.groups for each row execute function private.set_updated_at();
create trigger group_memberships_set_updated_at before update on public.group_memberships for each row execute function private.set_updated_at();
create trigger games_set_updated_at before update on public.games for each row execute function private.set_updated_at();
create trigger game_variants_set_updated_at before update on public.game_variants for each row execute function private.set_updated_at();
create trigger rule_revisions_set_updated_at before update on public.rule_revisions for each row execute function private.set_updated_at();
create trigger matches_set_updated_at before update on public.matches for each row execute function private.set_updated_at();
create trigger match_teams_set_updated_at before update on public.match_teams for each row execute function private.set_updated_at();
create trigger match_participants_set_updated_at before update on public.match_participants for each row execute function private.set_updated_at();
create trigger match_results_set_updated_at before update on public.match_results for each row execute function private.set_updated_at();
create trigger match_rounds_set_updated_at before update on public.match_rounds for each row execute function private.set_updated_at();
create trigger match_scores_set_updated_at before update on public.match_scores for each row execute function private.set_updated_at();
create trigger flip7_round_player_state_set_updated_at before update on public.flip7_round_player_state for each row execute function private.set_updated_at();
create trigger billiards_match_state_set_updated_at before update on public.billiards_match_state for each row execute function private.set_updated_at();
create trigger billiards_ball_states_set_updated_at before update on public.billiards_ball_states for each row execute function private.set_updated_at();
create trigger billiards_assignments_set_updated_at before update on public.billiards_assignments for each row execute function private.set_updated_at();

alter table public.profiles enable row level security;
alter table public.profile_preferences enable row level security;
alter table public.groups enable row level security;
alter table public.group_memberships enable row level security;
alter table public.game_categories enable row level security;
alter table public.games enable row level security;
alter table public.game_variants enable row level security;
alter table public.rule_documents enable row level security;
alter table public.rule_revisions enable row level security;
alter table public.flip7_card_definitions enable row level security;
alter table public.matches enable row level security;
alter table public.match_teams enable row level security;
alter table public.match_participants enable row level security;
alter table public.match_team_members enable row level security;
alter table public.match_results enable row level security;
alter table public.match_events enable row level security;
alter table public.match_rounds enable row level security;
alter table public.score_events enable row level security;
alter table public.match_scores enable row level security;
alter table public.flip7_round_player_state enable row level security;
alter table public.flip7_round_cards enable row level security;
alter table public.billiards_match_state enable row level security;
alter table public.billiards_ball_states enable row level security;
alter table public.billiards_assignments enable row level security;
alter table public.billiards_turns enable row level security;
alter table public.billiards_events enable row level security;
alter table private.system_roles enable row level security;
alter table private.group_invitations enable row level security;

grant usage on schema public to authenticated;
grant select on public.profiles, public.profile_preferences, public.groups, public.group_memberships,
  public.game_categories, public.games, public.game_variants, public.rule_documents,
  public.rule_revisions, public.flip7_card_definitions, public.matches, public.match_teams,
  public.match_participants, public.match_team_members, public.match_results, public.match_events,
  public.match_rounds, public.score_events, public.match_scores, public.flip7_round_player_state,
  public.flip7_round_cards, public.billiards_match_state, public.billiards_ball_states,
  public.billiards_assignments, public.billiards_turns, public.billiards_events
  to authenticated;
grant update on public.profiles to authenticated;
grant select, insert, update on public.profile_preferences to authenticated;

create policy profiles_select_shared_group
  on public.profiles for select to authenticated
  using ((select private.can_view_profile(id)));

create policy profiles_update_self
  on public.profiles for update to authenticated
  using ((select auth.uid()) = auth_user_id)
  with check ((select auth.uid()) = auth_user_id);

create policy profile_preferences_select_self
  on public.profile_preferences for select to authenticated
  using (exists (select 1 from public.profiles p where p.id = profile_id and p.auth_user_id = (select auth.uid())));

create policy profile_preferences_insert_self
  on public.profile_preferences for insert to authenticated
  with check (exists (select 1 from public.profiles p where p.id = profile_id and p.auth_user_id = (select auth.uid())));

create policy profile_preferences_update_self
  on public.profile_preferences for update to authenticated
  using (exists (select 1 from public.profiles p where p.id = profile_id and p.auth_user_id = (select auth.uid())))
  with check (exists (select 1 from public.profiles p where p.id = profile_id and p.auth_user_id = (select auth.uid())));

create policy groups_select_member
  on public.groups for select to authenticated
  using ((select private.is_group_member(id)));

create policy memberships_select_member
  on public.group_memberships for select to authenticated
  using ((select private.is_group_member(group_id)));

create policy categories_select_authenticated
  on public.game_categories for select to authenticated using (true);

create policy games_select_authenticated
  on public.games for select to authenticated using (true);

create policy variants_select_authenticated
  on public.game_variants for select to authenticated using (true);

create policy rule_documents_select_authenticated
  on public.rule_documents for select to authenticated
  using (exists (select 1 from public.rule_revisions rr where rr.document_id = id and rr.status = 'published'));

create policy rule_revisions_select_published
  on public.rule_revisions for select to authenticated
  using (status = 'published');

create policy flip7_cards_select_authenticated
  on public.flip7_card_definitions for select to authenticated using (true);

create policy matches_select_member
  on public.matches for select to authenticated
  using ((select private.is_group_member(group_id)));

create policy match_teams_select_member
  on public.match_teams for select to authenticated
  using (exists (select 1 from public.matches m where m.id = match_id and private.is_group_member(m.group_id)));

create policy match_participants_select_member
  on public.match_participants for select to authenticated
  using (exists (select 1 from public.matches m where m.id = match_id and private.is_group_member(m.group_id)));

create policy match_team_members_select_member
  on public.match_team_members for select to authenticated
  using (exists (select 1 from public.matches m where m.id = match_id and private.is_group_member(m.group_id)));

create policy match_results_select_member
  on public.match_results for select to authenticated
  using (exists (select 1 from public.matches m where m.id = match_id and private.is_group_member(m.group_id)));

create policy match_events_select_member
  on public.match_events for select to authenticated
  using (exists (select 1 from public.matches m where m.id = match_id and private.is_group_member(m.group_id)));

create policy match_rounds_select_member
  on public.match_rounds for select to authenticated
  using (exists (select 1 from public.matches m where m.id = match_id and private.is_group_member(m.group_id)));

create policy score_events_select_member
  on public.score_events for select to authenticated
  using (exists (select 1 from public.matches m where m.id = match_id and private.is_group_member(m.group_id)));

create policy match_scores_select_member
  on public.match_scores for select to authenticated
  using (exists (select 1 from public.matches m where m.id = match_id and private.is_group_member(m.group_id)));

create policy flip7_round_state_select_member
  on public.flip7_round_player_state for select to authenticated
  using (exists (select 1 from public.matches m where m.id = match_id and private.is_group_member(m.group_id)));

create policy flip7_round_cards_select_member
  on public.flip7_round_cards for select to authenticated
  using (exists (select 1 from public.matches m where m.id = match_id and private.is_group_member(m.group_id)));

create policy billiards_state_select_member
  on public.billiards_match_state for select to authenticated
  using (exists (select 1 from public.matches m where m.id = match_id and private.is_group_member(m.group_id)));

create policy billiards_balls_select_member
  on public.billiards_ball_states for select to authenticated
  using (exists (select 1 from public.matches m where m.id = match_id and private.is_group_member(m.group_id)));

create policy billiards_assignments_select_member
  on public.billiards_assignments for select to authenticated
  using (exists (select 1 from public.matches m where m.id = match_id and private.is_group_member(m.group_id)));

create policy billiards_turns_select_member
  on public.billiards_turns for select to authenticated
  using (exists (select 1 from public.matches m where m.id = match_id and private.is_group_member(m.group_id)));

create policy billiards_events_select_member
  on public.billiards_events for select to authenticated
  using (exists (select 1 from public.matches m where m.id = match_id and private.is_group_member(m.group_id)));

create policy realtime_group_members_receive_broadcast
  on realtime.messages for select to authenticated
  using (
    extension = 'broadcast'
    and (
      (
        (select realtime.topic()) ~ '^match:[0-9a-fA-F-]{36}$'
        and exists (
          select 1
          from public.matches m
          where m.id = substring((select realtime.topic()) from 7)::uuid
            and private.is_group_member(m.group_id)
        )
      )
      or (
        (select realtime.topic()) ~ '^group:[0-9a-fA-F-]{36}$'
        and private.is_group_member(substring((select realtime.topic()) from 7)::uuid)
      )
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('avatars', 'avatars', false, 5242880, array['image/png', 'image/jpeg', 'image/webp']::text[])
on conflict (id) do update set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

create policy avatars_select_shared_group
  on storage.objects for select to authenticated
  using (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and private.can_view_profile(((storage.foldername(name))[1])::uuid)
  );

create policy avatars_insert_self
  on storage.objects for insert to authenticated
  with check (
    bucket_id = 'avatars'
    and (storage.foldername(name))[1] ~ '^[0-9a-fA-F-]{36}$'
    and ((storage.foldername(name))[1])::uuid = private.current_profile_id()
  );

create policy avatars_update_self
  on storage.objects for update to authenticated
  using (bucket_id = 'avatars' and ((storage.foldername(name))[1])::uuid = private.current_profile_id())
  with check (bucket_id = 'avatars' and ((storage.foldername(name))[1])::uuid = private.current_profile_id());

create policy avatars_delete_self
  on storage.objects for delete to authenticated
  using (bucket_id = 'avatars' and ((storage.foldername(name))[1])::uuid = private.current_profile_id());

commit;
