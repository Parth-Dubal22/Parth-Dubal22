/**
 * ASIC published notices connector.
 *
 * TODO(live): live scraping of https://publishednotices.asic.gov.au/ is NOT
 * attempted by default. ASIC's data access terms restrict automated bulk
 * re-use of the notices site; the compliant path is ASIC's registry data
 * products / licensed brokers, or linking users out to the notice itself.
 * See https://asic.gov.au/online-services/search-asic-s-registers/ and
 * https://publishednotices.asic.gov.au/ (terms of use). Until a licensed feed
 * is wired in, every signal we surface links OUT to the public source, and
 * this connector runs in FIXTURE mode (deterministic seeded records).
 *
 * Signals are FACTS with named sources and dates — never verdicts or
 * predictions. All connector output lands as status "pending" and goes
 * through the human review queue before anyone is alerted.
 */
import type { SourceSignal } from "./types";

export const ASIC_SOURCE_NAME = "ASIC register";
export const ASIC_SOURCE_URL = "https://connectonline.asic.gov.au/";
export const ASIC_NOTICES_URL = "https://publishednotices.asic.gov.au/";

/* FIXTURE notices keyed by ABN (mirrors the seeded Harbourline/Bassline signals). */
const FIXTURE_NOTICES: Record<string, SourceSignal[]> = {
  // Harbourline Constructions
  "51824753190": [
    {
      level: "watch",
      title: "Two director resignations within 60 days",
      detail:
        "Two director cessation notifications recorded on the ASIC register within a 60-day window. " +
        "Fact from the public register — read the source document for details.",
      sourceName: ASIC_SOURCE_NAME,
      sourceUrl: ASIC_SOURCE_URL,
      sourceRef: "asic:51824753190:2026-05-19:director-cessations",
      occurredOn: new Date("2026-05-19"),
    },
  ],
  // Bassline Building Group
  "72610442887": [
    {
      level: "watch",
      title: "Director change recorded",
      detail:
        "A change of director notification recorded on the ASIC register. " +
        "Fact from the public register — read the source document for details.",
      sourceName: ASIC_SOURCE_NAME,
      sourceUrl: ASIC_SOURCE_URL,
      sourceRef: "asic:72610442887:2026-05-19:director-change",
      occurredOn: new Date("2026-05-19"),
    },
  ],
  // Redgum Homes (Aus) and Southpoint Projects — no adverse notices on record.
  "38559201664": [],
  "19407226315": [],
};

/**
 * Fetch published-notice / register signals for a company.
 * FIXTURE mode only for now (see terms note above) — returns deterministic
 * seeded records; empty array for companies with nothing on record.
 */
export async function fetchNoticesForCompany(
  name: string,
  abn: string
): Promise<SourceSignal[]> {
  const digits = String(abn ?? "").replace(/\D/g, "");
  // TODO(live): when a licensed ASIC data feed is available, query by
  // ACN/ABN + entity name here and map notices to SourceSignal facts,
  // linking each signal out to the notice at publishednotices.asic.gov.au.
  void name;
  return FIXTURE_NOTICES[digits] ?? [];
}
