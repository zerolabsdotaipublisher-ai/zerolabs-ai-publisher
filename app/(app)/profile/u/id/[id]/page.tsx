import { notFound } from "next/navigation";
import { getPublicProfileById } from "@/lib/supabase/profile";
import { PublicProfilePage } from "../../public-profile-page";

type PublicProfileIdPageProps = {
  params: Promise<{ id: string }>;
};

/** Stable public-profile route for accounts that do not have a usable username. */
export default async function IdPublicProfilePage({ params }: PublicProfileIdPageProps) {
  const { id } = await params;
  const profile = await getPublicProfileById(id);
  if (!profile?.id) notFound();

  return <PublicProfilePage profile={profile} />;
}
