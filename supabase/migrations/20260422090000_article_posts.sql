-- Article storage for ZLAP-STORY 6-2
-- Stores structured AI-generated article metadata and content owned by the product.

create table if not exists public.article_posts (
  id           text        primary key,
  structure_id text        not null unique references public.website_structures(id) on delete cascade,
  user_id      uuid        not null references auth.users(id) on delete cascade,
  title        text        not null,
  slug         text        not null,
  article_type text        not null,
  article_json jsonb       not null,
  source_input jsonb       not null,
  version      integer     not null default 1,
  scheduled_publish_at timestamptz,
  published_at timestamptz,
  generated_at timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);

create index if not exists idx_article_posts_user on public.article_posts(user_id);
create index if not exists idx_article_posts_slug on public.article_posts(slug);
create index if not exists idx_article_posts_article_type on public.article_posts(article_type);
create index if not exists idx_article_posts_scheduled_publish_at on public.article_posts(scheduled_publish_at);

alter table public.article_posts enable row level security;

drop trigger if exists set_article_posts_updated_at on public.article_posts;
create trigger set_article_posts_updated_at
  before update on public.article_posts
  for each row
  execute function public.set_updated_at();

drop policy if exists "article_posts_select_own" on public.article_posts;
create policy "article_posts_select_own"
  on public.article_posts
  for select
  using (auth.uid() = user_id);

drop policy if exists "article_posts_insert_own" on public.article_posts;
create policy "article_posts_insert_own"
  on public.article_posts
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "article_posts_update_own" on public.article_posts;
create policy "article_posts_update_own"
  on public.article_posts
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "article_posts_delete_own" on public.article_posts;
create policy "article_posts_delete_own"
  on public.article_posts
  for delete
  using (auth.uid() = user_id);
