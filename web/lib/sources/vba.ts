/**
 * VBA (Victorian Building Authority) practitioner register connector.
 *
 * TODO(live): the VBA "Find a practitioner" register
 * (https://www.vba.vic.gov.au/tools/find-practitioner) publishes licence
 * status for building practitioners, but its terms of use restrict automated
 * scraping and bulk re-use. The compliant path is a data-sharing arrangement
 * with the VBA or linking users out to the register entry. Until then this
 * connector runs in FIXTURE mode (deterministic seeded records) and every
 * licence fact we show links out to the register with "last checked"
 * freshness. Victoria first — other state registers (QBCC, NSW Fair Trading)
 * follow the same interface later.
 */
import type { LicenceRecord } from "./types";

export const VBA_SOURCE_NAME = "VBA";
export const VBA_SOURCE_URL = "https://www.vba.vic.gov.au/tools/find-practitioner";

/* FIXTURE licence records keyed by ABN (mirrors scripts/seed.ts). */
const FIXTURE_LICENCES: Record<string, Omit<LicenceRecord, "fetchedAt">> = {
  "51824753190": { // Harbourline Constructions
    licenceNumber: "DB-U 41233", licenceStatus: "current",
    sourceName: VBA_SOURCE_NAME, sourceUrl: VBA_SOURCE_URL, fixture: true,
  },
  "72610442887": { // Bassline Building Group
    licenceNumber: "DB-U 55871", licenceStatus: "current",
    sourceName: VBA_SOURCE_NAME, sourceUrl: VBA_SOURCE_URL, fixture: true,
  },
  "38559201664": { // Redgum Homes (Aus)
    licenceNumber: "DB-U 60218", licenceStatus: "current",
    sourceName: VBA_SOURCE_NAME, sourceUrl: VBA_SOURCE_URL, fixture: true,
  },
  "19407226315": { // Southpoint Projects
    licenceNumber: "DB-U 71442", licenceStatus: "current",
    sourceName: VBA_SOURCE_NAME, sourceUrl: VBA_SOURCE_URL, fixture: true,
  },
};

/**
 * Look up a company's builder licence on the VBA practitioner register.
 * Returns null when no licence is on record for the ABN.
 * FIXTURE mode only for now (see terms note above).
 */
export async function lookupLicence(
  name: string,
  abn: string
): Promise<LicenceRecord | null> {
  const digits = String(abn ?? "").replace(/\D/g, "");
  // TODO(live): when a VBA data arrangement exists, search the register by
  // registered name + licence class here and return the published status
  // verbatim (never our own wording of it).
  void name;
  const rec = FIXTURE_LICENCES[digits];
  return rec ? { ...rec, fetchedAt: new Date() } : null;
}
