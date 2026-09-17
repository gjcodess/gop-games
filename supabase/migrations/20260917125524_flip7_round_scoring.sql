begin;

create or replace function private.finalize_flip7_round(
  p_match_id uuid,
  p_expected_version bigint,
  p_client_event_id uuid,
  p_players jsonb
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
  v_actor_profile_id uuid;
  v_participant_count integer;
  v_input_count integer;
  v_round_number integer;
  v_round_id uuid;
  v_next_version bigint;
  v_player jsonb;
  v_card jsonb;
  v_cards jsonb;
  v_participant_id uuid;
  v_card_code text;
  v_card_kind text;
  v_numeric_value smallint;
  v_entry_order integer;
  v_number_subtotal integer;
  v_additive_points integer;
  v_number_card_count smallint;
  v_multiplier_count smallint;
  v_distinct_number_count integer;
  v_busted boolean;
  v_points integer;
  v_player_status text;
  v_max_total integer;
  v_leader_count integer;
  v_match_completed boolean := false;
  v_winner_ids jsonb := '[]'::jsonb;
  v_scores jsonb := '[]'::jsonb;
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

  if v_status <> 'active' then
    raise exception using errcode = '22023', message = 'Flip 7 rounds require an active match.';
  end if;

  if not exists (
    select 1 from public.games g
    where g.id = v_game_id and g.scoring_model = 'flip7'
  ) then
    raise exception using errcode = '22023', message = 'This match is not a Flip 7 match.';
  end if;

  if p_players is null or jsonb_typeof(p_players) <> 'array' then
    raise exception using errcode = '22023', message = 'Flip 7 players must be a JSON array.';
  end if;

  select count(*) into v_participant_count
  from public.match_participants mp
  where mp.match_id = p_match_id and mp.status = 'active';

  select count(*) into v_input_count
  from jsonb_array_elements(p_players);

  if v_input_count <> v_participant_count then
    raise exception using errcode = '22023', message = 'Every active participant needs a Flip 7 round entry.';
  end if;

  if exists (
    select 1
    from (
      select value ->> 'participant_id' as participant_id, count(*) as entry_count
      from jsonb_array_elements(p_players)
      group by value ->> 'participant_id'
      having count(*) > 1
    ) duplicate_entries
  ) then
    raise exception using errcode = '22023', message = 'A participant cannot have more than one round entry.';
  end if;

  select coalesce(max(mr.round_number), 0) + 1
    into v_round_number
  from public.match_rounds mr
  where mr.match_id = p_match_id and mr.status <> 'voided';

  v_next_version := v_version + 1;

  insert into public.match_rounds (
    match_id, round_number, revision, status, version, finalized_at
  )
  values (
    p_match_id, v_round_number, 1, 'finalized', 1, now()
  )
  returning id into v_round_id;

  insert into public.match_scores (match_id, participant_id, total)
  select p_match_id, mp.id, 0
  from public.match_participants mp
  where mp.match_id = p_match_id and mp.status = 'active'
  on conflict (match_id, participant_id) do nothing;

  for v_player in select value from jsonb_array_elements(p_players) loop
    v_participant_id := (v_player ->> 'participant_id')::uuid;
    v_cards := v_player -> 'cards';

    if not exists (
      select 1 from public.match_participants mp
      where mp.id = v_participant_id and mp.match_id = p_match_id and mp.status = 'active'
    ) then
      raise exception using errcode = '22023', message = 'A round entry references an inactive or unknown participant.';
    end if;

    if v_cards is null or jsonb_typeof(v_cards) <> 'array' then
      raise exception using errcode = '22023', message = 'Each Flip 7 participant needs a cards array.';
    end if;

    v_number_subtotal := 0;
    v_additive_points := 0;
    v_number_card_count := 0;
    v_multiplier_count := 0;

    for v_card, v_entry_order in
      select value, ordinality::integer
      from jsonb_array_elements(v_cards) with ordinality
    loop
      v_card_code := v_card ->> 'code';

      select d.card_kind, d.numeric_value
        into v_card_kind, v_numeric_value
      from public.flip7_card_definitions d
      where d.code = v_card_code;

      if not found then
        raise exception using errcode = '22023', message = 'A round entry references an unknown Flip 7 card.';
      end if;

      insert into public.flip7_round_cards (
        match_id, round_id, participant_id, card_code, entry_order
      )
      values (
        p_match_id, v_round_id, v_participant_id, v_card_code, v_entry_order::smallint
      );

      if v_card_kind = 'number' then
        v_number_subtotal := v_number_subtotal + v_numeric_value;
        v_number_card_count := v_number_card_count + 1;
      elsif v_card_kind = 'additive' then
        v_additive_points := v_additive_points + v_numeric_value;
      elsif v_card_kind = 'multiplier' then
        v_multiplier_count := v_multiplier_count + 1;
      end if;
    end loop;

    if v_multiplier_count > 1 then
      raise exception using errcode = '22023', message = 'A Flip 7 participant can use at most one multiplier.';
    end if;

    if exists (
      select 1
      from (
        select d.numeric_value, count(*) as card_count
        from public.flip7_round_cards rc
        join public.flip7_card_definitions d on d.code = rc.card_code
        where rc.round_id = v_round_id
          and rc.participant_id = v_participant_id
          and d.card_kind = 'number'
        group by d.numeric_value
        having count(*) > 1
      ) duplicate_numbers
    ) then
      v_busted := true;
    else
      v_busted := false;
    end if;

    select count(distinct d.numeric_value)
      into v_distinct_number_count
    from public.flip7_round_cards rc
    join public.flip7_card_definitions d on d.code = rc.card_code
    where rc.round_id = v_round_id
      and rc.participant_id = v_participant_id
      and d.card_kind = 'number';

    if v_busted then
      v_points := 0;
      v_player_status := 'busted';
    else
      v_points := (v_number_subtotal * case when v_multiplier_count = 1 then 2 else 1 end)
        + v_additive_points
        + case when v_distinct_number_count >= 7 then 15 else 0 end;
      v_player_status := 'finalized';
    end if;

    insert into public.flip7_round_player_state (
      match_id, round_id, participant_id, status, calculated_points, busted,
      has_multiplier, additive_points, number_card_count, input_version, finalized_at
    )
    values (
      p_match_id, v_round_id, v_participant_id, v_player_status, v_points, v_busted,
      v_multiplier_count = 1, v_additive_points, v_number_card_count, 1, now()
    );

    insert into public.score_events (
      match_id, round_id, participant_id, delta, event_kind, actor_profile_id, client_event_id
    )
    values (
      p_match_id, v_round_id, v_participant_id, v_points, 'round_score', v_actor_profile_id, gen_random_uuid()
    );

    update public.match_scores
    set total = total + v_points,
        last_round_id = v_round_id
    where match_id = p_match_id and participant_id = v_participant_id;
  end loop;

  if exists (
    select 1
    from (
      select rc.card_code, count(*) as used_count, d.copies
      from public.flip7_round_cards rc
      join public.flip7_card_definitions d on d.code = rc.card_code
      where rc.round_id = v_round_id
      group by rc.card_code, d.copies
      having count(*) > d.copies
    ) overused_cards
  ) then
    raise exception using errcode = '22023', message = 'The round uses more cards than the configured deck allows.';
  end if;

  select max(ms.total) into v_max_total
  from public.match_scores ms
  where ms.match_id = p_match_id;

  if v_max_total >= 200 then
    select count(*) into v_leader_count
    from public.match_scores ms
    where ms.match_id = p_match_id and ms.total = v_max_total;

    if v_leader_count = 1 then
      v_match_completed := true;
      select coalesce(jsonb_agg(ms.participant_id order by ms.participant_id), '[]'::jsonb)
        into v_winner_ids
      from public.match_scores ms
      where ms.match_id = p_match_id and ms.total = v_max_total;
    end if;
  end if;

  select coalesce(
    jsonb_agg(
      jsonb_build_object('participant_id', ms.participant_id, 'total', ms.total)
      order by ms.participant_id
    ),
    '[]'::jsonb
  ) into v_scores
  from public.match_scores ms
  where ms.match_id = p_match_id;

  update public.matches
  set status = case when v_match_completed then 'completed' else 'active' end,
      started_at = coalesce(started_at, now()),
      completed_at = case when v_match_completed then now() else completed_at end,
      version = v_next_version
  where id = p_match_id;

  insert into public.match_events (
    match_id, sequence, event_type, actor_profile_id, client_event_id,
    base_version, result_version, payload
  )
  values (
    p_match_id,
    v_next_version,
    'flip7_round_finalized',
    v_actor_profile_id,
    p_client_event_id,
    v_version,
    v_next_version,
    jsonb_build_object(
      'round_id', v_round_id,
      'round_number', v_round_number,
      'scores', v_scores,
      'completed', v_match_completed,
      'winner_participant_ids', v_winner_ids
    )
  );

  return v_next_version;
end;
$$;

revoke all on function private.finalize_flip7_round(uuid, bigint, uuid, jsonb) from public, anon, authenticated;
grant execute on function private.finalize_flip7_round(uuid, bigint, uuid, jsonb) to authenticated;

create or replace function public.finalize_flip7_round(
  p_match_id uuid,
  p_expected_version bigint,
  p_client_event_id uuid,
  p_players jsonb
)
returns bigint
language sql
volatile
security invoker
set search_path = ''
as $$
  select private.finalize_flip7_round(p_match_id, p_expected_version, p_client_event_id, p_players);
$$;

revoke all on function public.finalize_flip7_round(uuid, bigint, uuid, jsonb) from public, anon;
grant execute on function public.finalize_flip7_round(uuid, bigint, uuid, jsonb) to authenticated;

commit;
