/** Data pipeline CLI — ingest one company by ABN (or existing company name).
 *  Run: cd web && npx tsx scripts/ingest.ts <abn-or-name>
 *  Pulls ABR record + VBA licence status, logs ASIC/source signals as
 *  PENDING (human review queue — approval fans out alerts). */
import { ingestAbn } from "../lib/ingest";
import { formatAbn } from "../lib/format";

async function main() {
  const input = process.argv.slice(2).join(" ").trim();
  if (!input) {
    console.error("Usage: npx tsx scripts/ingest.ts <abn-or-name>");
    console.error("  e.g. npx tsx scripts/ingest.ts 51824753190");
    process.exit(1);
  }

  const r = await ingestAbn(input);
  if (!r) {
    console.error(`No record found for "${input}".`);
    console.error(
      process.env.ABR_GUID
        ? "The ABR returned no match for that ABN."
        : "FIXTURE mode (no ABR_GUID set) — only the seeded demo ABNs resolve. Set ABR_GUID for live ABN Lookup."
    );
    process.exit(2);
  }

  console.log("Ingest summary");
  console.log("--------------");
  console.log(`Company:   ${r.name} (id ${r.companyId}, ${r.createdCompany ? "created" : "updated"})`);
  console.log(`ABN:       ${formatAbn(r.abn)}${r.abnStatus ? ` — ${r.abnStatus}` : ""}`);
  console.log(`Slug:      /b/${r.slug}`);
  console.log(`Licence:   ${r.licenceNumber ? `${r.licenceNumber} (${r.licenceStatus}, VBA)` : "none on record"}`);
  console.log(`Signals:   ${r.signalsFound} found — ${r.signalsInsertedPending} inserted as PENDING, ${r.signalsSkippedDuplicate} duplicate(s) skipped`);
  console.log(`Mode:      ${r.fixture ? "FIXTURE (no ABR_GUID set — deterministic demo data)" : "LIVE (ABR web services)"}`);
  console.log("");
  console.log("Pending signals await admin review — approval fans out alerts to watchers.");
  process.exit(0);
}

main().catch((e) => { console.error(e); process.exit(1); });
