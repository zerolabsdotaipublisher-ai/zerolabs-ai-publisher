import { type NextRequest, NextResponse } from "next/server";
import { getInstagramPublishingAccount } from "@/lib/social/accounts";
import {
  getInstagramPublishJob,
  listInstagramPublishJobs,
} from "@/lib/social/instagram";
import { getServerUser } from "@/lib/supabase/server";

export async function GET(request: NextRequest): Promise<NextResponse> {
  const user = await getServerUser();
  if (!user) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const jobId = request.nextUrl.searchParams.get("jobId");
  if (jobId) {
    const job = await getInstagramPublishJob(jobId, user.id);
    if (!job) {
      return NextResponse.json({ ok: false, error: "Publish job not found." }, { status: 404 });
    }
    return NextResponse.json({ ok: true, job });
  }

  const [connection, jobs] = await Promise.all([
    getInstagramPublishingAccount(user.id),
    listInstagramPublishJobs(user.id, 25),
  ]);
  return NextResponse.json({
    ok: true,
    connection,
    jobs,
  });
}
