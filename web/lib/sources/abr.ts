/**
 * ABN Lookup (ABR) connector.
 *
 * Live mode: the Australian Business Register JSON web services —
 *   https://abr.business.gov.au/json/AbnDetails.aspx?abn=<abn>&guid=<guid>
 * Requires a registered web-services GUID in process.env.ABR_GUID
 * (free registration: https://abr.business.gov.au/Tools/WebServices).
 * ABR terms: attribute the source and show data freshness — we store the
 * source name + fetchedAt and render "last checked" wherever records appear.
 *
 * Fixture mode (no ABR_GUID set): deterministic records for the four seeded
 * demo ABNs, null for anything else. Clearly marked with `fixture: true`.
 */
import type { CompanyRecord } from "./types";

export const ABR_SOURCE_NAME = "ABN Lookup (ABR)";
export const ABR_SOURCE_URL = "https://abr.business.gov.au/";
const ABR_JSON_ENDPOINT = "https://abr.business.gov.au/json/AbnDetails.aspx";

/** Shape of the ABR AbnDetails JSON(P) payload — fields we consume. */
interface AbrAbnDetails {
  Abn?: string;
  AbnStatus?: string;
  AddressPostcode?: string;
  AddressState?: string;
  BusinessName?: string[];
  EntityName?: string;
  EntityTypeName?: string;
  Gst?: string | null;
  Message?: string;
}

/* FIXTURE records for the seeded demo ABNs (mirrors scripts/seed.ts). */
const FIXTURE_RECORDS: Record<string, Omit<CompanyRecord, "fetchedAt">> = {
  "51824753190": {
    abn: "51824753190", name: "Harbourline Constructions",
    entityType: "Australian Private Company", gstRegistered: true,
    abnStatus: "Active", location: "Melbourne SE", state: "VIC",
    sourceName: ABR_SOURCE_NAME, sourceUrl: ABR_SOURCE_URL, fixture: true,
  },
  "72610442887": {
    abn: "72610442887", name: "Bassline Building Group",
    entityType: "Australian Private Company", gstRegistered: true,
    abnStatus: "Active", location: "Werribee VIC", state: "VIC",
    sourceName: ABR_SOURCE_NAME, sourceUrl: ABR_SOURCE_URL, fixture: true,
  },
  "38559201664": {
    abn: "38559201664", name: "Redgum Homes (Aus)",
    entityType: "Australian Private Company", gstRegistered: true,
    abnStatus: "Active", location: "Officer VIC", state: "VIC",
    sourceName: ABR_SOURCE_NAME, sourceUrl: ABR_SOURCE_URL, fixture: true,
  },
  "19407226315": {
    abn: "19407226315", name: "Southpoint Projects",
    entityType: "Australian Private Company", gstRegistered: true,
    abnStatus: "Active", location: "Cranbourne VIC", state: "VIC",
    sourceName: ABR_SOURCE_NAME, sourceUrl: ABR_SOURCE_URL, fixture: true,
  },
};

/**
 * Look up a company record by ABN. Returns null when the ABN is malformed,
 * unknown, or (in live mode) the ABR reports an error for it.
 */
export async function lookupAbn(abn: string): Promise<CompanyRecord | null> {
  const digits = String(abn ?? "").replace(/\D/g, "");
  if (digits.length !== 11) return null;

  const guid = process.env.ABR_GUID;
  if (!guid) {
    // FIXTURE mode — deterministic, offline, clearly marked.
    const rec = FIXTURE_RECORDS[digits];
    return rec ? { ...rec, fetchedAt: new Date() } : null;
  }

  const url =
    `${ABR_JSON_ENDPOINT}?abn=${encodeURIComponent(digits)}` +
    `&guid=${encodeURIComponent(guid)}&callback=abrCallback`;
  const res = await fetch(url, { headers: { accept: "application/json, text/javascript" } });
  if (!res.ok) throw new Error(`ABR lookup failed: HTTP ${res.status}`);
  const text = await res.text();

  // The endpoint returns JSONP (`abrCallback({...})`) — strip the wrapper.
  const start = text.indexOf("{");
  const end = text.lastIndexOf("}");
  if (start < 0 || end < 0) throw new Error("ABR lookup: unexpected response format");
  const data = JSON.parse(text.slice(start, end + 1)) as AbrAbnDetails;

  if (data.Message) return null; // e.g. "Search text is not a valid ABN or ACN"
  const name = data.EntityName || data.BusinessName?.[0];
  if (!data.Abn || !name) return null;

  return {
    abn: data.Abn.replace(/\D/g, ""),
    name,
    entityType: data.EntityTypeName || undefined,
    gstRegistered: data.Gst != null && data.Gst !== "",
    abnStatus: data.AbnStatus || undefined,
    location: [data.AddressState, data.AddressPostcode].filter(Boolean).join(" ") || undefined,
    state: data.AddressState || undefined,
    sourceName: ABR_SOURCE_NAME,
    sourceUrl: ABR_SOURCE_URL,
    fetchedAt: new Date(),
  };
}
