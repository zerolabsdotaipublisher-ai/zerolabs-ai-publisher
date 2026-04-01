import { notFound } from "next/navigation";
import { getServerUser } from "@/lib/supabase/server";
import { getWebsiteStructure } from "@/lib/ai/structure/storage";
import { Renderer } from "@/components/generated-site/renderer";

interface PageProps {
  params: Promise<{ id: string }>;
}

/**
 * Render a generated website structure by its ID.
 *
 * Protected by the (app) layout — authentication is already enforced.
 * Fetches the structure from Supabase, scoped to the authenticated user.
 * Returns 404 when the structure does not exist or belongs to another user.
 */
export default async function GeneratedSitePage({ params }: PageProps) {
  const { id } = await params;
  const user = await getServerUser();

  if (!user) {
    notFound();
  }

  const structure = await getWebsiteStructure(id, user.id);

  if (!structure) {
    notFound();
  }

  return (
    <div className="generated-site-container">
      <div className="generated-site-meta">
        <p className="generated-site-info">
          <span>{structure.siteTitle}</span>
          <span className="generated-site-status">{structure.status}</span>
          <span className="generated-site-version">v{structure.version}</span>
        </p>
      </div>
      <Renderer structure={structure} />
    </div>
  );
}
