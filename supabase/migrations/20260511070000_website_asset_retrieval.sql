-- Website asset retrieval lookup support for ZLAP-STORY 10-6
-- Reuses media, AI assets, website media library, and storage access metadata already owned by AI Publisher.

create index if not exists idx_website_media_library_items_ai_asset
  on public.website_media_library_items(user_id, tenant_id, ai_asset_id, created_at desc)
  where ai_asset_id is not null and deleted_at is null;

create index if not exists idx_website_media_library_items_assoc_summary
  on public.website_media_library_items using gin(association_summary_json jsonb_path_ops);

create index if not exists idx_website_media_library_usage_context
  on public.website_media_library_usage(user_id, tenant_id, website_id, page_id, section_id, updated_at desc);

create index if not exists idx_website_media_library_usage_content
  on public.website_media_library_usage(user_id, tenant_id, content_type, content_id, updated_at desc);
