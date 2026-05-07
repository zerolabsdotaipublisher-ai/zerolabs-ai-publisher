import "server-only";

import { getOwnedReviewDetail } from "@/lib/review";

export async function canAccessOwnedRevisionContent(userId: string, contentId: string): Promise<boolean> {
  const detail = await getOwnedReviewDetail(userId, contentId);
  return Boolean(detail);
}
