begin;

create index if not exists billiards_assignments_team_match_idx
  on public.billiards_assignments (team_id, match_id);

create index if not exists billiards_ball_states_assignment_team_match_idx
  on public.billiards_ball_states (assignment_team_id, match_id);

create index if not exists billiards_ball_states_pocketed_participant_match_idx
  on public.billiards_ball_states (pocketed_by_participant_id, match_id);

create index if not exists billiards_events_actor_profile_idx
  on public.billiards_events (actor_profile_id);

create index if not exists billiards_events_turn_idx
  on public.billiards_events (turn_id);

create index if not exists billiards_state_active_team_match_idx
  on public.billiards_match_state (active_team_id, match_id);

create index if not exists billiards_state_active_participant_match_idx
  on public.billiards_match_state (active_participant_id, match_id);

create index if not exists billiards_turns_team_match_idx
  on public.billiards_turns (team_id, match_id);

create index if not exists billiards_turns_participant_match_idx
  on public.billiards_turns (participant_id, match_id);

commit;
