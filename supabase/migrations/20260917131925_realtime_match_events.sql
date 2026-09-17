begin;

create or replace function private.broadcast_match_event()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  perform realtime.send(
    jsonb_build_object(
      'match_id', new.match_id,
      'aggregate_version', new.result_version,
      'sequence', new.sequence,
      'event_id', new.event_id,
      'event_type', new.event_type,
      'actor_profile_id', new.actor_profile_id,
      'occurred_at', new.created_at,
      'payload', new.payload
    ),
    'match_event',
    'match:' || new.match_id::text,
    true
  );

  return new;
end;
$$;

revoke all on function private.broadcast_match_event() from public, anon, authenticated;

drop trigger if exists match_events_broadcast_trigger on public.match_events;

create trigger match_events_broadcast_trigger
after insert on public.match_events
for each row
execute function private.broadcast_match_event();

commit;
