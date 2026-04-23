-- Generated content storage hardening for ZLAP-STORY 6-6
-- Consolidates lifecycle, audit, retrieval, and soft archive/delete behavior
-- across existing AI Publisher product-owned content tables.

-- -----------------------------------------------------------------------------
-- website_structures
-- -----------------------------------------------------------------------------
alter table public.website_structures
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_by uuid references auth.users(id) on delete set null,
  add column if not exists deleted_at timestamptz;

update public.website_structures
   set created_by = coalesce(created_by, user_id),
       updated_by = coalesce(updated_by, user_id)
 where created_by is null
    or updated_by is null;

alter table public.website_structures
  drop constraint if exists website_structures_status_check;

alter table public.website_structures
  add constraint website_structures_status_check
  check (status in ('draft', 'generated', 'edited', 'scheduled', 'published', 'archived', 'deleted'));

create index if not exists idx_website_structures_user_status_updated
  on public.website_structures(user_id, status, updated_at desc);

create index if not exists idx_website_structures_website_type_status
  on public.website_structures(website_type, status);

create index if not exists idx_website_structures_generated_at
  on public.website_structures(generated_at desc);

create index if not exists idx_website_structures_deleted_at
  on public.website_structures(deleted_at)
  where deleted_at is not null;

-- -----------------------------------------------------------------------------
-- website_generated_content
-- -----------------------------------------------------------------------------
alter table public.website_generated_content
  add column if not exists content_type text not null default 'website',
  add column if not exists content_status text not null default 'generated',
  add column if not exists schedule_state text,
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_by uuid references auth.users(id) on delete set null,
  add column if not exists is_archived boolean not null default false,
  add column if not exists archived_at timestamptz,
  add column if not exists deleted_at timestamptz;

update public.website_generated_content
   set content_type = coalesce(
         nullif((generated_from_input ->> 'websiteType'), ''),
         content_type,
         'website'
       ),
       created_by = coalesce(created_by, user_id),
       updated_by = coalesce(updated_by, user_id)
 where created_by is null
    or updated_by is null
    or content_type is null
    or content_type = '';

alter table public.website_generated_content
  drop constraint if exists website_generated_content_status_check;

alter table public.website_generated_content
  add constraint website_generated_content_status_check
  check (content_status in ('draft', 'generated', 'edited', 'scheduled', 'published', 'archived', 'deleted'));

alter table public.website_generated_content
  drop constraint if exists website_generated_content_schedule_state_check;

alter table public.website_generated_content
  add constraint website_generated_content_schedule_state_check
  check (schedule_state is null or schedule_state in ('none', 'active', 'paused', 'running', 'completed', 'failed', 'cancelled'));

create index if not exists idx_website_generated_content_owner_lookup
  on public.website_generated_content(user_id, structure_id, page_slug);

create index if not exists idx_website_generated_content_type_status
  on public.website_generated_content(content_type, content_status);

create index if not exists idx_website_generated_content_schedule_state
  on public.website_generated_content(schedule_state)
  where schedule_state is not null;

create index if not exists idx_website_generated_content_updated_at
  on public.website_generated_content(updated_at desc);

create index if not exists idx_website_generated_content_created_at
  on public.website_generated_content(created_at desc);

create index if not exists idx_website_generated_content_not_deleted
  on public.website_generated_content(structure_id, user_id)
  where deleted_at is null;

-- -----------------------------------------------------------------------------
-- website_seo_metadata
-- -----------------------------------------------------------------------------
alter table public.website_seo_metadata
  add column if not exists content_status text not null default 'generated',
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_by uuid references auth.users(id) on delete set null,
  add column if not exists archived_at timestamptz,
  add column if not exists deleted_at timestamptz;

update public.website_seo_metadata
   set created_by = coalesce(created_by, user_id),
       updated_by = coalesce(updated_by, user_id)
 where created_by is null
    or updated_by is null;

alter table public.website_seo_metadata
  drop constraint if exists website_seo_metadata_status_check;

alter table public.website_seo_metadata
  add constraint website_seo_metadata_status_check
  check (content_status in ('draft', 'generated', 'edited', 'scheduled', 'published', 'archived', 'deleted'));

create index if not exists idx_website_seo_metadata_user_status
  on public.website_seo_metadata(user_id, content_status, updated_at desc);

create index if not exists idx_website_seo_metadata_deleted_at
  on public.website_seo_metadata(deleted_at)
  where deleted_at is not null;

-- -----------------------------------------------------------------------------
-- blog_posts
-- -----------------------------------------------------------------------------
alter table public.blog_posts
  add column if not exists content_status text not null default 'generated',
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_by uuid references auth.users(id) on delete set null,
  add column if not exists archived_at timestamptz,
  add column if not exists deleted_at timestamptz;

update public.blog_posts
   set created_by = coalesce(created_by, user_id),
       updated_by = coalesce(updated_by, user_id)
 where created_by is null
    or updated_by is null;

alter table public.blog_posts
  drop constraint if exists blog_posts_content_status_check;

alter table public.blog_posts
  add constraint blog_posts_content_status_check
  check (content_status in ('draft', 'generated', 'edited', 'scheduled', 'published', 'archived', 'deleted'));

create index if not exists idx_blog_posts_user_status_updated
  on public.blog_posts(user_id, content_status, updated_at desc);

create index if not exists idx_blog_posts_structure_status
  on public.blog_posts(structure_id, content_status);

create index if not exists idx_blog_posts_deleted_at
  on public.blog_posts(deleted_at)
  where deleted_at is not null;

-- -----------------------------------------------------------------------------
-- article_posts
-- -----------------------------------------------------------------------------
alter table public.article_posts
  add column if not exists content_status text not null default 'generated',
  add column if not exists created_by uuid references auth.users(id) on delete set null,
  add column if not exists updated_by uuid references auth.users(id) on delete set null,
  add column if not exists archived_at timestamptz,
  add column if not exists deleted_at timestamptz;

update public.article_posts
   set created_by = coalesce(created_by, user_id),
       updated_by = coalesce(updated_by, user_id)
 where created_by is null
    or updated_by is null;

alter table public.article_posts
  drop constraint if exists article_posts_content_status_check;

alter table public.article_posts
  add constraint article_posts_content_status_check
  check (content_status in ('draft', 'generated', 'edited', 'scheduled', 'published', 'archived', 'deleted'));

create index if not exists idx_article_posts_user_status_updated
  on public.article_posts(user_id, content_status, updated_at desc);

create index if not exists idx_article_posts_structure_status
  on public.article_posts(structure_id, content_status);

create index if not exists idx_article_posts_deleted_at
  on public.article_posts(deleted_at)
  where deleted_at is not null;
