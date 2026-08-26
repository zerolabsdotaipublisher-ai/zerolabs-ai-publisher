import { getSupabaseServiceClient } from "@/lib/supabase/server";
import type { WebsiteStructure } from "@/lib/ai/structure";
import type { WebsiteContentPackage, GeneratedSectionContentMap } from "@/lib/ai/content";

export async function storeWebsiteProjectData(args: {
  structure: WebsiteStructure;
  userId: string;
  requestId?: string;
  content?: WebsiteContentPackage;
}) {
  const supabase = getSupabaseServiceClient();

  const { structure, userId, content } = args;

  try {
    // 1. website_projects
    const { data: project, error: projectError } = await supabase
      .from("website_projects")
      .insert({
        user_id: userId,
        title: structure.management?.displayName || structure.sourceInput.brandName || "Untitled Website",
        website_type: structure.sourceInput.websiteType || null,
        business_type: null,
        industry: null,
        tagline: structure.sourceInput.description || null,
        number_of_pages: structure.routing?.routes?.length || 1,
        selected_pages: null,
        generation_prompt: structure.sourceInput.description || null,
        status: structure.status === "generated" ? "generated" : "draft",
        visibility: "private",
        source_structure_id: structure.id,
      })
      .select("id")
      .single();

    if (projectError || !project) {
        console.error("Failed to insert website_projects", projectError);
        return;
    }
    const projectId = project.id;

    // 2. website_design_configs
    const designConfig = (structure.sourceInput.designConfig as unknown as Record<string, unknown>) || {};
    await supabase.from("website_design_configs").insert({
      website_project_id: projectId,
      user_id: userId,
      color_palette: designConfig.colorPalette || designConfig.color_palette || null,
      typography: designConfig.typography || null,
      layout: designConfig.layout || null,
      navigation_style: designConfig.navigationStyle || designConfig.navigation_style || null,
      footer_style: designConfig.footerStyle || designConfig.footer_style || null,
      container_style: designConfig.containerStyle || designConfig.container_style || null,
      background_style: designConfig.backgroundStyle || designConfig.background_style || null,
      content_formatting: designConfig.contentFormatting || designConfig.content_formatting || null,
    });

    // 3. website_pages
    if (content?.pages) {
      for (let i = 0; i < content.pages.length; i++) {
        const p = content.pages[i];

        const { data: page, error: pageError } = await supabase
          .from("website_pages")
          .insert({
            website_project_id: projectId,
            user_id: userId,
            page_key: p.pageSlug || `page-${i}`,
            page_title: p.messaging?.pageHeadline || p.pageType || "Untitled",
            page_slug: p.pageSlug || "/",
            seo_title: null,
            seo_description: null,
            sort_order: i,
            is_homepage: i === 0,
            is_enabled: true
          })
          .select("id")
          .single();

        if (!pageError && page && p.sections) {
          // 4. website_page_sections
          const sectionKeys = Object.keys(p.sections) as Array<keyof GeneratedSectionContentMap>;
          for (let j = 0; j < sectionKeys.length; j++) {
            const secKey = sectionKeys[j];
            const sec = p.sections[secKey];
            if (!sec) continue;

            await supabase.from("website_page_sections").insert({
              website_project_id: projectId,
              website_page_id: page.id,
              user_id: userId,
              section_key: secKey,
              section_type: secKey,
              heading: (sec as Record<string, unknown>).heading || null,
              subheading: (sec as Record<string, unknown>).subheading || null,
              body: (sec as Record<string, unknown>).body || (sec as Record<string, unknown>).content || null,
              content: sec || null,
              style_overrides: null,
              sort_order: j,
              is_enabled: true
            });
          }
        }
      }
    }

  } catch (err) {
      console.error("Error storing website project data", err);
  }
}
