-- Generated website content storage for ZLAP-STORY 3-4
-- Stores typed section/page copy generated from AI content workflows.

create table if not exists public.website_generated_content (
  id                    text        primary key,
  structure_id          text        not null references public.website_structures(id) on delete cascade,
  user_id               uuid        not null references auth.users(id) on delete cascade,
  page_slug             text        not null,
  section_key           text        not null,
  content_json          jsonb       not null,
  generated_from_input  jsonb       not null,
  version               integer     not null default 1,
  created_at            timestamptz not null default now(),
  updated_at            timestamptz not null default now()
);

create index if not exists idx_website_generated_content_structure
  on public.website_generated_content(structure_id);

create index if not exists idx_website_generated_content_user
  on public.website_generated_content(user_id);

create unique index if not exists uq_website_generated_content_lookup
  on public.website_generated_content(structure_id, page_slug, section_key);

alter table public.website_generated_content enable row level security;

drop trigger if exists set_website_generated_content_updated_at on public.website_generated_content;
create trigger set_website_generated_content_updated_at
  before update on public.website_generated_content
  for each row
  execute function public.set_updated_at();

drop policy if exists "generated_content_select_own" on public.website_generated_content;
create policy "generated_content_select_own"
  on public.website_generated_content
  for select
  using (auth.uid() = user_id);

drop policy if exists "generated_content_insert_own" on public.website_generated_content;
create policy "generated_content_insert_own"
  on public.website_generated_content
  for insert
  with check (auth.uid() = user_id);

drop policy if exists "generated_content_update_own" on public.website_generated_content;
create policy "generated_content_update_own"
  on public.website_generated_content
  for update
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

drop policy if exists "generated_content_delete_own" on public.website_generated_content;
create policy "generated_content_delete_own"
  on public.website_generated_content
  for delete
  using (auth.uid() = user_id);
