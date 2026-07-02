import type { Metadata } from "next";
import OnboardingWizard from "./OnboardingWizard";

export const metadata: Metadata = {
  title: "Create your profile — BuildSafe",
  description:
    "Pick your side — customer, tradie or builder — and create your BuildSafe profile.",
};

const ROLES = ["customer", "tradie", "builder"] as const;
type WizardRole = (typeof ROLES)[number];

export default async function OnboardingPage({
  searchParams,
}: {
  searchParams: Promise<{ role?: string }>;
}) {
  // CTAs elsewhere link /onboarding?role=tradie|customer|builder — pre-select it.
  const sp = await searchParams;
  const initialRole = ROLES.includes(sp.role as WizardRole)
    ? (sp.role as WizardRole)
    : undefined;
  return <OnboardingWizard initialRole={initialRole} />;
}
