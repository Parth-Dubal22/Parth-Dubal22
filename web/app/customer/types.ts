/** Serializable props passed from the customer server page to the client shell.
 *  NOTE: no risk fields exist here on purpose — customers see positive/neutral
 *  info only (verified badge or neutral pill); risk detail never reaches this app. */

export type DirectoryBuilder = {
  id: number;
  name: string;
  slug: string;
  /** formatted, e.g. "51 824 753 190" */
  abn: string;
  /** e.g. "DB-U 41233 · current" */
  licence: string;
  location: string;
  artKind: string;
  tags: string[];
  verified: boolean;
  rating: number | null;
  reviewCount: number;
};

export type QuoteRequestItem = {
  id: number;
  companyName: string;
  verified: boolean;
  status: "sent" | "replied" | "closed";
  /** ISO string */
  createdAt: string;
};

export type CustomerMe = {
  name: string;
  /** sidebar sub-line, e.g. "Officer VIC · Townhouse build" */
  subline: string;
};
