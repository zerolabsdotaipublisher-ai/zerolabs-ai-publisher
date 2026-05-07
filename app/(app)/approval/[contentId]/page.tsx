import { notFound } from "next/navigation";
import { ApprovalActionBar } from "@/components/approval/approval-action-bar";
import { ApprovalCommentPanel } from "@/components/approval/approval-comment-panel";
import { ApprovalStatusBadge } from "@/components/approval/approval-status-badge";
import { routes } from "@/config/routes";
import { getOwnedApprovalDetail, normalizeApprovalContentIdParam } from "@/lib/approval";
import { requireUser } from "@/lib/supabase/auth";

interface PageProps {
  params: Promise<{ contentId: string }>;
}

export default async function ApprovalDetailPage({ params }: PageProps) {
  const { contentId: rawContentId } = await params;
  const contentId = normalizeApprovalContentIdParam(rawContentId);
  const user = await requireUser(routes.approvalItem(contentId));
  const detail = await getOwnedApprovalDetail(user.id, contentId);

  if (!detail) {
    notFound();
  }

  return (
    <section className="review-detail-shell" aria-label="AI content approval detail">
      <header className="review-detail-header">
        <h1>{detail.item.title}</h1>
        <ApprovalStatusBadge state={detail.approvalState} />
      </header>

      <ApprovalActionBar initialDetail={detail} />
      <ApprovalCommentPanel initialDetail={detail} />
    </section>
  );
}
