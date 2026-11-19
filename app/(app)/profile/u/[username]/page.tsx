import { notFound } from "next/navigation";
import { getPublicProfileByUsername } from "@/lib/supabase/profile";
import { PublicProfilePage } from "../public-profile-page";

type PublicProfilePageProps = {
  params: Promise<{ username: string }>;
};

/**
 * Visitor profile route. The lookup explicitly selects public presentation
 * fields only; account email, metadata, and security settings stay server-only.
 */
export default async function UsernamePublicProfilePage({ params }: PublicProfilePageProps) {
  const { username } = await params;
  const profile = await getPublicProfileByUsername(username);
  if (!profile?.id) notFound();

  return <PublicProfilePage profile={profile} />;
}
