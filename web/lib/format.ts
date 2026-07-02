/** Shared formatting helpers (ported 1:1 from prototype js/app.js). */

export const money = (n: number | null | undefined) =>
  "$" + Number(n || 0).toLocaleString("en-AU");

export const centsToMoney = (cents: number | null | undefined) =>
  money(Math.round((cents || 0) / 100));

export const initials = (n: string) =>
  n.split(/\s+/).slice(0, 2).map((w) => w[0] ?? "").join("").toUpperCase();

/** risk level → [label, css class] (prototype ST map) */
export const ST: Record<string, [string, string]> = {
  risk: ["ALERT", "risk"],
  watch: ["WATCH", "watch"],
  ok: ["CLEAR", "ok"],
};

/** "84220913557" → "84 220 913 557" */
export function formatAbn(abn: string | null | undefined): string {
  const d = String(abn ?? "").replace(/\D/g, "");
  if (d.length !== 11) return abn ?? "";
  return `${d.slice(0, 2)} ${d.slice(2, 5)} ${d.slice(5, 8)} ${d.slice(8, 11)}`;
}

export const cleanAbn = (abn: string) => abn.replace(/\D/g, "");

export function slugify(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

export const ratingX10ToNumber = (x10: number | null | undefined) =>
  x10 == null ? null : Math.round(x10) / 10;

export const ALL_TRADES = [
  "Tiling", "Bricklaying", "Carpentry", "Electrical", "Plumbing", "Rendering",
  "Concreting", "Plastering", "Painting", "Roofing", "Landscaping", "Labouring",
] as const;

export function timeAgo(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  const s = Math.max(1, Math.floor((Date.now() - d.getTime()) / 1000));
  if (s < 3600) return `${Math.max(1, Math.floor(s / 60))}m ago`;
  if (s < 86400) return `${Math.floor(s / 3600)}h ago`;
  if (s < 604800) return `${Math.floor(s / 86400)}d ago`;
  return `${Math.floor(s / 604800)}w ago`;
}

export function fmtDate(date: Date | string): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("en-AU", { day: "2-digit", month: "short", year: "numeric" }).toUpperCase();
}
