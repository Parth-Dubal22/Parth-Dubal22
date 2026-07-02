import { auth, type Role } from "@/lib/auth";
import { redirect } from "next/navigation";

/** Current user or null. */
export async function currentUser() {
  const session = await auth();
  if (!session?.user?.id) return null;
  return { id: Number(session.user.id), role: session.user.role, name: session.user.name ?? "", email: session.user.email ?? "" };
}

/** Require a signed-in user (optionally of specific roles); redirects to /login otherwise. */
export async function requireUser(...roles: Role[]) {
  const user = await currentUser();
  if (!user) redirect("/login");
  if (roles.length && !roles.includes(user.role) && user.role !== "admin") redirect("/");
  return user;
}

/** API-route variant: returns null instead of redirecting. */
export async function apiUser(...roles: Role[]) {
  const user = await currentUser();
  if (!user) return null;
  if (roles.length && !roles.includes(user.role) && user.role !== "admin") return null;
  return user;
}
