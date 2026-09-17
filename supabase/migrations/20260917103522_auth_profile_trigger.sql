begin;

create or replace function private.handle_new_auth_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_display_name text;
begin
  v_display_name := nullif(btrim(coalesce(new.raw_user_meta_data ->> 'display_name', '')), '');

  if v_display_name is null then
    v_display_name := left(
      coalesce(nullif(split_part(coalesce(new.email, ''), '@', 1), ''), 'Player'),
      80
    );
  end if;

  insert into public.profiles (auth_user_id, display_name)
  values (new.id, v_display_name)
  on conflict (auth_user_id) do nothing;

  return new;
end;
$$;

revoke all on function private.handle_new_auth_user() from public, anon, authenticated;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function private.handle_new_auth_user();

commit;
