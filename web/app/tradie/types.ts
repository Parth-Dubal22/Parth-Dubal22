/** Serialized (client-safe) shapes for the Tradie app.
 *  Risk fields are null / empty when the viewer can't see risk detail —
 *  the server strips them before they reach the browser. */

export type RiskLevel = "ok" | "watch" | "risk";

export type TradieWatchSignal = {
  title: string; // FACT statement, never a verdict
  level: RiskLevel;
  sourceName: string; // every signal cites its public source
  sourceUrl: string | null;
  date: string; // ISO
};

export type TradieWatchItem = {
  companyId: number;
  name: string;
  slug: string;
  abn: string; // formatted "51 824 753 190"
  licence: string; // "DB-U 41233 · current"
  risk: RiskLevel | null; // null = gated
  lastCheckedAt: string | null; // ISO — data freshness
  signals: TradieWatchSignal[]; // [] = gated
  exposureCents: number | null; // null = gated
};

export type TradieAlert = {
  id: number;
  level: RiskLevel;
  companyName: string;
  title: string;
  detail: string | null;
  sourceName: string;
  sourceUrl: string | null;
  occurredOn: string; // ISO
  createdAt: string; // ISO
  read: boolean;
};

export type TradieJob = {
  id: number;
  title: string;
  type: "subcontract" | "day_hire";
  rate: string;
  location: string;
  startText: string;
  duration: string;
  requirement: string | null;
  builderName: string;
  builderRisk: RiskLevel | null; // null = gated
  applicants: number;
  applied: boolean;
  /** R5: taxonomy top-level slug (from categorySlug or the legacy trade). */
  categorySlug: string | null;
};

export type TradieReview = {
  id: number;
  author: string;
  role: string; // "Builder" | "Homeowner" | "Subcontractor"
  rating: number;
  text: string;
  reply: string | null;
};

export type PortfolioItem = { art: string; caption: string };

export type TradieProfileData = {
  name: string;
  trades: string[];
  /** R5: taxonomy top-level slugs (index 0 = primary) — source of truth. */
  categorySlugs: string[];
  suburb: string;
  state: string;
  abn: string; // formatted
  licenceNumber: string;
  licenceVerified: boolean;
  insuranceProvider: string;
  insuranceExpiry: string; // "yyyy-mm-dd" or ""
  insuranceVerified: boolean;
  availableNow: boolean;
  reliabilityScore: number | null;
  jobsCompleted: number;
  portfolio: PortfolioItem[];
  ratingAvg: number | null;
};
