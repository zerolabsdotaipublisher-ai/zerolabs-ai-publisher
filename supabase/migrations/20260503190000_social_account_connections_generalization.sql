-- ZLAP-STORY 7-6 social account connection model generalization

alter table public.social_account_connections
  add column if not exists platform_account_id text,
  add column if not exists account_display_name text,
  add column if not exists account_username text,
  add column if not exists profile_url text,
  add column if not exists profile_picture_url text,
  add column if not exists token_reference text,
  add column if not exists last_connected_at timestamptz;

alter table public.social_account_connections
  drop constraint if exists social_account_connections_platform_check;
alter table public.social_account_connections
  add constraint social_account_connections_platform_check
  check (platform in ('instagram', 'facebook', 'linkedin', 'x'));

alter table public.social_account_connections
  drop constraint if exists social_account_connections_status_check;
alter table public.social_account_connections
  add constraint social_account_connections_status_check
  check (connection_status in (
    'disconnected',
    'connecting',
    'connected',
    'token_expiring',
    'reconnect_required',
    'revoked',
    'expired',
    'invalid',
    'reauthorization_required'
  ));

create index if not exists idx_social_account_connections_platform_account
  on public.social_account_connections(platform, platform_account_id)
  where platform_account_id is not null;
