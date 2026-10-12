-- Supabase supports pg_cron. Run as the database owner, not through the Data API.
-- Expired hashes are removed within a minute even when there are no logins.
create extension if not exists pg_cron;
select cron.schedule(
  'bingo-purge-expired-login-attempts',
  '* * * * *',
  'select public.purge_expired_login_attempts()'
);
