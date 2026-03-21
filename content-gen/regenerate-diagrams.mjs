/**
 * DevPrep Diagram Regeneration Script
 *
 * Regenerates unique diagrams for all questions without valid diagrams.
 *
 * Usage:
 *   bun regenerate-diagrams.mjs      # dry run
 *   bun regenerate-diagrams.mjs --apply  # apply changes
 */

import { Database } from "bun:sqlite";
import crypto from "crypto";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH =
  process.env.DB_PATH || path.resolve(__dirname, "../data/devprep.db");
const APPLY = process.argv.includes("--apply") || process.argv.includes("-y");
const REGENERATE_ALL = process.argv.includes("--all");

const CHANNEL_SCHEMES = {
  javascript: { primary: "#f7df1e", secondary: "#323330", accent: "#276cb4" },
  react: { primary: "#61dafb", secondary: "#20232a", accent: "#61dafb" },
  algorithms: { primary: "#306998", secondary: "#ffd43b", accent: "#ffe873" },
  devops: { primary: "#0db7ed", secondary: "#282c34", accent: "#ffc107" },
  kubernetes: { primary: "#326ce5", secondary: "#326ce5", accent: "#7f8ge8" },
  networking: { primary: "#e44d26", secondary: "#4a4a4a", accent: "#ffa500" },
  "system-design": {
    primary: "#6b5b95",
    secondary: "#2c2c2c",
    accent: "#a78bfa",
  },
  "aws-saa": { primary: "#ff9900", secondary: "#252f3e", accent: "#f90" },
  "aws-dev": { primary: "#ff9900", secondary: "#252f3e", accent: "#00a1c9" },
  cka: { primary: "#326ce5", secondary: "#fefefe", accent: "#388bfd" },
  terraform: { primary: "#7b42bc", secondary: "#5c2d91", accent: "#844fba" },
};

function seededRandom(seed) {
  let state = seed;
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

function hashString(str) {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = (hash << 5) - hash + char;
    hash = hash & hash;
  }
  return Math.abs(hash);
}

function generateUniqueSvg(channelId, questionId, title, dataStr) {
  const scheme = CHANNEL_SCHEMES[channelId] || CHANNEL_SCHEMES.devops;
  const seed = hashString(questionId + channelId + title);
  const rng = seededRandom(seed);

  const bgColor = "#1a1a2e";
  const boxColor = scheme.primary;
  const textColor = "#ffffff";

  const processCount = 3 + Math.floor(rng() * 4);
  const processLabels = [
    "Input",
    "Process",
    "Validate",
    "Execute",
    "Transform",
    "Store",
    "Output",
    "Cleanup",
  ];

  const boxWidth = 100;
  const boxHeight = 40;
  const hGap = 30;
  const totalWidth = processCount * boxWidth + (processCount - 1) * hGap + 60;
  const startX = 30;
  const startY = 100;

  let svg = `<svg viewBox="0 0 ${totalWidth} 220" xmlns="http://www.w3.org/2000/svg">`;
  svg += `<rect width="${totalWidth}" height="220" rx="8" fill="${bgColor}"/>`;
  svg += `<text x="${totalWidth / 2}" y="35" text-anchor="middle" fill="${scheme.primary}" font-size="14" font-weight="700">${title.slice(0, 40)}</text>`;
  svg += `<text x="${totalWidth / 2}" y="55" text-anchor="middle" fill="${scheme.accent}" font-size="10">ID: ${questionId.slice(0, 12)}</text>`;

  for (let i = 0; i < processCount; i++) {
    const x = startX + i * (boxWidth + hGap);
    const y = startY;
    const opacity = 0.3 + 0.7 * (i / processCount);
    const label = processLabels[Math.floor(rng() * processLabels.length)];

    svg += `<rect x="${x}" y="${y}" width="${boxWidth}" height="${boxHeight}" rx="4" fill="${boxColor}" fill-opacity="${opacity}" stroke="${boxColor}" stroke-width="1.5"/>`;
    svg += `<text x="${x + boxWidth / 2}" y="${y + boxHeight / 2 + 4}" text-anchor="middle" fill="${textColor}" font-size="9">${label}</text>`;

    if (i < processCount - 1) {
      svg += `<path d="M${x + boxWidth} ${y + boxHeight / 2} L${x + boxWidth + hGap} ${y + boxHeight / 2}" stroke="${scheme.accent}" stroke-width="1.5" marker-end="url(#arrow${i})"/>`;
    }
  }

  svg += `<defs>`;
  for (let i = 0; i < processCount - 1; i++) {
    svg += `<marker id="arrow${i}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="4" markerHeight="4" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="${scheme.accent}"/></marker>`;
  }
  svg += `</defs>`;

  svg += `<rect x="${totalWidth / 2 - 50}" y="170" width="100" height="30" rx="4" fill="${scheme.primary}"/>`;
  svg += `<text x="${totalWidth / 2}" y="190" text-anchor="middle" fill="${bgColor}" font-size="10" font-weight="600">RESULT</text>`;

  svg += `</svg>`;
  return svg;
}

function main() {
  console.log("\n🔄 DevPrep Diagram Regeneration");
  console.log("─".repeat(50));
  console.log(`   Database: ${DB_PATH}`);
  console.log(`   Mode: ${APPLY ? "APPLY" : "DRY RUN"}`);
  console.log(`   Regenerate All: ${REGENERATE_ALL}`);
  console.log("─".repeat(50));

  const db = new Database(DB_PATH);
  db.exec("PRAGMA journal_mode = WAL");

  const rows = db
    .prepare(
      `
    SELECT id, channel_id, content_type, data 
    FROM generated_content 
    WHERE content_type = 'question'
    ORDER BY created_at DESC
  `,
    )
    .all();

  let needsUpdate = 0;
  let updated = 0;
  let skipped = 0;

  for (const row of rows) {
    let data;
    try {
      data = JSON.parse(row.data);
    } catch {
      skipped++;
      continue;
    }

    if (!data.sections) data.sections = [];

    const hasValidDiagram = data.sections.some(
      (s) =>
        s.type === "diagram" &&
        s.svgContent &&
        s.svgContent.length > 200 &&
        !s.svgContent.includes("REPLACE"),
    );

    if (hasValidDiagram && !REGENERATE_ALL) {
      skipped++;
      continue;
    }

    needsUpdate++;

    if (APPLY) {
      const svg = generateUniqueSvg(
        row.channel_id,
        row.id,
        data.title || "Topic",
        row.data,
      );

      data.sections = data.sections.filter(
        (s) =>
          s.type !== "diagram" || !s.svgContent || s.svgContent.length < 200,
      );
      data.sections.push({
        type: "diagram",
        title: `${(data.title || "Topic").slice(0, 30)} Architecture`,
        description: `Channel-specific diagram for ${row.channel_id}`,
        svgContent: svg,
      });

      db.prepare(
        `
        UPDATE generated_content 
        SET data = ?, updated_at = strftime('%s', 'now')
        WHERE id = ?
      `,
      ).run(JSON.stringify(data), row.id);

      updated++;
      if (updated % 20 === 0) {
        console.log(`   Updated ${updated}/${needsUpdate}...`);
      }
    }
  }

  db.close();

  console.log("\n📊 Results:");
  console.log(`   Total questions: ${rows.length}`);
  console.log(`   Already have diagrams: ${skipped}`);
  console.log(`   ${APPLY ? "Updated" : "Need update"}: ${needsUpdate}`);

  if (APPLY) {
    console.log(`\n✅ Regenerated ${updated} diagrams`);
  } else {
    console.log(`\n⚠️  Dry run - no changes made`);
    console.log(`   Run with --apply to apply changes`);
  }
}

main();
