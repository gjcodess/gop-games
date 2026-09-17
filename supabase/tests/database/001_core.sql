begin;

select plan(18);

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

select * from finish();
rollback;
