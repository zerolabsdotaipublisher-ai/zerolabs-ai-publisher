import { redirect } from "next/navigation";
import { routes } from "@/config/routes";
import { getServerUser } from "./server";

export async function requireUser(redirectPath?: string) {
  const user = await getServerUser();

  if (!user) {
    const destination = redirectPath ? `${routes.login}?next=${encodeURIComponent(redirectPath)}` : routes.login;
    redirect(destination);
  }

  return user;
}
