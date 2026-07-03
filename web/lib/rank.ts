/**
 * SPEC_V2 R5 — the "4 R's" ordering for pros in a category (SPEC_V2 §R5,
 * SPEC_V2_CATEGORIES §3). Pure + client-safe: /find pages rank server-side and
 * the customer app re-ranks client-side with the SAME function.
 *
 * Transparent scoring (documented so the ordering is explainable, never a
 * black box — ACL discipline):
 *   RELEVANCE      how the pro matched the category —
 *                    primary category match  (+100)
 *                    secondary category match (+70)
 *                    synonym / tag match      (+40)
 *   RECENCY        freshness of our public-record check (lastCheckedAt):
 *                    ≤7d +30 · ≤30d +20 · ≤90d +10 · older/none +0
 *   ROBUSTNESS     profile depth — verified-review volume + verification tier:
 *                    min(reviewCount, 25) (cap so volume can't drown the rest)
 *                    + tier: track_record +25 · buildsafe_verified +18 ·
 *                      id_verified +10 · none +0
 *   RESPONSIVENESS placeholder until messaging lands (SPEC R3): verified-first
 *                    (+15) as the stand-in signal. Swap for real reply-time
 *                    stats when threads exist — keep the weight, change the input.
 *
 * NOTE (legal): this is a marketplace ORDERING of positive/neutral profile
 * facts only. Risk level is never an input — ranking must not leak subscriber
 * risk detail onto public surfaces.
 */

export type CategoryMatch = "primary" | "secondary" | "synonym" | "none";

export interface FourRInput {
  match: CategoryMatch;
  /** ISO string or Date of the last public-record check (null = never). */
  lastCheckedAt: string | Date | null;
  reviewCount: number;
  /** verification_tier enum value ("none" | "id_verified" | …). */
  tier: string;
  verified: boolean;
}

const MATCH_POINTS: Record<CategoryMatch, number> = {
  primary: 100,
  secondary: 70,
  synonym: 40,
  none: 0,
};

const TIER_POINTS: Record<string, number> = {
  track_record: 25,
  buildsafe_verified: 18,
  id_verified: 10,
  none: 0,
};

const DAY_MS = 86_400_000;

export function fourRScore(p: FourRInput, now: Date = new Date()): number {
  // Relevance
  let score = MATCH_POINTS[p.match] ?? 0;
  // Recency (of our check — data freshness, shown on the card too)
  if (p.lastCheckedAt) {
    const checked = typeof p.lastCheckedAt === "string" ? new Date(p.lastCheckedAt) : p.lastCheckedAt;
    const days = (now.getTime() - checked.getTime()) / DAY_MS;
    if (days <= 7) score += 30;
    else if (days <= 30) score += 20;
    else if (days <= 90) score += 10;
  }
  // Robustness
  score += Math.min(Math.max(p.reviewCount, 0), 25);
  score += TIER_POINTS[p.tier] ?? 0;
  // Responsiveness (placeholder: verified-first until R3 messaging metrics)
  if (p.verified) score += 15;
  return score;
}

/** Sort helper — descending score, stable on name for deterministic output. */
export function byFourRs<T extends FourRInput & { name: string }>(list: T[]): T[] {
  const now = new Date();
  return [...list].sort(
    (a, b) => fourRScore(b, now) - fourRScore(a, now) || a.name.localeCompare(b.name),
  );
}
