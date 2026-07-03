import type { Metadata } from "next";
import OnboardingWizard from "./OnboardingWizard";
import SitePhoto from "@/components/SitePhoto";

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
  // SitePhoto is server-only (reads the photo manifest) — render all three
  // role panels here; the client wizard shows the one matching the picked role.
  // SVG art falls back until the photo pipeline has run.
  return (
    <OnboardingWizard
      initialRole={initialRole}
      sideArt={{
        customer: <SitePhoto slot="onboarding-side-customer" className="photo" />,
        tradie: <SitePhoto slot="onboarding-side-tradie" className="photo" />,
        builder: <SitePhoto slot="onboarding-side-builder" className="photo" />,
      }}
    />
  );
}
