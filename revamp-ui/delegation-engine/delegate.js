// Lightweight delegation engine for Phase 0 backlog
// Reads Phase 0 backlog CSVs and emits per-squad CSVs (S1..S6)
// Outputs both Jira-like and Asana-like CSVs for easy import into trackers.

const fs = require("fs");
const path = require("path");

function parseCSV(text) {
  // Basic CSV parser supporting quoted fields with commas
  const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
  if (lines.length === 0) return [];

  const header = splitCSVLine(lines[0]);
  const rows = [];
  for (let i = 1; i < lines.length; i++) {
    const values = splitCSVLine(lines[i]);
    // skip rows that don't have same length as header
    const row = {};
    for (let j = 0; j < header.length; j++) {
      row[header[j]] = values[j] !== undefined ? values[j] : "";
    }
    rows.push(row);
  }
  return rows;
}

function splitCSVLine(line) {
  const res = [];
  let cur = "";
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') {
      if (inQuotes && line[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
      continue;
    }
    if (ch === "," && !inQuotes) {
      res.push(cur);
      cur = "";
      continue;
    }
    cur += ch;
  }
  res.push(cur);
  return res;
}

function toJiraRow(item) {
  // Jira-like header: Issue Type,Summ ary,Description,Priority,Status,Assignee,Labels,Story Points,Epic Link,Sprint
  return [
    item.issueType || "Task",
    item.summary || "",
    item.description || "",
    item.priority || "",
    item.status || "",
    item.assignee || "",
    item.labels || "",
    item.storyPoints || "",
    item.epicLink || "",
    item.sprint || "Phase 0",
  ].join(",");
}

function toAsanaRow(item) {
  // Asana-like header: Name,Notes,Assignee,Projects,Tags,Section,Story Points
  return [
    item.summary || "",
    item.description || "",
    item.assignee || "",
    item.epicLink || "",
    item.labels || "",
    item.sprint || "Phase 0",
    item.storyPoints || "",
  ].join(",");
}

function ensureDir(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}

function main() {
  // CSV inputs live one level up from delegation-engine directory
  const jiraPath = path.resolve(__dirname, "..", "PHASE0_JIRA_IMPORT.csv");
  const asanaPath = path.resolve(__dirname, "..", "PHASE0_ASANA_IMPORT.csv");
  const jiraExists = fs.existsSync(jiraPath);
  const asanaExists = fs.existsSync(asanaPath);
  const backlog = [];
  if (jiraExists) {
    const text = fs.readFileSync(jiraPath, "utf8");
    const rows = parseCSV(text);
    for (const r of rows) {
      backlog.push({
        issueType: r["Issue Type"] || r["Type"] || "Task",
        summary: r["Summ ary"] || r["Summary"] || r["Summary "],
        description: r["Description"] || "",
        priority: r["Priority"] || "",
        status: r["Status"] || "",
        assignee: r["Assignee"] || "",
        labels: r["Labels"] || "",
        storyPoints: r["Story Points"] || "",
        epicLink: r["Epic Link"] || "",
        sprint: r["Sprint"] || "Phase 0",
      });
    }
  }
  if (asanaExists) {
    const text = fs.readFileSync(asanaPath, "utf8");
    const rows = parseCSV(text);
    for (const r of rows) {
      backlog.push({
        issueType: r["Issue Type"] || "Task",
        summary: r["Name"] || r["Notes"] || "",
        description: r["Notes"] || "",
        priority: r["Priority"] || "",
        status: r["Status"] || "To Do",
        assignee: r["Assignee"] || "",
        labels: r["Tags"] || r["Tags,"] || "",
        storyPoints: r["Story Points"] || "",
        epicLink: r["Projects"] || "", // not a perfect mapping; keep optional
        sprint: r["Section"] || "Phase 0",
      });
    }
  }

  // Normalize: dynamic squad assign
  const NUM_SQUADS =
    process.env.NUM_SQUADS && Number(process.env.NUM_SQUADS) > 0
      ? Number(process.env.NUM_SQUADS)
      : 6;
  const squads = Array.from({ length: NUM_SQUADS }, (_, i) => `S${i + 1}`);
  let rr = 0;
  const squadRegex = new RegExp(`^S[1-${NUM_SQUADS}]$`);
  for (const b of backlog) {
    if (!b.assignee || !squadRegex.test(b.assignee)) {
      b.assignee = squads[rr % squads.length];
      rr++;
    }
  }

  // Prepare per-squad groups
  const groups = {};
  for (let i = 0; i < NUM_SQUADS; i++) {
    groups[`S${i + 1}`] = [];
  }
  backlog.forEach((b) => {
    if (!groups[b.assignee]) {
      // fallback in case of unknown; assign to S1
      b.assignee = "S1";
    }
    groups[b.assignee].push(b);
  });

  // Output directory
  const outRoot = path.join(__dirname, "delegation-output");
  ensureDir(outRoot);

  // For each squad, emit two files: Jira-like and Asana-like
  for (const s of squads) {
    const items = groups[s];
    // Build Jira CSV
    const jiraHeader =
      "Issue Type,Summ ary,Description,Priority,Status,Assignee,Labels,Story Points,Epic Link,Sprint";
    const jiraLines = [jiraHeader, ...items.map((it) => toJiraRow(it))];
    const jiraPathOut = path.join(outRoot, `${s}_Phase0_JIRA.csv`);
    fs.writeFileSync(jiraPathOut, jiraLines.join("\n"), "utf8");

    // Build Asana CSV
    const asanaHeader =
      "Name,Notes,Assignee,Projects,Tags,Section,Story Points";
    const asanaLines = [asanaHeader, ...items.map((it) => toAsanaRow(it))];
    const asanaPathOut = path.join(outRoot, `${s}_Phase0_ASANA.csv`);
    fs.writeFileSync(asanaPathOut, asanaLines.join("\n"), "utf8");
  }

  console.log("Delegation complete. Outputs written to delegation-output/");
}

main();
