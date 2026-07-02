import type { Metadata } from "next";
import LoginForm from "./LoginForm";

export const metadata: Metadata = {
  title: "Sign in — BuildSafe",
  description: "Sign in to your BuildSafe account.",
};

export default function LoginPage() {
  return <LoginForm />;
}
