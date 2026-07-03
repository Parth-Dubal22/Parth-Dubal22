import type { Metadata } from "next";
import LoginForm from "./LoginForm";
import SitePhoto from "@/components/SitePhoto";

export const metadata: Metadata = {
  title: "Sign in — BuildSafe",
  description: "Sign in to your BuildSafe account.",
};

export default function LoginPage() {
  // SitePhoto is server-only (reads the photo manifest) — render it here and
  // hand the node to the client form. SVG art falls back until photos are fetched.
  return <LoginForm side={<SitePhoto slot="login-side" className="photo" />} />;
}
