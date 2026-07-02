/**
 * BuildSafe data pipeline — shared connector types.
 *
 * Every connector returns FACTS with a named public source. Signals are never
 * verdicts or predictions — titles are factual statements ("Creditor's claim —
 * Supreme Court VIC"), and each carries the source name, a link where the
 * source's terms allow, a stable reference for dedupe, and the date it
 * occurred. Copy style everywhere: "monitors public records and flags signals".
 */

export type SignalLevel = "ok" | "watch" | "risk";

/** A company record as returned by a registry connector (ABR). ABN digits only. */
export interface CompanyRecord {
  /** 11-digit ABN, digits only — the anchor of every company record. */
  abn: string;
  name: string;
  entityType?: string;
  gstRegistered?: boolean;
  /** e.g. "Active" / "Cancelled" as published by the ABR. */
  abnStatus?: string;
  /** Human-readable location, e.g. "VIC 3977". */
  location?: string;
  /** State code, e.g. "VIC". */
  state?: string;
  /** Named public source this record came from, e.g. "ABN Lookup (ABR)". */
  sourceName: string;
  sourceUrl?: string;
  /** Data freshness — when this record was fetched from the source. */
  fetchedAt: Date;
  /** True when produced by deterministic FIXTURE mode (no live call made). */
  fixture?: boolean;
}

/** A single factual signal from a public source, pre-review (pending). */
export interface SourceSignal {
  level: SignalLevel;
  /** FACT statement, never a verdict or prediction. */
  title: string;
  detail?: string;
  /** Named public source — every signal cites its public source. */
  sourceName: string;
  sourceUrl?: string;
  /** Stable reference at the source; used with title for dedupe. */
  sourceRef?: string;
  /** Date the underlying fact occurred (as published). */
  occurredOn: Date;
}

/** Licence status as published by a state register (e.g. VBA). */
export interface LicenceRecord {
  licenceNumber: string;
  /** Status exactly as the register words it, e.g. "current". */
  licenceStatus: string;
  /** e.g. "VBA" — stored in companies.licenceSource. */
  sourceName: string;
  sourceUrl?: string;
  fetchedAt: Date;
  fixture?: boolean;
}
