-- AI content review state persistence for ZLAP-STORY 9-1

create table if not exists public.ai_content_reviews (
  user_id uuid not null references auth.users(id) on delete cascade,
  content_id text not null,
  content_type text not null,
  source_id text not null,
  structure_id text,
  state text not null default 'pending_review',
  decision_note text,
  feedback_json jsonb not null default '{}'::jsonb,
  approved_at timestamptz,
  rejected_at timestamptz,
  last_reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint ai_content_reviews_pkey primary key (user_id, content_id),
  constraint ai_content_reviews_content_type_check
    check (content_type in ('website_page', 'blog_post', 'article', 'social_post')),
  constraint ai_content_reviews_state_check
    check (state in ('pending_review', 'approved', 'rejected', 'needs_changes'))
);

create index if not exists idx_ai_content_reviews_user_state_updated
  on public.ai_content_reviews(user_id, state, updated_at desc);

create index if not exists idx_ai_content_reviews_user_structure
  on public.ai_content_reviews(user_id, structure_id)
  where structure_id is not null;

alter table public.ai_content_reviews enable row level security;

drop trigger if exists set_ai_content_reviews_updated_at on public.ai_content_reviews;
create trigger set_ai_content_reviews_updated_at
  before update on public.ai_content_reviews
  for each row
  execute function public.set_updated_at();

drop policy if exists "content_reviews_select_own" on public.ai_content_reviews;
create policy "content_reviews_select_own"
  on public.ai_content_reviews
  for select
  using (auth.uid() = user_id);

drop policy if exists "content_reviews_insert_own" on public.ai_content_reviews;
create policy "content_reviews_insert_own"
  on public.ai_content_reviews
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "content_reviews_update_own" on public.ai_content_reviews;
create policy "content_reviews_update_own"
  on public.ai_content_reviews
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "content_reviews_delete_own" on public.ai_content_reviews;
create policy "content_reviews_delete_own"
  on public.ai_content_reviews
  for delete
  using (auth.uid() = user_id);
