-- Social media post storage for ZLAP-STORY 7-2
-- Stores AI-generated platform-specific social post variants owned by AI Publisher.

create table if not exists public.social_posts (
  id                    text        primary key,
  user_id               uuid        not null references auth.users(id) on delete cascade,
  structure_id          text        references public.website_structures(id) on delete set null,
  topic                 text        not null,
  title                 text        not null,
  source_type           text        not null,
  social_json           jsonb       not null,
  source_input          jsonb       not null,
  content_status        text        not null default 'generated',
  version               integer     not null default 1,
  regeneration_count    integer     not null default 0,
  created_by            uuid references auth.users(id) on delete set null,
  updated_by            uuid references auth.users(id) on delete set null,
  archived_at           timestamptz,
  deleted_at            timestamptz,
  generated_at          timestamptz not null default now(),
  updated_at            timestamptz not null default now(),
  scheduled_publish_at  timestamptz,
  published_at          timestamptz
);

create index if not exists idx_social_posts_user on public.social_posts(user_id);
create index if not exists idx_social_posts_structure on public.social_posts(structure_id);
create index if not exists idx_social_posts_user_status_updated on public.social_posts(user_id, content_status, updated_at desc);
create index if not exists idx_social_posts_deleted_at on public.social_posts(deleted_at) where deleted_at is not null;

alter table public.social_posts
  drop constraint if exists social_posts_content_status_check;

alter table public.social_posts
  add constraint social_posts_content_status_check
  check (content_status in ('draft', 'generated', 'edited', 'scheduled', 'published', 'archived', 'deleted'));

alter table public.social_posts
  drop constraint if exists social_posts_source_type_check;

alter table public.social_posts
  add constraint social_posts_source_type_check
  check (source_type in ('website', 'blog', 'article', 'custom'));

alter table public.social_posts enable row level security;

drop trigger if exists set_social_posts_updated_at on public.social_posts;
create trigger set_social_posts_updated_at
  before update on public.social_posts
  for each row
  execute function public.set_updated_at();

drop policy if exists "social_posts_select_own" on public.social_posts;
create policy "social_posts_select_own"
  on public.social_posts
  for select
  using (auth.uid() = user_id);

drop policy if exists "social_posts_insert_own" on public.social_posts;
create policy "social_posts_insert_own"
  on public.social_posts
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "social_posts_update_own" on public.social_posts;
create policy "social_posts_update_own"
  on public.social_posts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "social_posts_delete_own" on public.social_posts;
create policy "social_posts_delete_own"
  on public.social_posts
  for delete
  using (auth.uid() = user_id);
