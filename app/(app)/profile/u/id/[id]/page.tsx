import { notFound } from "next/navigation";
import { normalizePublicProfileUserId } from "@/lib/profile-public";
import { getPublicProfileByProfileUserId } from "@/lib/supabase/profile";
import { PublicProfilePage } from "../../public-profile-page";

type PublicProfileIdPageProps = {
  params: Promise<{ id: string }>;
};

/** Stable public-profile route for accounts that do not have a usable username. */
export default async function IdPublicProfilePage({ params }: PublicProfileIdPageProps) {
  const { id } = await params;
  const profileUserId = normalizePublicProfileUserId(id);
  if (!profileUserId) notFound();

  const profile = await getPublicProfileByProfileUserId(profileUserId);
  if (!profile?.id) notFound();

  return <PublicProfilePage profile={profile} />;
}
