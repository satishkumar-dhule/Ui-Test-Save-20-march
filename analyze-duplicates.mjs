import Database from "better-sqlite3";
import crypto from "crypto";

const DB_PATH = "/home/runner/workspace/artifacts/devprep/devprep.db";

const db = new Database(DB_PATH, { readonly: true });
db.pragma("journal_mode = WAL");

console.log("=".repeat(70));
console.log("DevPrep Database Analysis - Duplicate Detection");
console.log("=".repeat(70));

// Basic stats
const totalRecords = db
  .prepare("SELECT COUNT(*) as count FROM generated_content")
  .get();
console.log(`\n📊 Total records: ${totalRecords.count}`);

// Content by type
console.log("\n📈 Records by content_type:");
const byType = db
  .prepare(
    `
  SELECT content_type, COUNT(*) as count 
  FROM generated_content 
  GROUP BY content_type 
  ORDER BY count DESC
`,
  )
  .all();
byType.forEach((r) => console.log(`  ${r.content_type}: ${r.count}`));

// Content by channel
console.log("\n📈 Records by channel:");
const byChannel = db
  .prepare(
    `
  SELECT channel_id, COUNT(*) as count 
  FROM generated_content 
  GROUP BY channel_id 
  ORDER BY count DESC
`,
  )
  .all();
byChannel.forEach((r) => console.log(`  ${r.channel_id}: ${r.count}`));

// Find records containing SVG
console.log("\n" + "=".repeat(70));
console.log("🔍 SVG/Diagram Analysis");
console.log("=".repeat(70));

const svgRecords = db
  .prepare(
    `
  SELECT id, channel_id, content_type, data, created_at 
  FROM generated_content 
  WHERE data LIKE '%<svg%' OR data LIKE '%Mermaid%' OR data LIKE '%plantuml%' OR data LIKE '%diagram%'
`,
  )
  .all();

console.log(`\nFound ${svgRecords.length} records with potential diagrams:`);

// Parse and analyze SVG records
const svgAnalysis = [];
svgRecords.forEach((record) => {
  try {
    const parsed = JSON.parse(record.data);
    const dataStr = record.data;
    const hasSvg = dataStr.includes("<svg");
    const hasMermaid =
      dataStr.includes("mermaid") || dataStr.includes("Mermaid");
    const hasPlantUml =
      dataStr.includes("plantuml") || dataStr.includes("PlantUML");

    let svgHash = null;
    if (hasSvg) {
      const svgMatch = dataStr.match(/<svg[\s\S]*?<\/svg>/);
      if (svgMatch) {
        svgHash = crypto.createHash("md5").update(svgMatch[0]).digest("hex");
      }
    }

    svgAnalysis.push({
      id: record.id,
      channel_id: record.channel_id,
      content_type: record.content_type,
      created_at: record.created_at,
      hasSvg,
      hasMermaid,
      hasPlantUml,
      svgHash,
      parsed,
    });
  } catch (e) {
    console.log(`  ⚠️  Failed to parse record ${record.id}: ${e.message}`);
  }
});

console.log("\nSVG Details:");
svgAnalysis.forEach((r) => {
  const types = [];
  if (r.hasSvg) types.push("SVG");
  if (r.hasMermaid) types.push("Mermaid");
  if (r.hasPlantUml) types.push("PlantUML");
  console.log(
    `  [${r.id}] ${r.channel_id}/${r.content_type} - ${types.join(", ")} (hash: ${r.svgHash?.slice(0, 8) || "N/A"})`,
  );
});

// Group by SVG hash to find duplicates
console.log("\n" + "=".repeat(70));
console.log("🔄 SVG Duplicate Detection");
console.log("=".repeat(70));

const svgByHash = {};
svgAnalysis.forEach((r) => {
  if (r.svgHash) {
    if (!svgByHash[r.svgHash]) {
      svgByHash[r.svgHash] = [];
    }
    svgByHash[r.svgHash].push(r);
  }
});

let duplicateCount = 0;
let duplicateIds = [];
let totalDuplicateRecords = 0;

Object.entries(svgByHash).forEach(([hash, records]) => {
  if (records.length > 1) {
    duplicateCount++;
    totalDuplicateRecords += records.length - 1;
    console.log(`\n🔁 Duplicate SVG (${records.length} copies):`);
    records.forEach((r, i) => {
      const keep = i === 0 ? " (KEEP)" : " (DELETE)";
      console.log(
        `   ${i === 0 ? "✅" : "🗑️"} ${r.id}${keep} - ${r.channel_id}/${r.content_type}`,
      );
      if (i > 0) duplicateIds.push(r.id);
    });
  }
});

if (duplicateCount === 0) {
  console.log("\n✅ No duplicate SVGs found");
}

// Check for exact data duplicates (any content type)
console.log("\n" + "=".repeat(70));
console.log("🔄 Exact Data Duplicate Detection (All Content Types)");
console.log("=".repeat(70));

const allRecords = db
  .prepare(
    "SELECT id, channel_id, content_type, data, created_at FROM generated_content",
  )
  .all();
const dataHashes = {};
const exactDuplicates = [];

allRecords.forEach((r) => {
  const hash = crypto.createHash("sha256").update(r.data).digest("hex");
  if (!dataHashes[hash]) {
    dataHashes[hash] = [];
  }
  dataHashes[hash].push(r);
});

let exactDuplicateCount = 0;
let exactDuplicateIds = [];

Object.entries(dataHashes).forEach(([hash, records]) => {
  if (records.length > 1) {
    exactDuplicateCount++;
    console.log(
      `\n🔁 Exact duplicate (${records.length} copies, hash: ${hash.slice(0, 12)}...):`,
    );
    records.sort((a, b) => a.created_at - b.created_at);
    records.forEach((r, i) => {
      const keep = i === 0 ? " (KEEP)" : " (DELETE)";
      console.log(
        `   ${i === 0 ? "✅" : "🗑️"} ${r.id}${keep} - ${r.channel_id}/${r.content_type} - created: ${new Date(r.created_at * 1000).toISOString()}`,
      );
      if (i > 0) exactDuplicateIds.push(r.id);
    });
  }
});

if (exactDuplicateCount === 0) {
  console.log("\n✅ No exact data duplicates found");
}

// Summary
console.log("\n" + "=".repeat(70));
console.log("📋 SUMMARY");
console.log("=".repeat(70));
console.log(`\nTotal SVG records: ${svgAnalysis.length}`);
console.log(`SVG duplicate groups: ${duplicateCount}`);
console.log(`SVG duplicate records (to delete): ${totalDuplicateRecords}`);
console.log(`Exact duplicate groups: ${exactDuplicateCount}`);
console.log(`Exact duplicate records (to delete): ${exactDuplicateIds.length}`);

// Combined list of all IDs to delete
const allDuplicateIds = [...new Set([...duplicateIds, ...exactDuplicateIds])];
console.log(`\nTotal unique records to delete: ${allDuplicateIds.length}`);

if (allDuplicateIds.length > 0) {
  console.log("\n🗑️  IDs to delete:");
  allDuplicateIds.forEach((id) => console.log(`   "${id}"`));

  console.log("\n📝 SQL DELETE statements:");
  const chunkSize = 100;
  for (let i = 0; i < allDuplicateIds.length; i += chunkSize) {
    const chunk = allDuplicateIds.slice(i, i + chunkSize);
    console.log(
      `DELETE FROM generated_content WHERE id IN (${chunk.map((id) => `'${id}'`).join(", ")});`,
    );
  }
}

// Channel coverage stats
console.log("\n" + "=".repeat(70));
console.log("📊 Content Coverage by Channel and Type");
console.log("=".repeat(70));

const coverage = db
  .prepare(
    `
  SELECT channel_id, content_type, COUNT(*) as count 
  FROM generated_content 
  GROUP BY channel_id, content_type 
  ORDER BY channel_id, content_type
`,
  )
  .all();

const coverageMap = {};
coverage.forEach((r) => {
  if (!coverageMap[r.channel_id]) {
    coverageMap[r.channel_id] = {};
  }
  coverageMap[r.channel_id][r.content_type] = r.count;
});

Object.entries(coverageMap).forEach(([channel, types]) => {
  console.log(`\n${channel}:`);
  Object.entries(types).forEach(([type, count]) => {
    console.log(`  ${type}: ${count}`);
  });
});

db.close();
