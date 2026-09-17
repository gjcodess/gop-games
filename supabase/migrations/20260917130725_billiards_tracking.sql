begin;

alter table public.billiards_events
  drop constraint billiards_events_event_type_check;

alter table public.billiards_events
  add constraint billiards_events_event_type_check
  check (event_type in ('match_initialized', 'ball_toggled', 'assignment_changed', 'turn_started', 'turn_ended', 'result_declared', 'correction'));

create unique index if not exists billiards_assignments_match_team_type_uidx
  on public.billiards_assignments (match_id, team_id, assignment_type);

create or replace function private.initialize_billiards_match(
  p_match_id uuid,
  p_expected_version bigint,
  p_client_event_id uuid,
  p_mode text,
  p_active_team_id uuid default null,
  p_active_participant_id uuid default null
)
returns bigint
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_group_id uuid;
  v_game_id uuid;
  v_variant_slug text;
  v_status text;
  v_version bigint;
  v_actor_profile_id uuid;
  v_next_version bigint;
  v_event_sequence bigint;
  v_billiards_event_id uuid;
begin
  select m.group_id, m.game_id, m.status, m.version
    into v_group_id, v_game_id, v_status, v_version
  from public.matches m
  where m.id = p_match_id
  for update;

  if not found then
    raise exception using errcode = '22023', message = 'Match not found.';
  end if;

  select gv.slug into v_variant_slug
  from public.game_variants gv
  where gv.id = (select m.variant_id from public.matches m where m.id = p_match_id);

  v_actor_profile_id := private.current_profile_id();
  if v_actor_profile_id is null or not private.is_group_member(v_group_id) then
    raise exception using errcode = '42501', message = 'Active group membership is required.';
  end if;

  if exists (
    select 1 from public.billiards_events be
    where be.match_id = p_match_id and be.client_event_id = p_client_event_id
  ) then
    return v_version;
  end if;

  if v_version <> p_expected_version then
    raise exception using errcode = '40001', message = 'Match changed before this command was applied.';
  end if;

  if v_status <> 'active' then
    raise exception using errcode = '22023', message = 'Only an active match can initialize billiards tracking.';
  end if;

  if not exists (select 1 from public.games g where g.id = v_game_id and g.scoring_model = 'billiards') then
    raise exception using errcode = '22023', message = 'This match is not a billiards match.';
  end if;

  if p_mode not in ('8_ball', '15_ball_consecutive', 'cutthroat') then
    raise exception using errcode = '22023', message = 'Billiards mode is invalid.';
  end if;

  if (p_mode = '8_ball' and v_variant_slug <> '8-ball')
     or (p_mode = '15_ball_consecutive' and v_variant_slug <> '15-ball-consecutive')
     or (p_mode = 'cutthroat' and v_variant_slug <> 'cutthroat') then
    raise exception using errcode = '22023', message = 'Billiards mode does not match the selected game variant.';
  end if;

  if p_active_team_id is not null and not exists (
    select 1 from public.match_teams mt where mt.id = p_active_team_id and mt.match_id = p_match_id
  ) then
    raise exception using errcode = '22023', message = 'Active team does not belong to this match.';
  end if;

  if p_active_participant_id is not null and not exists (
    select 1 from public.match_participants mp where mp.id = p_active_participant_id and mp.match_id = p_match_id
  ) then
    raise exception using errcode = '22023', message = 'Active participant does not belong to this match.';
  end if;

  if p_active_team_id is not null and p_active_participant_id is not null and not exists (
    select 1
    from public.match_team_members mtm
    where mtm.match_id = p_match_id
      and mtm.team_id = p_active_team_id
      and mtm.participant_id = p_active_participant_id
  ) then
    raise exception using errcode = '22023', message = 'Active participant is not a member of the active team.';
  end if;

  if exists (select 1 from public.billiards_match_state bms where bms.match_id = p_match_id) then
    raise exception using errcode = '22023', message = 'Billiards tracking is already initialized.';
  end if;

  insert into public.billiards_match_state (
    match_id, mode, phase, active_team_id, active_participant_id, version
  )
  values (
    p_match_id, p_mode, 'break', p_active_team_id, p_active_participant_id, 1
  );

  insert into public.billiards_ball_states (match_id, ball_number, state)
  select p_match_id, ball_number::smallint, 'on_table'
  from generate_series(1, 15) as ball_number;

  v_next_version := v_version + 1;
  v_event_sequence := 1;

  insert into public.billiards_events (
    match_id, sequence, event_type, actor_profile_id, client_event_id, payload
  )
  values (
    p_match_id, v_event_sequence, 'match_initialized', v_actor_profile_id, p_client_event_id,
    jsonb_build_object('mode', p_mode, 'variant_slug', v_variant_slug)
  )
  returning event_id into v_billiards_event_id;

  update public.matches
  set started_at = coalesce(started_at, now()), version = v_next_version
  where id = p_match_id;

  insert into public.match_events (
    match_id, sequence, event_type, actor_profile_id, client_event_id,
    base_version, result_version, payload
  )
  values (
    p_match_id, v_next_version, 'billiards_match_initialized', v_actor_profile_id, p_client_event_id,
    v_version, v_next_version, jsonb_build_object('billiards_event_id', v_billiards_event_id, 'mode', p_mode)
  );

  return v_next_version;
end;
$$;

create or replace function private.apply_billiards_event(
  p_match_id uuid,
  p_expected_version bigint,
  p_client_event_id uuid,
  p_event_type text,
  p_ball_number smallint default null,
  p_team_id uuid default null,
  p_participant_id uuid default null,
  p_payload jsonb default '{}'::jsonb
)
returns bigint
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_group_id uuid;
  v_status text;
  v_version bigint;
  v_actor_profile_id uuid;
  v_state_phase text;
  v_state_version bigint;
  v_next_version bigint;
  v_event_sequence bigint;
  v_billiards_event_id uuid;
  v_turn_id uuid;
  v_turn_number integer;
  v_state text;
  v_assignment_type text;
  v_ball_numbers smallint[] := '{}'::smallint[];
  v_normalized_payload jsonb := coalesce(p_payload, '{}'::jsonb);
begin
  select m.group_id, m.status, m.version
    into v_group_id, v_status, v_version
  from public.matches m
  where m.id = p_match_id
  for update;

  if not found then
    raise exception using errcode = '22023', message = 'Match not found.';
  end if;

  select bms.phase, bms.version
    into v_state_phase, v_state_version
  from public.billiards_match_state bms
  where bms.match_id = p_match_id
  for update;

  if not found then
    raise exception using errcode = '22023', message = 'Billiards tracking is not initialized.';
  end if;

  v_actor_profile_id := private.current_profile_id();
  if v_actor_profile_id is null or not private.is_group_member(v_group_id) then
    raise exception using errcode = '42501', message = 'Active group membership is required.';
  end if;

  if exists (
    select 1 from public.billiards_events be
    where be.match_id = p_match_id and be.client_event_id = p_client_event_id
  ) then
    return v_version;
  end if;

  if v_version <> p_expected_version then
    raise exception using errcode = '40001', message = 'Match changed before this command was applied.';
  end if;

  if v_status <> 'active' or v_state_phase = 'complete' then
    raise exception using errcode = '22023', message = 'Only an unfinished billiards match accepts tracking events.';
  end if;

  if p_event_type not in ('ball_toggled', 'assignment_changed', 'turn_started', 'turn_ended', 'correction') then
    raise exception using errcode = '22023', message = 'Billiards event type is invalid.';
  end if;

  if p_team_id is not null and not exists (
    select 1 from public.match_teams mt where mt.id = p_team_id and mt.match_id = p_match_id
  ) then
    raise exception using errcode = '22023', message = 'Team does not belong to this match.';
  end if;

  if p_participant_id is not null and not exists (
    select 1 from public.match_participants mp where mp.id = p_participant_id and mp.match_id = p_match_id
  ) then
    raise exception using errcode = '22023', message = 'Participant does not belong to this match.';
  end if;

  if p_event_type in ('ball_toggled', 'correction') then
    if p_ball_number is null or p_ball_number not between 1 and 15 then
      raise exception using errcode = '22023', message = 'A ball event requires a ball number from 1 to 15.';
    end if;

    v_state := v_normalized_payload ->> 'state';
    if v_state not in ('on_table', 'pocketed', 'removed') then
      raise exception using errcode = '22023', message = 'Ball state is invalid.';
    end if;

    if v_state in ('pocketed', 'removed') and p_participant_id is null then
      raise exception using errcode = '22023', message = 'Pocketed or removed balls require a participant.';
    end if;

    if v_state = 'pocketed' then
      select coalesce(max(bs.pocketed_order), 0) + 1 into v_turn_number
      from public.billiards_ball_states bs
      where bs.match_id = p_match_id and bs.state = 'pocketed';
    end if;

    update public.billiards_ball_states
    set state = v_state,
        assignment_team_id = coalesce(p_team_id, assignment_team_id),
        pocketed_by_participant_id = case when v_state = 'on_table' then null else p_participant_id end,
        pocketed_order = case when v_state = 'on_table' then null when v_state = 'pocketed' then v_turn_number else pocketed_order end
    where match_id = p_match_id and ball_number = p_ball_number;

    if not found then
      raise exception using errcode = '22023', message = 'Ball state does not exist for this match.';
    end if;

    v_normalized_payload := jsonb_build_object(
      'state', v_state,
      'ball_number', p_ball_number,
      'team_id', p_team_id,
      'participant_id', p_participant_id
    );
  elsif p_event_type = 'assignment_changed' then
    if p_team_id is null then
      raise exception using errcode = '22023', message = 'Assignment changes require a team.';
    end if;

    v_assignment_type := v_normalized_payload ->> 'assignment_type';
    if v_assignment_type not in ('solids', 'stripes', 'cutthroat_set', 'custom') then
      raise exception using errcode = '22023', message = 'Assignment type is invalid.';
    end if;

    if jsonb_typeof(v_normalized_payload -> 'ball_numbers') <> 'array' then
      raise exception using errcode = '22023', message = 'Assignments require a ball_numbers array.';
    end if;

    select coalesce(array_agg(value::smallint order by ordinality), '{}'::smallint[])
      into v_ball_numbers
    from jsonb_array_elements_text(v_normalized_payload -> 'ball_numbers') with ordinality;

    if cardinality(v_ball_numbers) > 15
       or exists (select 1 from unnest(v_ball_numbers) n where n < 1 or n > 15)
       or cardinality(v_ball_numbers) <> (select count(distinct n) from unnest(v_ball_numbers) n) then
      raise exception using errcode = '22023', message = 'Assignments must contain unique ball numbers from 1 to 15.';
    end if;

    insert into public.billiards_assignments (match_id, team_id, assignment_type, ball_numbers)
    values (p_match_id, p_team_id, v_assignment_type, v_ball_numbers)
    on conflict (match_id, team_id, assignment_type)
    do update set ball_numbers = excluded.ball_numbers, updated_at = now();

    if exists (
      select 1
      from public.billiards_assignments ba
      cross join lateral unnest(ba.ball_numbers) n
      where ba.match_id = p_match_id
      group by n
      having count(*) > 1
    ) then
      raise exception using errcode = '22023', message = 'A ball cannot belong to multiple billiards assignments.';
    end if;

    v_normalized_payload := jsonb_build_object(
      'assignment_type', v_assignment_type,
      'ball_numbers', to_jsonb(v_ball_numbers),
      'team_id', p_team_id
    );
  elsif p_event_type = 'turn_started' then
    if p_team_id is null and p_participant_id is null then
      raise exception using errcode = '22023', message = 'A turn requires a team or participant.';
    end if;
    if exists (select 1 from public.billiards_turns bt where bt.match_id = p_match_id and bt.status = 'active') then
      raise exception using errcode = '22023', message = 'A billiards turn is already active.';
    end if;

    select coalesce(max(bt.turn_number), 0) + 1 into v_turn_number
    from public.billiards_turns bt
    where bt.match_id = p_match_id;

    insert into public.billiards_turns (match_id, turn_number, team_id, participant_id)
    values (p_match_id, v_turn_number, p_team_id, p_participant_id)
    returning id into v_turn_id;

    update public.billiards_match_state
    set phase = 'play', active_team_id = p_team_id, active_participant_id = p_participant_id
    where match_id = p_match_id;

    v_normalized_payload := jsonb_build_object('turn_id', v_turn_id, 'team_id', p_team_id, 'participant_id', p_participant_id);
  elsif p_event_type = 'turn_ended' then
    select bt.id into v_turn_id
    from public.billiards_turns bt
    where bt.match_id = p_match_id and bt.status = 'active'
    order by bt.turn_number desc
    limit 1
    for update;

    if v_turn_id is null then
      raise exception using errcode = '22023', message = 'No active billiards turn exists.';
    end if;

    update public.billiards_turns
    set status = 'complete', ended_at = now()
    where id = v_turn_id;

    update public.billiards_match_state
    set active_team_id = null, active_participant_id = null
    where match_id = p_match_id;

    v_normalized_payload := jsonb_build_object('turn_id', v_turn_id);
  end if;

  v_next_version := v_version + 1;
  v_event_sequence := coalesce((select max(be.sequence) from public.billiards_events be where be.match_id = p_match_id), 0) + 1;

  update public.billiards_match_state
  set version = v_state_version + 1
  where match_id = p_match_id;

  insert into public.billiards_events (
    match_id, turn_id, sequence, event_type, ball_number, actor_profile_id, client_event_id, payload
  )
  values (
    p_match_id, v_turn_id, v_event_sequence, p_event_type, p_ball_number, v_actor_profile_id, p_client_event_id, v_normalized_payload
  )
  returning event_id into v_billiards_event_id;

  update public.matches set version = v_next_version where id = p_match_id;

  insert into public.match_events (
    match_id, sequence, event_type, actor_profile_id, client_event_id,
    base_version, result_version, payload
  )
  values (
    p_match_id, v_next_version, 'billiards_event', v_actor_profile_id, p_client_event_id,
    v_version, v_next_version, jsonb_build_object('billiards_event_id', v_billiards_event_id, 'event_type', p_event_type, 'payload', v_normalized_payload)
  );

  return v_next_version;
end;
$$;

create or replace function private.complete_billiards_match(
  p_match_id uuid,
  p_expected_version bigint,
  p_client_event_id uuid,
  p_result text,
  p_winner_team_ids uuid[] default '{}',
  p_notes text default null
)
returns bigint
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_group_id uuid;
  v_game_id uuid;
  v_status text;
  v_version bigint;
  v_state_phase text;
  v_actor_profile_id uuid;
  v_min_winners smallint;
  v_max_winners smallint;
  v_winner_count integer := cardinality(coalesce(p_winner_team_ids, '{}'::uuid[]));
  v_next_version bigint;
  v_event_sequence bigint;
  v_billiards_event_id uuid;
begin
  select m.group_id, m.game_id, m.status, m.version
    into v_group_id, v_game_id, v_status, v_version
  from public.matches m
  where m.id = p_match_id
  for update;

  if not found then
    raise exception using errcode = '22023', message = 'Match not found.';
  end if;

  select bms.phase into v_state_phase
  from public.billiards_match_state bms
  where bms.match_id = p_match_id
  for update;

  if not found then
    raise exception using errcode = '22023', message = 'Billiards tracking is not initialized.';
  end if;

  v_actor_profile_id := private.current_profile_id();
  if v_actor_profile_id is null or not private.is_group_member(v_group_id) then
    raise exception using errcode = '42501', message = 'Active group membership is required.';
  end if;

  if exists (
    select 1 from public.billiards_events be
    where be.match_id = p_match_id and be.client_event_id = p_client_event_id
  ) then
    return v_version;
  end if;

  if v_version <> p_expected_version then
    raise exception using errcode = '40001', message = 'Match changed before this command was applied.';
  end if;

  if v_status <> 'active' or v_state_phase = 'complete' then
    raise exception using errcode = '22023', message = 'Only an unfinished billiards match can be completed.';
  end if;

  if p_result not in ('winner', 'draw', 'no_contest') then
    raise exception using errcode = '22023', message = 'Billiards result is invalid.';
  end if;

  if p_result = 'winner' then
    select g.min_winners, g.max_winners into v_min_winners, v_max_winners
    from public.games g where g.id = v_game_id;
    if v_winner_count < v_min_winners or v_winner_count > v_max_winners then
      raise exception using errcode = '22023', message = 'The number of billiards winners is invalid.';
    end if;
    if exists (
      select 1 from unnest(coalesce(p_winner_team_ids, '{}'::uuid[])) wt
      where not exists (select 1 from public.match_teams mt where mt.id = wt and mt.match_id = p_match_id)
    ) then
      raise exception using errcode = '22023', message = 'A winner team does not belong to this match.';
    end if;
  elsif v_winner_count <> 0 then
    raise exception using errcode = '22023', message = 'Draw and no-contest results cannot include winner teams.';
  end if;

  if exists (select 1 from public.match_results mr where mr.match_id = p_match_id) then
    raise exception using errcode = '22023', message = 'This billiards match already has a result.';
  end if;

  insert into public.match_results (match_id, team_id, outcome, placement, recorded_by_profile_id, revision)
  select
    p_match_id,
    mt.id,
    case
      when p_result = 'draw' then 'draw'
      when p_result = 'no_contest' then 'no_contest'
      when mt.id = any(p_winner_team_ids) then 'win'
      else 'loss'
    end,
    case when p_result = 'winner' and mt.id = any(p_winner_team_ids) then 1 else null end,
    v_actor_profile_id,
    1
  from public.match_teams mt
  where mt.match_id = p_match_id;

  v_next_version := v_version + 1;
  v_event_sequence := coalesce((select max(be.sequence) from public.billiards_events be where be.match_id = p_match_id), 0) + 1;

  update public.billiards_match_state
  set phase = 'complete', version = version + 1, active_team_id = null, active_participant_id = null
  where match_id = p_match_id;

  insert into public.billiards_events (
    match_id, sequence, event_type, actor_profile_id, client_event_id, payload
  )
  values (
    p_match_id, v_event_sequence, 'result_declared', v_actor_profile_id, p_client_event_id,
    jsonb_build_object('result', p_result, 'winner_team_ids', coalesce(p_winner_team_ids, '{}'::uuid[]), 'notes', p_notes)
  )
  returning event_id into v_billiards_event_id;

  update public.matches
  set status = 'completed', completed_at = now(), version = v_next_version
  where id = p_match_id;

  insert into public.match_events (
    match_id, sequence, event_type, actor_profile_id, client_event_id,
    base_version, result_version, payload
  )
  values (
    p_match_id, v_next_version, 'match_completed', v_actor_profile_id, p_client_event_id,
    v_version, v_next_version,
    jsonb_build_object('billiards_event_id', v_billiards_event_id, 'result', p_result, 'winner_team_ids', coalesce(p_winner_team_ids, '{}'::uuid[]), 'notes', p_notes)
  );

  return v_next_version;
end;
$$;

revoke all on function private.initialize_billiards_match(uuid, bigint, uuid, text, uuid, uuid) from public, anon, authenticated;
revoke all on function private.apply_billiards_event(uuid, bigint, uuid, text, smallint, uuid, uuid, jsonb) from public, anon, authenticated;
revoke all on function private.complete_billiards_match(uuid, bigint, uuid, text, uuid[], text) from public, anon, authenticated;
grant execute on function private.initialize_billiards_match(uuid, bigint, uuid, text, uuid, uuid) to authenticated;
grant execute on function private.apply_billiards_event(uuid, bigint, uuid, text, smallint, uuid, uuid, jsonb) to authenticated;
grant execute on function private.complete_billiards_match(uuid, bigint, uuid, text, uuid[], text) to authenticated;

create or replace function public.initialize_billiards_match(
  p_match_id uuid,
  p_expected_version bigint,
  p_client_event_id uuid,
  p_mode text,
  p_active_team_id uuid default null,
  p_active_participant_id uuid default null
)
returns bigint
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.initialize_billiards_match(p_match_id, p_expected_version, p_client_event_id, p_mode, p_active_team_id, p_active_participant_id);
$$;

create or replace function public.apply_billiards_event(
  p_match_id uuid,
  p_expected_version bigint,
  p_client_event_id uuid,
  p_event_type text,
  p_ball_number smallint default null,
  p_team_id uuid default null,
  p_participant_id uuid default null,
  p_payload jsonb default '{}'::jsonb
)
returns bigint
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.apply_billiards_event(p_match_id, p_expected_version, p_client_event_id, p_event_type, p_ball_number, p_team_id, p_participant_id, p_payload);
$$;

create or replace function public.complete_billiards_match(
  p_match_id uuid,
  p_expected_version bigint,
  p_client_event_id uuid,
  p_result text,
  p_winner_team_ids uuid[] default '{}',
  p_notes text default null
)
returns bigint
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.complete_billiards_match(p_match_id, p_expected_version, p_client_event_id, p_result, p_winner_team_ids, p_notes);
$$;

revoke all on function public.initialize_billiards_match(uuid, bigint, uuid, text, uuid, uuid) from public, anon;
revoke all on function public.apply_billiards_event(uuid, bigint, uuid, text, smallint, uuid, uuid, jsonb) from public, anon;
revoke all on function public.complete_billiards_match(uuid, bigint, uuid, text, uuid[], text) from public, anon;
grant execute on function public.initialize_billiards_match(uuid, bigint, uuid, text, uuid, uuid) to authenticated;
grant execute on function public.apply_billiards_event(uuid, bigint, uuid, text, smallint, uuid, uuid, jsonb) to authenticated;
grant execute on function public.complete_billiards_match(uuid, bigint, uuid, text, uuid[], text) to authenticated;

commit;
