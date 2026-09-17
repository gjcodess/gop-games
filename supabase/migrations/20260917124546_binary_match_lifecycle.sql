begin;

create or replace function private.start_match(
  p_match_id uuid,
  p_expected_version bigint,
  p_client_event_id uuid
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
  v_next_version bigint;
begin
  select m.group_id, m.status, m.version
    into v_group_id, v_status, v_version
  from public.matches m
  where m.id = p_match_id
  for update;

  if not found then
    raise exception using errcode = '22023', message = 'Match not found.';
  end if;

  v_actor_profile_id := private.current_profile_id();
  if v_actor_profile_id is null or not private.is_group_member(v_group_id) then
    raise exception using errcode = '42501', message = 'Active group membership is required.';
  end if;

  if exists (
    select 1 from public.match_events me
    where me.match_id = p_match_id and me.client_event_id = p_client_event_id
  ) then
    return v_version;
  end if;

  if v_version <> p_expected_version then
    raise exception using errcode = '40001', message = 'Match changed before this command was applied.';
  end if;

  if v_status <> 'setup' then
    raise exception using errcode = '22023', message = 'Only a match in setup can be started.';
  end if;

  v_next_version := v_version + 1;

  update public.matches
  set status = 'active',
      started_at = coalesce(started_at, now()),
      version = v_next_version
  where id = p_match_id;

  insert into public.match_events (
    match_id, sequence, event_type, actor_profile_id, client_event_id,
    base_version, result_version, payload
  )
  values (
    p_match_id, v_next_version, 'match_started', v_actor_profile_id, p_client_event_id,
    v_version, v_next_version, '{}'::jsonb
  );

  return v_next_version;
end;
$$;

create or replace function private.record_binary_result(
  p_match_id uuid,
  p_expected_version bigint,
  p_client_event_id uuid,
  p_results jsonb
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
  v_min_winners smallint;
  v_max_winners smallint;
  v_team_count integer;
  v_result_count integer;
  v_winner_count integer := 0;
  v_has_draw boolean := false;
  v_has_no_contest boolean := false;
  v_result jsonb;
  v_team_id uuid;
  v_outcome text;
  v_placement smallint;
  v_actor_profile_id uuid;
  v_next_version bigint;
begin
  select m.group_id, m.game_id, m.status, m.version
    into v_group_id, v_game_id, v_status, v_version
  from public.matches m
  where m.id = p_match_id
  for update;

  if not found then
    raise exception using errcode = '22023', message = 'Match not found.';
  end if;

  v_actor_profile_id := private.current_profile_id();
  if v_actor_profile_id is null or not private.is_group_member(v_group_id) then
    raise exception using errcode = '42501', message = 'Active group membership is required.';
  end if;

  if exists (
    select 1 from public.match_events me
    where me.match_id = p_match_id and me.client_event_id = p_client_event_id
  ) then
    return v_version;
  end if;

  if v_version <> p_expected_version then
    raise exception using errcode = '40001', message = 'Match changed before this command was applied.';
  end if;

  if v_status not in ('setup', 'active') then
    raise exception using errcode = '22023', message = 'Only an unfinished match can receive a result.';
  end if;

  select g.min_winners, g.max_winners
    into v_min_winners, v_max_winners
  from public.games g
  where g.id = v_game_id
    and g.scoring_model = 'binary';

  if not found then
    raise exception using errcode = '22023', message = 'This match is not a binary-scoring game.';
  end if;

  if jsonb_typeof(p_results) <> 'array' then
    raise exception using errcode = '22023', message = 'Binary results must be a JSON array.';
  end if;

  select count(*) into v_team_count
  from public.match_teams mt
  where mt.match_id = p_match_id;

  select count(*) into v_result_count
  from jsonb_array_elements(p_results);

  if v_result_count <> v_team_count then
    raise exception using errcode = '22023', message = 'Every participating team needs exactly one result.';
  end if;

  if exists (
    select 1
    from (
      select value ->> 'team_id' as team_id, count(*) as result_count
      from jsonb_array_elements(p_results)
      group by value ->> 'team_id'
      having count(*) > 1
    ) duplicate_results
  ) then
    raise exception using errcode = '22023', message = 'A team cannot receive more than one result.';
  end if;

  for v_result in select value from jsonb_array_elements(p_results) loop
    v_team_id := (v_result ->> 'team_id')::uuid;
    v_outcome := v_result ->> 'outcome';
    v_placement := nullif(v_result ->> 'placement', '')::smallint;

    if not exists (
      select 1 from public.match_teams mt
      where mt.id = v_team_id and mt.match_id = p_match_id
    ) then
      raise exception using errcode = '22023', message = 'A result references a team outside this match.';
    end if;

    if v_outcome not in ('win', 'loss', 'draw', 'no_contest') then
      raise exception using errcode = '22023', message = 'Binary results have an invalid outcome.';
    end if;

    if v_outcome = 'win' then
      v_winner_count := v_winner_count + 1;
    elsif v_outcome = 'draw' then
      v_has_draw := true;
    elsif v_outcome = 'no_contest' then
      v_has_no_contest := true;
    end if;
  end loop;

  if (v_has_draw or v_has_no_contest) and (v_winner_count > 0 or (v_has_draw and v_has_no_contest)) then
    raise exception using errcode = '22023', message = 'Draw, no-contest, and win outcomes cannot be mixed.';
  end if;

  if not v_has_draw and not v_has_no_contest
     and (v_winner_count < v_min_winners or v_winner_count > v_max_winners) then
    raise exception using errcode = '22023', message = 'The number of winners is invalid for this game.';
  end if;

  v_next_version := v_version + 1;

  for v_result in select value from jsonb_array_elements(p_results) loop
    insert into public.match_results (
      match_id, team_id, outcome, placement, recorded_by_profile_id, revision
    )
    values (
      p_match_id,
      (v_result ->> 'team_id')::uuid,
      v_result ->> 'outcome',
      nullif(v_result ->> 'placement', '')::smallint,
      v_actor_profile_id,
      1
    );
  end loop;

  update public.matches
  set status = 'completed',
      completed_at = now(),
      started_at = coalesce(started_at, now()),
      version = v_next_version
  where id = p_match_id;

  insert into public.match_events (
    match_id, sequence, event_type, actor_profile_id, client_event_id,
    base_version, result_version, payload
  )
  values (
    p_match_id, v_next_version, 'match_completed', v_actor_profile_id, p_client_event_id,
    v_version, v_next_version, jsonb_build_object('results', p_results)
  );

  return v_next_version;
end;
$$;

revoke all on function private.start_match(uuid, bigint, uuid) from public, anon, authenticated;
revoke all on function private.record_binary_result(uuid, bigint, uuid, jsonb) from public, anon, authenticated;
grant execute on function private.start_match(uuid, bigint, uuid) to authenticated;
grant execute on function private.record_binary_result(uuid, bigint, uuid, jsonb) to authenticated;

create or replace function public.start_match(
  p_match_id uuid,
  p_expected_version bigint,
  p_client_event_id uuid
)
returns bigint
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.start_match(p_match_id, p_expected_version, p_client_event_id);
$$;

create or replace function public.record_binary_result(
  p_match_id uuid,
  p_expected_version bigint,
  p_client_event_id uuid,
  p_results jsonb
)
returns bigint
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.record_binary_result(p_match_id, p_expected_version, p_client_event_id, p_results);
$$;

revoke all on function public.start_match(uuid, bigint, uuid) from public, anon;
revoke all on function public.record_binary_result(uuid, bigint, uuid, jsonb) from public, anon;
grant execute on function public.start_match(uuid, bigint, uuid) to authenticated;
grant execute on function public.record_binary_result(uuid, bigint, uuid, jsonb) to authenticated;

commit;
