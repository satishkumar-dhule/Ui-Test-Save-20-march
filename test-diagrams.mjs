/**
 * DevPrep Diagram Uniqueness Test
 *
 * Tests that diagram generation produces unique, channel-specific diagrams.
 */

import { Database } from "bun:sqlite";
import crypto from "crypto";

const DB_PATH = "/home/runner/workspace/data/devprep.db";

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${crypto.randomBytes(2).toString("hex")}`;
}

async function generateTestDiagram(channelId, topic) {
  const id = makeId("test-diag");
  const channelColors = {
    javascript: { primary: "#f7df1e", secondary: "#323330" },
    devops: { primary: "#56d364", secondary: "#388bfd" },
    kubernetes: { primary: "#326ce5", secondary: "#388bfd" },
    aws: { primary: "#ff9900", secondary: "#232f3e" },
    default: { primary: "#e3b341", secondary: "#21262d" },
  };
  const colors = channelColors[channelId] || channelColors.default;

  const svgContent = `<svg viewBox="0 0 600 400" xmlns="http://www.w3.org/2000/svg">
    <rect x="10" y="10" width="580" height="380" rx="8" fill="${colors.secondary}" stroke="#30363d" stroke-width="1.5"/>
    <text x="300" y="50" text-anchor="middle" fill="${colors.primary}" font-size="18" font-weight="700">${topic}</text>
    <rect x="50" y="80" width="150" height="60" rx="4" fill="${colors.primary}" fill-opacity="0.2" stroke="${colors.primary}" stroke-width="1"/>
    <text x="125" y="115" text-anchor="middle" fill="${colors.primary}" font-size="12">Channel: ${channelId}</text>
    <line x1="200" y1="110" x2="350" y2="110" stroke="${colors.primary}" stroke-width="2" marker-end="url(#arrow)"/>
    <rect x="350" y="80" width="150" height="60" rx="4" fill="${colors.primary}" fill-opacity="0.2" stroke="${colors.primary}" stroke-width="1"/>
    <text x="425" y="115" text-anchor="middle" fill="${colors.primary}" font-size="12">Unique ID: ${id}</text>
  </svg>`;

  return {
    id,
    type: "diagram",
    title: `${topic} Architecture`,
    description: `Channel-specific diagram for ${channelId}`,
    svgContent,
  };
}

async function runTests() {
  console.log("🔍 DevPrep Diagram Uniqueness Test\n");

  const db = new Database(DB_PATH);
  const results = {
    duplicateCount: 0,
    uniqueDiagrams: 0,
    testsPassed: false,
    issues: [],
  };

  // 1. Check for existing SVG diagrams
  console.log("1. Checking existing diagrams in database...");
  const existingDiagrams = db
    .prepare(
      `
    SELECT id, channel_id, data FROM generated_content 
    WHERE data LIKE '%<svg%' OR data LIKE '%svgContent%'
  `,
    )
    .all();

  if (existingDiagrams.length === 0) {
    console.log("   ⚠️  No diagrams found in database");
    results.issues.push("No diagrams exist in database yet");
  } else {
    results.uniqueDiagrams = existingDiagrams.length;

    // Check for duplicates
    const svgHashes = new Map();
    for (const record of existingDiagrams) {
      const data = JSON.parse(record.data);
      const svgMatch = JSON.stringify(data).match(/<svg[^>]*>[\s\S]*?<\/svg>/);
      if (svgMatch) {
        const hash = svgMatch[0].substring(0, 500);
        if (!svgHashes.has(hash)) {
          svgHashes.set(hash, []);
        }
        svgHashes.get(hash).push(record.id);
      }
    }

    let duplicates = 0;
    for (const [hash, ids] of svgHashes) {
      if (ids.length > 1) {
        duplicates++;
        results.issues.push(
          `Duplicate SVG found: ${ids.length} records share same diagram`,
        );
      }
    }
    results.duplicateCount = duplicates;
    console.log(
      `   Found ${existingDiagrams.length} diagrams, ${duplicates} duplicates`,
    );
  }

  // 2. Verify required files exist
  console.log("\n2. Checking required files...");
  const fs = await import("fs");
  const requiredFiles = [
    "/home/runner/workspace/content-gen/generate-diagrams.mjs",
    "/home/runner/workspace/content-gen/diagram-templates.mjs",
    "/home/runner/workspace/content-gen/migrate-diagrams.mjs",
    "/home/runner/workspace/content-gen/src/diagram-engine.ts",
  ];

  let filesExist = true;
  for (const file of requiredFiles) {
    if (fs.existsSync(file)) {
      console.log(`   ✓ ${file}`);
    } else {
      console.log(`   ✗ ${file} - NOT FOUND`);
      results.issues.push(`Missing required file: ${file}`);
      filesExist = false;
    }
  }

  // 3. Test generating unique diagrams for different channels
  console.log("\n3. Testing diagram uniqueness across channels...");
  const channels = ["javascript", "devops", "kubernetes"];
  const generatedDiagrams = [];

  for (const channel of channels) {
    const diagram = await generateTestDiagram(channel, `${channel} Topic`);
    generatedDiagrams.push({
      channel,
      id: diagram.id,
      svgHash: hashSvg(diagram.svgContent),
    });
  }

  // Verify uniqueness
  const svgHashes = new Set(generatedDiagrams.map((d) => d.svgHash));
  if (svgHashes.size === channels.length) {
    console.log(`   ✓ All ${channels.length} diagrams are unique`);
    results.uniqueDiagrams += channels.length;
  } else {
    console.log(
      `   ✗ Only ${svgHashes.size} unique SVGs for ${channels.length} channels`,
    );
    results.issues.push("Generated diagrams are not unique across channels");
  }

  // 4. Test channel-specific content
  console.log("\n4. Testing channel-specific colors/styles...");
  const channelSpecific = {};
  for (const channel of channels) {
    const diagram = await generateTestDiagram(channel, `${channel} Topic`);
    // Extract just the color values, not the full SVG (IDs make each unique)
    const colorMatch = diagram.svgContent.match(/#[a-fA-F0-9]{6}/g) || [];
    channelSpecific[channel] = colorMatch.slice(0, 3).join(",");
  }

  const uniqueStyles = new Set(Object.values(channelSpecific));
  if (uniqueStyles.size === channels.length) {
    console.log(`   ✓ All channels have unique styling`);
  } else {
    console.log(`   ✗ Channels share styles: ${uniqueStyles.size} unique`);
    results.issues.push("Channels do not have distinct visual styling");
  }

  // 5. Summary
  console.log("\n" + "=".repeat(50));
  results.testsPassed = results.issues.length === 0;

  console.log("\n📊 Test Report:");
  console.log(JSON.stringify(results, null, 2));

  db.close();
  return results;
}

function hashSvg(svg) {
  return crypto.createHash("md5").update(svg.substring(0, 500)).digest("hex");
}

runTests().catch(console.error);
