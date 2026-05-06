import { notFound } from "next/navigation";
import { routes } from "@/config/routes";
import { ReviewActionBar } from "@/components/review/review-action-bar";
import { ReviewContentPreview } from "@/components/review/review-content-preview";
import { ReviewMetadataPanel } from "@/components/review/review-metadata-panel";
import { ReviewStatusBadge } from "@/components/review/review-status-badge";
import { getOwnedReviewDetail, normalizeContentIdParam } from "@/lib/review";
import { requireUser } from "@/lib/supabase/auth";

interface PageProps {
  params: Promise<{ contentId: string }>;
}

export default async function ReviewDetailPage({ params }: PageProps) {
  const { contentId: rawContentId } = await params;
  const contentId = normalizeContentIdParam(rawContentId);
  const user = await requireUser(routes.reviewItem(contentId));
  const detail = await getOwnedReviewDetail(user.id, contentId);

  if (!detail) {
    notFound();
  }

  return (
    <section className="review-detail-shell" aria-label="AI content review detail">
      <header className="review-detail-header">
        <h1>{detail.item.title}</h1>
        <ReviewStatusBadge state={detail.reviewState} />
      </header>

      <ReviewActionBar initialDetail={detail} />

      <div className="review-detail-grid">
        <ReviewContentPreview detail={detail} />
        <ReviewMetadataPanel detail={detail} />
      </div>
    </section>
  );
}
