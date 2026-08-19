-- Community content storage
-- Stores blog posts created by users and references to saved community content.

create table if not exists public.community_posts (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  title         text        not null,
  content       text        not null,
  visibility    text        not null default 'draft' check (visibility in ('draft', 'public')),
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create index if not exists idx_community_posts_user on public.community_posts(user_id);
create index if not exists idx_community_posts_visibility on public.community_posts(visibility);

alter table public.community_posts enable row level security;

drop trigger if exists set_community_posts_updated_at on public.community_posts;
create trigger set_community_posts_updated_at
  before update on public.community_posts
  for each row
  execute function public.set_updated_at();

-- Users can read their own posts, or any public posts.
drop policy if exists "community_posts_select" on public.community_posts;
create policy "community_posts_select"
  on public.community_posts
  for select
  using (auth.uid() = user_id or visibility = 'public');

-- Users may only insert posts they own.
drop policy if exists "community_posts_insert_own" on public.community_posts;
create policy "community_posts_insert_own"
  on public.community_posts
  for insert
  with check (auth.uid() = user_id);

-- Users may only update their own posts.
drop policy if exists "community_posts_update_own" on public.community_posts;
create policy "community_posts_update_own"
  on public.community_posts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

-- Users may only delete their own posts.
drop policy if exists "community_posts_delete_own" on public.community_posts;
create policy "community_posts_delete_own"
  on public.community_posts
  for delete
  using (auth.uid() = user_id);


create table if not exists public.community_saved_items (
  id            uuid        primary key default gen_random_uuid(),
  user_id       uuid        not null references auth.users(id) on delete cascade,
  content_id    text        not null,
  content_type  text        not null check (content_type in ('website', 'post')),
  created_at    timestamptz not null default now(),
  unique(user_id, content_id, content_type)
);

create index if not exists idx_community_saved_items_user on public.community_saved_items(user_id);

alter table public.community_saved_items enable row level security;

-- Users may only read their own saved items.
drop policy if exists "saved_items_select_own" on public.community_saved_items;
create policy "saved_items_select_own"
  on public.community_saved_items
  for select
  using (auth.uid() = user_id);

-- Users may only insert their own saved items.
drop policy if exists "saved_items_insert_own" on public.community_saved_items;
create policy "saved_items_insert_own"
  on public.community_saved_items
  for insert
  with check (auth.uid() = user_id);

-- Users may only delete their own saved items.
drop policy if exists "saved_items_delete_own" on public.community_saved_items;
create policy "saved_items_delete_own"
  on public.community_saved_items
  for delete
  using (auth.uid() = user_id);
