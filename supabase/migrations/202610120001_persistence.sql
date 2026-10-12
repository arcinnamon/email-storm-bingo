-- One canonical configuration. There are deliberately no public RLS policies.
create function public.valid_bingo_phrases(phrases text[])
returns boolean
language sql immutable strict
set search_path = ''
as $$
  select coalesce(
    array_ndims(phrases) = 1
    and cardinality(phrases) between 24 and 200
    and not exists (
      select 1 from unnest(phrases) as phrase
      where phrase is null or char_length(btrim(phrase)) not between 1 and 100
        or phrase <> btrim(phrase) or lower(phrase) = 'free space'
    )
    and (select count(distinct lower(phrase)) from unnest(phrases) as phrase) = cardinality(phrases),
    false
  );
$$;

create table public.bingo_config (
  id integer primary key default 1 check (id = 1),
  phrases text[] not null check (public.valid_bingo_phrases(phrases)),
  version integer not null default 1 check (version > 0),
  updated_at timestamptz not null default now()
);

-- Phase 5 will write HMAC-SHA256(IP, server secret), never a raw IP or plain hash.
-- One capped counter per client, rather than an ever-growing event log.
create table public.login_attempts (
  client_hash text primary key check (client_hash ~ '^[0-9a-f]{64}$'),
  failures smallint not null check (failures between 1 and 5),
  expires_at timestamptz not null default (now() + interval '15 minutes')
    check (expires_at <= now() + interval '15 minutes')
);
create index login_attempts_expiry_idx on public.login_attempts (expires_at);

alter table public.bingo_config enable row level security;
alter table public.login_attempts enable row level security;
revoke all on public.bingo_config, public.login_attempts from public, anon, authenticated;
grant usage on schema public to service_role;
grant select, insert, update on public.bingo_config to service_role;
grant select, insert, update, delete on public.login_attempts to service_role;

-- UPDATE takes a row lock and rechecks the predicate after a concurrent writer.
-- A stale/missing version returns zero rows and cannot overwrite newer data.
create function public.update_bingo_config(expected_version integer, new_phrases text[])
returns setof public.bingo_config
language sql security invoker
set search_path = ''
as $$
  update public.bingo_config
  set phrases = new_phrases, version = version + 1, updated_at = clock_timestamp()
  where id = 1 and version = expected_version
  returning *;
$$;

-- No read-before-write race; even simultaneous seeds cannot replace a row.
create function public.seed_bingo_config(initial_phrases text[])
returns boolean
language sql security invoker
set search_path = ''
as $$
  with inserted as (
    insert into public.bingo_config (id, phrases)
    values (1, initial_phrases)
    on conflict (id) do nothing
    returning id
  )
  select exists (select 1 from inserted);
$$;

create function public.purge_expired_login_attempts()
returns void
language sql security invoker
set search_path = ''
as $$
  delete from public.login_attempts where expires_at <= now();
$$;

revoke all on function public.valid_bingo_phrases(text[]) from public, anon, authenticated;
revoke all on function public.update_bingo_config(integer, text[]) from public, anon, authenticated;
revoke all on function public.seed_bingo_config(text[]) from public, anon, authenticated;
revoke all on function public.purge_expired_login_attempts() from public, anon, authenticated;
grant execute on function public.valid_bingo_phrases(text[]) to service_role;
grant execute on function public.update_bingo_config(integer, text[]) to service_role;
grant execute on function public.seed_bingo_config(text[]) to service_role;
grant execute on function public.purge_expired_login_attempts() to service_role;
