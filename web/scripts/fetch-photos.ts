/**
 * SPEC_V2 R1 — licensed-photo fetch pipeline.
 *
 *   npm run photos:fetch            (from web/)
 *   npx tsx scripts/fetch-photos.ts [--force] [--only=slot,slot] [--provider=unsplash|pexels]
 *
 * For every slot in lib/photos.ts PHOTO_SLOTS this script:
 *   1. searches Unsplash or Pexels for the slot's theme query
 *      (landscape orientation, min source width 1600px),
 *   2. downloads the top suitably-licensed result (de-duplicated across slots),
 *   3. converts to .webp renditions at 640 / 1280 / 1920px via sharp,
 *   4. writes public/photos/<slot>-<width>.webp and merges an attribution entry
 *      into public/photos/manifest.json (photographer, profile URL, license, alt).
 *
 * Keys (set ONE — or both, extra provider becomes a per-slot fallback):
 *   UNSPLASH_ACCESS_KEY  — https://unsplash.com/developers
 *   PEXELS_API_KEY       — https://www.pexels.com/api/
 * Read from the environment, web/.env and web/.env.local (first hit wins).
 * With no key at all the script exits 0 with instructions and writes nothing,
 * so it is always safe to run (e.g. in CI or a sandbox with no egress).
 *
 * RATE LIMITS (documented so a full run is plannable):
 *   Unsplash demo apps: 50 requests/hour (production: 5,000/h). Each slot costs
 *     2 counted calls (search + the guideline-required download-location ping) —
 *     a full ~28-slot run is ~56 calls, so a DEMO key may 403 near the end.
 *     The script is idempotent: rerun an hour later and it only fetches the
 *     slots that are still missing. CDN image downloads are not counted.
 *   Pexels: 200 requests/hour, 20,000/month — a full run (28 searches) fits
 *     easily in one pass. Image CDN downloads are not counted.
 * The script also sleeps 300ms between slots to stay polite.
 *
 * LICENSING: only the Unsplash License and the Pexels License are used — both
 * permit free commercial use; attribution is appreciated and we store it for
 * display. NEVER source images from Google Images results (unknown copyright).
 *
 * Idempotent: a slot is skipped when the manifest entry AND all its .webp files
 * already exist. Use --force to refetch. Failures are per-slot and non-fatal.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";
import {
  ALL_PHOTO_SLOT_IDS,
  PHOTO_SLOTS,
  PHOTO_WIDTHS,
  type ManifestEntry,
  type PhotoManifest,
  type PhotoSlotId,
} from "../lib/photos";

/* ------------------------------------------------------------------ */
/* Paths & constants                                                   */
/* ------------------------------------------------------------------ */

const WEB_DIR = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OUT_DIR = path.join(WEB_DIR, "public", "photos");
const MANIFEST_FILE = path.join(OUT_DIR, "manifest.json");

const MIN_SOURCE_WIDTH = 1600; // R1: only accept sources ≥1600px wide
const WEBP_QUALITY = 78;
const FETCH_TIMEOUT_MS = 45_000;
const SLOT_PAUSE_MS = 300;

const UTM = "utm_source=buildsafe&utm_medium=referral"; // Unsplash attribution guideline

type Provider = "unsplash" | "pexels";

interface Candidate {
  provider: Provider;
  photoId: string;
  width: number;
  height: number;
  /** URL of the file to download (already sized-capped where the CDN allows). */
  downloadUrl: string;
  photographer: string;
  profileUrl: string;
  photoUrl: string;
  license: string;
  /** Unsplash guideline: ping links.download_location when actually using a photo. */
  registerDownloadUrl?: string;
}

/* ------------------------------------------------------------------ */
/* Small utilities                                                     */
/* ------------------------------------------------------------------ */

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));

/** Minimal .env parser (KEY=VALUE, # comments, optional quotes). No new deps. */
function loadEnvFile(file: string) {
  let text: string;
  try {
    text = fs.readFileSync(file, "utf8");
  } catch {
    return;
  }
  for (const raw of text.split("\n")) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let val = line.slice(eq + 1).trim();
    const hash = val.indexOf(" #");
    if (hash >= 0 && !val.startsWith('"') && !val.startsWith("'")) val = val.slice(0, hash).trim();
    if ((val.startsWith('"') && val.endsWith('"')) || (val.startsWith("'") && val.endsWith("'"))) {
      val = val.slice(1, -1);
    }
    if (key && !(key in process.env)) process.env[key] = val;
  }
}

async function fetchWithTimeout(url: string, init: RequestInit = {}): Promise<Response> {
  return fetch(url, { ...init, signal: AbortSignal.timeout(FETCH_TIMEOUT_MS) });
}

/** GET returning parsed JSON, with one retry on network error / 5xx. */
async function getJson<T>(url: string, headers: Record<string, string>): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      const res = await fetchWithTimeout(url, { headers });
      if (res.status === 403 || res.status === 429) {
        throw new Error(`rate-limited or unauthorized (HTTP ${res.status}) — see rate-limit notes in the header comment`);
      }
      if (!res.ok) {
        if (res.status >= 500 && attempt === 1) throw Object.assign(new Error(`HTTP ${res.status}`), { retryable: true });
        throw new Error(`HTTP ${res.status} ${res.statusText}`);
      }
      return (await res.json()) as T;
    } catch (err) {
      const retryable =
        (err as { retryable?: boolean }).retryable ||
        (err instanceof TypeError /* network */ && attempt === 1) ||
        ((err as Error).name === "TimeoutError" && attempt === 1);
      if (retryable && attempt === 1) {
        await sleep(2000);
        continue;
      }
      throw err;
    }
  }
}

async function downloadBuffer(url: string): Promise<Buffer> {
  const res = await fetchWithTimeout(url);
  if (!res.ok) throw new Error(`download failed: HTTP ${res.status}`);
  return Buffer.from(await res.arrayBuffer());
}

/* ------------------------------------------------------------------ */
/* Providers                                                           */
/* ------------------------------------------------------------------ */

/** Unsplash search — https://unsplash.com/documentation#search-photos */
async function searchUnsplash(query: string, key: string, usedIds: Set<string>): Promise<Candidate | null> {
  type R = {
    results: Array<{
      id: string;
      width: number;
      height: number;
      urls: { raw: string };
      links: { html: string; download_location: string };
      user: { name: string; links: { html: string } };
    }>;
  };
  const url =
    "https://api.unsplash.com/search/photos" +
    `?query=${encodeURIComponent(query)}&orientation=landscape&content_filter=high&per_page=10`;
  const data = await getJson<R>(url, { Authorization: `Client-ID ${key}`, "Accept-Version": "v1" });
  const hit = (data.results ?? []).find(
    (p) => p.width >= MIN_SOURCE_WIDTH && p.width > p.height && !usedIds.has(`unsplash:${p.id}`),
  );
  if (!hit) return null;
  // Cap the download to ~2400px via Imgix params — full raw files can be 10MB+.
  const dl = new URL(hit.urls.raw);
  dl.searchParams.set("w", "2400");
  dl.searchParams.set("fit", "max");
  dl.searchParams.set("q", "85");
  dl.searchParams.set("fm", "jpg");
  return {
    provider: "unsplash",
    photoId: hit.id,
    width: hit.width,
    height: hit.height,
    downloadUrl: dl.toString(),
    photographer: hit.user.name,
    profileUrl: `${hit.user.links.html}?${UTM}`,
    photoUrl: `${hit.links.html}?${UTM}`,
    license: "Unsplash License — https://unsplash.com/license",
    registerDownloadUrl: hit.links.download_location,
  };
}

/** Pexels search — https://www.pexels.com/api/documentation/#photos-search */
async function searchPexels(query: string, key: string, usedIds: Set<string>): Promise<Candidate | null> {
  type R = {
    photos: Array<{
      id: number;
      width: number;
      height: number;
      url: string;
      photographer: string;
      photographer_url: string;
      src: { original: string };
      alt: string;
    }>;
  };
  const url =
    "https://api.pexels.com/v1/search" +
    `?query=${encodeURIComponent(query)}&orientation=landscape&size=large&per_page=10`;
  const data = await getJson<R>(url, { Authorization: key });
  const hit = (data.photos ?? []).find(
    (p) => p.width >= MIN_SOURCE_WIDTH && p.width > p.height && !usedIds.has(`pexels:${p.id}`),
  );
  if (!hit) return null;
  return {
    provider: "pexels",
    photoId: String(hit.id),
    width: hit.width,
    height: hit.height,
    // Pexels' CDN honours resize params — cap at 2400px wide.
    downloadUrl: `${hit.src.original}?auto=compress&cs=tinysrgb&w=2400`,
    photographer: hit.photographer,
    profileUrl: hit.photographer_url,
    photoUrl: hit.url,
    license: "Pexels License — https://www.pexels.com/license/",
  };
}

/* ------------------------------------------------------------------ */
/* Manifest helpers                                                    */
/* ------------------------------------------------------------------ */

function readManifestFile(): PhotoManifest {
  try {
    const parsed = JSON.parse(fs.readFileSync(MANIFEST_FILE, "utf8")) as PhotoManifest;
    if (parsed && typeof parsed.photos === "object") return parsed;
  } catch {
    /* missing/corrupt → start fresh */
  }
  return { generatedAt: new Date().toISOString(), photos: {} };
}

function writeManifestFile(manifest: PhotoManifest) {
  manifest.generatedAt = new Date().toISOString();
  manifest.note = "Generated by scripts/fetch-photos.ts — do not edit by hand.";
  fs.writeFileSync(MANIFEST_FILE, JSON.stringify(manifest, null, 2) + "\n");
}

/** True when the slot's manifest entry and every rendition file are present. */
function slotComplete(manifest: PhotoManifest, slot: PhotoSlotId): boolean {
  const entry = manifest.photos[slot];
  if (!entry) return false;
  const files = Object.values(entry.files ?? {});
  return files.length > 0 && files.every((rel) => fs.existsSync(path.join(WEB_DIR, "public", rel.replace(/^\//, ""))));
}

/* ------------------------------------------------------------------ */
/* Main                                                                */
/* ------------------------------------------------------------------ */

async function main() {
  const args = process.argv.slice(2);
  const force = args.includes("--force");
  const onlyArg = args.find((a) => a.startsWith("--only="));
  const providerArg = args.find((a) => a.startsWith("--provider="))?.split("=")[1] as Provider | undefined;
  if (args.includes("--help") || args.includes("-h")) {
    console.log("Usage: npx tsx scripts/fetch-photos.ts [--force] [--only=slot,slot] [--provider=unsplash|pexels]");
    return;
  }

  // tsx does not auto-load .env — pick up keys the same way the app would.
  loadEnvFile(path.join(WEB_DIR, ".env"));
  loadEnvFile(path.join(WEB_DIR, ".env.local"));

  const unsplashKey = process.env.UNSPLASH_ACCESS_KEY?.trim() || null;
  const pexelsKey = process.env.PEXELS_API_KEY?.trim() || null;

  if (!unsplashKey && !pexelsKey) {
    console.log(
      [
        "fetch-photos: no key set — add UNSPLASH_ACCESS_KEY or PEXELS_API_KEY to .env, see .env.example",
        "",
        "  UNSPLASH_ACCESS_KEY  → free signup: https://unsplash.com/developers",
        "  PEXELS_API_KEY       → free signup: https://www.pexels.com/api/",
        "",
        "Nothing was written. Until photos are fetched the app renders its built-in",
        "SVG art fallbacks (components/Art.tsx) for every photo slot — by design.",
      ].join("\n"),
    );
    return; // exit 0 — absence of keys is a supported state, not an error
  }

  // Provider order: honour --provider, else prefer whichever key is set
  // (Unsplash first when both). The other provider is a per-slot fallback.
  const order: Provider[] = [];
  const push = (p: Provider) => {
    const key = p === "unsplash" ? unsplashKey : pexelsKey;
    if (key && !order.includes(p)) order.push(p);
  };
  if (providerArg) {
    if (providerArg !== "unsplash" && providerArg !== "pexels") {
      console.error(`fetch-photos: unknown --provider "${providerArg}" (use unsplash or pexels)`);
      process.exitCode = 1;
      return;
    }
    push(providerArg);
    if (order.length === 0) {
      console.error(`fetch-photos: --provider=${providerArg} but its API key is not set.`);
      process.exitCode = 1;
      return;
    }
  }
  push("unsplash");
  push("pexels");

  let slots: PhotoSlotId[] = ALL_PHOTO_SLOT_IDS;
  if (onlyArg) {
    const wanted = onlyArg.slice("--only=".length).split(",").map((s) => s.trim()).filter(Boolean);
    const unknown = wanted.filter((w) => !(w in PHOTO_SLOTS));
    if (unknown.length) {
      console.error(`fetch-photos: unknown slot id(s): ${unknown.join(", ")}\nKnown slots:\n  ${ALL_PHOTO_SLOT_IDS.join("\n  ")}`);
      process.exitCode = 1;
      return;
    }
    slots = wanted as PhotoSlotId[];
  }

  fs.mkdirSync(OUT_DIR, { recursive: true });
  const manifest = readManifestFile();

  // De-dup across slots (including photos already in the manifest from earlier runs).
  const usedIds = new Set<string>(
    Object.values(manifest.photos).map((e) => `${e.provider}:${e.photoId}`),
  );

  console.log(`fetch-photos: ${slots.length} slot(s) · providers: ${order.join(" → ")} · out: ${path.relative(process.cwd(), OUT_DIR) || "."}`);

  const done: string[] = [];
  const skipped: string[] = [];
  const failed: Array<[string, string]> = [];

  for (const slot of slots) {
    const def = PHOTO_SLOTS[slot];
    if (!force && slotComplete(manifest, slot)) {
      skipped.push(slot);
      console.log(`  = ${slot} — already fetched (use --force to refetch)`);
      continue;
    }
    try {
      // 1. search (primary provider, then fallback provider)
      let candidate: Candidate | null = null;
      let lastErr: unknown = null;
      for (const provider of order) {
        try {
          candidate =
            provider === "unsplash"
              ? await searchUnsplash(def.query, unsplashKey!, usedIds)
              : await searchPexels(def.query, pexelsKey!, usedIds);
          if (candidate) break;
        } catch (err) {
          lastErr = err;
        }
      }
      if (!candidate) {
        throw lastErr ?? new Error(`no landscape result ≥${MIN_SOURCE_WIDTH}px for query "${def.query}"`);
      }

      // 2. Unsplash guideline: register the download before using the photo.
      if (candidate.registerDownloadUrl && unsplashKey) {
        try {
          await getJson<{ url: string }>(candidate.registerDownloadUrl, {
            Authorization: `Client-ID ${unsplashKey}`,
            "Accept-Version": "v1",
          });
        } catch {
          /* non-fatal — the photo download below still proceeds */
        }
      }

      // 3. download source bytes
      const source = await downloadBuffer(candidate.downloadUrl);
      const meta = await sharp(source).rotate().metadata(); // rotate() = respect EXIF
      if (!meta.width || meta.width < Math.min(MIN_SOURCE_WIDTH, 1280)) {
        throw new Error(`downloaded file too small (${meta.width ?? "?"}px wide)`);
      }

      // 4. webp renditions (never upscale; skip widths above the source width)
      const files: Record<string, string> = {};
      let largest = { width: 0, height: 0 };
      for (const w of PHOTO_WIDTHS) {
        const out = path.join(OUT_DIR, `${slot}-${w}.webp`);
        const info = await sharp(source)
          .rotate()
          .resize({ width: w, withoutEnlargement: true })
          .webp({ quality: WEBP_QUALITY })
          .toFile(out);
        files[String(w)] = `/photos/${slot}-${w}.webp`;
        if (info.width > largest.width) largest = { width: info.width, height: info.height };
      }

      // 5. manifest entry (attribution kept for optional display)
      const entry: ManifestEntry = {
        slot,
        provider: candidate.provider,
        photoId: candidate.photoId,
        photographer: candidate.photographer,
        profileUrl: candidate.profileUrl,
        photoUrl: candidate.photoUrl,
        license: candidate.license,
        alt: def.alt,
        width: largest.width,
        height: largest.height,
        files,
        fetchedAt: new Date().toISOString(),
      };
      manifest.photos[slot] = entry;
      usedIds.add(`${candidate.provider}:${candidate.photoId}`);
      writeManifestFile(manifest); // write after every slot — crash/rate-limit safe
      done.push(slot);
      console.log(`  + ${slot} — ${candidate.provider} ${candidate.photoId} by ${candidate.photographer} (${largest.width}×${largest.height})`);
    } catch (err) {
      const msg = err instanceof Error ? err.message : String(err);
      failed.push([slot, msg]);
      console.warn(`  ! ${slot} — FAILED: ${msg}`);
    }
    await sleep(SLOT_PAUSE_MS);
  }

  /* summary */
  console.log("\nfetch-photos summary");
  console.log(`  fetched : ${done.length}`);
  console.log(`  skipped : ${skipped.length} (already present)`);
  console.log(`  failed  : ${failed.length}`);
  for (const [slot, msg] of failed) console.log(`    - ${slot}: ${msg}`);
  if (failed.length) {
    console.log("\nFailures are per-slot: the app keeps its SVG fallback for those slots.");
    console.log("Rerun later (idempotent) — e.g. an Unsplash demo key resets its 50 req/h window hourly.");
  }
  // Only signal failure when we attempted work and NOTHING succeeded or was
  // already present (typically an invalid key) — partial success is success.
  if (done.length === 0 && skipped.length === 0 && failed.length > 0) process.exitCode = 1;
}

main().catch((err) => {
  console.error("fetch-photos: fatal:", err);
  process.exitCode = 1;
});
