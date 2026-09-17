begin;

create or replace function private.create_match(
  p_group_id uuid,
  p_game_id uuid,
  p_variant_id uuid,
  p_participant_profile_ids uuid[],
  p_notes text default null
)
returns uuid
language plpgsql
volatile
security definer
set search_path = ''
as $$
declare
  v_creator_profile_id uuid;
  v_match_id uuid;
  v_profile_id uuid;
  v_participant_id uuid;
  v_team_id uuid;
  v_seat_order smallint;
  v_scoring_model text;
  v_min_players smallint;
  v_max_players smallint;
begin
  v_creator_profile_id := private.current_profile_id();

  if v_creator_profile_id is null or not private.is_group_member(p_group_id) then
    raise exception using errcode = '42501', message = 'Active group membership is required to create a match.';
  end if;

  select g.scoring_model, g.min_players, g.max_players
    into v_scoring_model, v_min_players, v_max_players
  from public.games g
  where g.id = p_game_id
    and g.is_active;

  if not found then
    raise exception using errcode = '22023', message = 'The selected game is not available.';
  end if;

  if p_variant_id is not null and not exists (
    select 1
    from public.game_variants gv
    where gv.id = p_variant_id
      and gv.game_id = p_game_id
      and gv.is_active
  ) then
    raise exception using errcode = '22023', message = 'The selected game variant is invalid.';
  end if;

  if p_participant_profile_ids is null or cardinality(p_participant_profile_ids) < v_min_players then
    raise exception using errcode = '22023', message = 'The match does not have enough players.';
  end if;

  if v_max_players is not null and cardinality(p_participant_profile_ids) > v_max_players then
    raise exception using errcode = '22023', message = 'The match has too many players.';
  end if;

  if cardinality(p_participant_profile_ids) <> (
    select count(distinct ids.profile_id)::integer
    from unnest(p_participant_profile_ids) as ids(profile_id)
  ) then
    raise exception using errcode = '22023', message = 'A participant cannot be added more than once.';
  end if;

  if exists (
    select 1
    from unnest(p_participant_profile_ids) as requested(profile_id)
    where not exists (
      select 1
      from public.group_memberships gm
      where gm.group_id = p_group_id
        and gm.profile_id = requested.profile_id
        and gm.status = 'active'
    )
  ) then
    raise exception using errcode = '42501', message = 'Every participant must be an active group member.';
  end if;

  insert into public.matches (
    group_id,
    game_id,
    variant_id,
    created_by_profile_id,
    status,
    scoring_model_snapshot,
    scoring_engine_version,
    version,
    notes
  )
  values (
    p_group_id,
    p_game_id,
    p_variant_id,
    v_creator_profile_id,
    'setup',
    v_scoring_model,
    'v1',
    1,
    nullif(btrim(p_notes), '')
  )
  returning id into v_match_id;

  v_seat_order := 0;
  foreach v_profile_id in array p_participant_profile_ids loop
    v_seat_order := v_seat_order + 1;

    insert into public.match_participants (match_id, profile_id, seat_order)
    values (v_match_id, v_profile_id, v_seat_order)
    returning id into v_participant_id;

    insert into public.match_teams (match_id, name, position)
    select v_match_id, p.display_name, v_seat_order
    from public.profiles p
    where p.id = v_profile_id
    returning id into v_team_id;

    insert into public.match_team_members (match_id, team_id, participant_id)
    values (v_match_id, v_team_id, v_participant_id);
  end loop;

  insert into public.match_events (
    match_id,
    sequence,
    event_type,
    actor_profile_id,
    client_event_id,
    base_version,
    result_version,
    payload
  )
  values (
    v_match_id,
    1,
    'match_created',
    v_creator_profile_id,
    gen_random_uuid(),
    0,
    1,
    jsonb_build_object(
      'game_id', p_game_id,
      'variant_id', p_variant_id,
      'participant_count', cardinality(p_participant_profile_ids)
    )
  );

  return v_match_id;
end;
$$;

revoke all on function private.create_match(uuid, uuid, uuid, uuid[], text) from public, anon, authenticated;
grant execute on function private.create_match(uuid, uuid, uuid, uuid[], text) to authenticated;

create or replace function public.create_match(
  p_group_id uuid,
  p_game_id uuid,
  p_variant_id uuid,
  p_participant_profile_ids uuid[],
  p_notes text default null
)
returns uuid
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.create_match(p_group_id, p_game_id, p_variant_id, p_participant_profile_ids, p_notes);
$$;

revoke all on function public.create_match(uuid, uuid, uuid, uuid[], text) from public, anon;
grant execute on function public.create_match(uuid, uuid, uuid, uuid[], text) to authenticated;

commit;
