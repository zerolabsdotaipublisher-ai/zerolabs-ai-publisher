import { routes } from "@/config/routes";
import { ReviewShell } from "@/components/review/review-shell";
import { parseReviewQuery, listOwnedReviewPage } from "@/lib/review";
import { requireUser } from "@/lib/supabase/auth";

interface PageProps {
  searchParams?: Promise<Record<string, string | undefined>>;
}

export default async function ReviewPage({ searchParams }: PageProps) {
  const user = await requireUser(routes.review);
  const queryParams = searchParams ? await searchParams : undefined;
  const params = new URLSearchParams();

  if (queryParams) {
    Object.entries(queryParams).forEach(([key, value]) => {
      if (typeof value === "string") {
        params.set(key, value);
      }
    });
  }

  const query = parseReviewQuery(params);
  const initialPage = await listOwnedReviewPage(user.id, query);

  return <ReviewShell initialPage={initialPage} initialQuery={query} />;
}
