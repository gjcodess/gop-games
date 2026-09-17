begin;

select plan(26);

select has_schema('public', 'public schema exists');
select has_table('public', 'profiles', 'profiles table exists');
select has_table('public', 'groups', 'groups table exists');
select has_table('public', 'group_memberships', 'group memberships table exists');
select has_table('public', 'games', 'games table exists');
select has_table('public', 'matches', 'matches table exists');
select has_table('public', 'match_events', 'match events table exists');
select has_table('public', 'score_events', 'score events table exists');
select has_table('public', 'flip7_round_cards', 'Flip 7 cards table exists');
select has_table('public', 'billiards_ball_states', 'billiards ball table exists');
select has_column('public', 'matches', 'version', 'matches have an optimistic-concurrency version');
select has_column('public', 'match_events', 'client_event_id', 'match events have idempotency keys');
select has_column('public', 'rule_revisions', 'winning_conditions', 'rules are structured');
select has_index('public', 'matches', 'matches_active_idx', 'active match index exists');
select has_index('public', 'match_events', 'match_events_client_event_idx', 'match event idempotency index exists');
select has_index('public', 'rule_revisions', 'rule_revisions_one_published_uidx', 'only one published rule revision is indexed');
select ok((select relrowsecurity from pg_class where oid = 'public.matches'::regclass), 'matches have RLS enabled');
select ok(
  exists (
    select 1
    from pg_trigger
    where tgrelid = 'auth.users'::regclass
      and tgname = 'on_auth_user_created'
      and not tgisinternal
  ),
  'new Auth users receive a profile'
);
select ok(
  exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'start_match'
  ),
  'public start_match RPC exists'
);
select ok(
  exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'record_binary_result'
  ),
  'public record_binary_result RPC exists'
);
select ok(
  exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'finalize_flip7_round'
  ),
  'public finalize_flip7_round RPC exists'
);
select ok(
  exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'initialize_billiards_match'
  ),
  'public initialize_billiards_match RPC exists'
);
select ok(
  exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'apply_billiards_event'
  ),
  'public apply_billiards_event RPC exists'
);
select ok(
  exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'public' and p.proname = 'complete_billiards_match'
  ),
  'public complete_billiards_match RPC exists'
);
select ok(
  exists (
    select 1 from pg_trigger
    where tgrelid = 'public.match_events'::regclass
      and tgname = 'match_events_broadcast_trigger'
      and not tgisinternal
  ),
  'match event broadcasts are triggered after commit'
);
select ok(
  exists (
    select 1 from pg_proc p
    join pg_namespace n on n.oid = p.pronamespace
    where n.nspname = 'private'
      and p.proname = 'broadcast_match_event'
      and p.prosecdef
  ),
  'match event broadcaster is isolated as a security definer'
);

select * from finish();
rollback;
