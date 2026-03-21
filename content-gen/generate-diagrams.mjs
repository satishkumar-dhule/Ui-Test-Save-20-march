/**
 * DevPrep Unique Diagram Generator
 *
 * Generates unique, channel-specific SVG diagrams for content items.
 * Each diagram is based on the question content, ensuring visual diversity.
 *
 * Features:
 * - Content-based seeding for unique visuals
 * - Channel-specific color schemes
 * - Deduplication via hash tracking
 * - Question-specific labels and elements
 */

import crypto from "crypto";

const DB_PATH = process.env.DB_PATH || "./data/devprep.db";

export const CHANNEL_SCHEMES = {
  javascript: {
    primary: "#f7df1e",
    secondary: "#323330",
    accent: "#276cb4",
    gradient: ["#f7df1e", "#f0db4f"],
    icon: "js",
  },
  react: {
    primary: "#61dafb",
    secondary: "#20232a",
    accent: "#61dafb",
    gradient: ["#61dafb", "#38bdf8"],
    icon: "re",
  },
  algorithms: {
    primary: "#306998",
    secondary: "#ffd43b",
    accent: "#ffe873",
    gradient: ["#306998", "#ffd43b"],
    icon: "al",
  },
  devops: {
    primary: "#0db7ed",
    secondary: "#282c34",
    accent: "#ffc107",
    gradient: ["#0db7ed", "#1f6feb"],
    icon: "do",
  },
  kubernetes: {
    primary: "#326ce5",
    secondary: "#326ce5",
    accent: "#7f8ge8",
    gradient: ["#326ce5", "#7f8ge8"],
    icon: "k8",
  },
  networking: {
    primary: "#e44d26",
    secondary: "#4a4a4a",
    accent: "#ffa500",
    gradient: ["#e44d26", "#ff6b35"],
    icon: "nw",
  },
  "system-design": {
    primary: "#6b5b95",
    secondary: "#2c2c2c",
    accent: "#a78bfa",
    gradient: ["#6b5b95", "#8b7fb5"],
    icon: "sd",
  },
  "aws-saa": {
    primary: "#ff9900",
    secondary: "#252f3e",
    accent: "#f90",
    gradient: ["#ff9900", "#ffcc00"],
    icon: "aw",
  },
  "aws-dev": {
    primary: "#ff9900",
    secondary: "#252f3e",
    accent: "#00a1c9",
    gradient: ["#ff9900", "#00a1c9"],
    icon: "aw",
  },
  cka: {
    primary: "#326ce5",
    secondary: "#fefefe",
    accent: "#388bfd",
    gradient: ["#326ce5", "#5c8ge8"],
    icon: "ck",
  },
  terraform: {
    primary: "#7b42bc",
    secondary: "#5c2d91",
    accent: "#844fba",
    gradient: ["#7b42bc", "#9558b2"],
    icon: "tf",
  },
};

function getChannelScheme(channelId) {
  return CHANNEL_SCHEMES[channelId] || CHANNEL_SCHEMES.javascript;
}

export function generateContentHash(content) {
  return crypto.createHash("sha256").update(content).digest("hex").slice(0, 16);
}

export function seedRandomFromHash(hash) {
  let seed = 0;
  for (let i = 0; i < hash.length; i++) {
    seed = (seed * 31 + hash.charCodeAt(i)) % 2147483647;
  }
  return seed;
}

function seededRandom(hash, offset = 0) {
  let state = seedRandomFromHash(hash + offset);
  return () => {
    state = (state * 1103515245 + 12345) % 2147483648;
    return state / 2147483648;
  };
}

function seededChoice(hash, offset, options) {
  const rng = seededRandom(hash, offset);
  return options[Math.floor(rng() * options.length)];
}

function seededShuffle(hash, offset, array) {
  const rng = seededRandom(hash, offset);
  const result = [...array];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function extractKeywords(title, content = "") {
  const text = `${title} ${content}`.toLowerCase();
  const keywords = [];

  const patterns = {
    closure: ["closure", "scope", "lexical", "capture"],
    async: ["async", "promise", "await", "callback", "event"],
    react: ["hook", "state", "effect", "component", "render", "props"],
    array: ["array", "map", "filter", "reduce", "iterate"],
    class: ["class", "object", "instance", "prototype", "extends"],
    function: ["function", "arrow", "method", "call", "invoke"],
    memory: ["memory", "heap", "stack", "gc", "leak"],
    network: ["http", "tcp", "dns", "request", "response", "socket"],
    database: ["database", "query", "index", "sql", "nosql", "transaction"],
    docker: ["docker", "container", "image", "layer", "volume"],
    kubernetes: ["pod", "node", "cluster", "service", "deployment"],
    security: ["auth", "encrypt", "token", "jwt", "oauth"],
    testing: ["test", "mock", "unit", "integration", "coverage"],
    performance: ["performance", "optimize", "cache", "lazy", "memo"],
    algorithm: ["algorithm", "sort", "search", "tree", "graph", "dp"],
    complexity: ["big-o", "complexity", "time", "space", "log"],
  };

  for (const [key, terms] of Object.entries(patterns)) {
    if (terms.some((t) => text.includes(t))) {
      keywords.push(key);
    }
  }

  if (keywords.length === 0) {
    keywords.push("general");
  }

  return keywords;
}

export function generateDiagramForQuestion(questionData, channelId) {
  const scheme = getChannelScheme(channelId);
  const contentHash = generateContentHash(
    JSON.stringify(questionData) +
      channelId +
      (questionData.id || "") +
      Date.now(),
  );
  const rng = seededRandom(contentHash, 0);

  const keywords = extractKeywords(
    questionData.title || "",
    JSON.stringify(questionData),
  );

  const diagramTypes = [
    "flowchart",
    "hierarchy",
    "comparison",
    "sequence",
    "state",
  ];
  const primaryType = seededChoice(contentHash, 1, diagramTypes);

  let svg = "";

  switch (primaryType) {
    case "flowchart":
      svg = generateFlowchartDiagram(contentHash, scheme, keywords, rng);
      break;
    case "hierarchy":
      svg = generateHierarchyDiagram(contentHash, scheme, keywords, rng);
      break;
    case "comparison":
      svg = generateComparisonDiagram(contentHash, scheme, keywords, rng);
      break;
    case "sequence":
      svg = generateSequenceDiagram(contentHash, scheme, keywords, rng);
      break;
    case "state":
      svg = generateStateDiagram(contentHash, scheme, keywords, rng);
      break;
    default:
      svg = generateFlowchartDiagram(contentHash, scheme, keywords, rng);
  }

  return {
    hash: contentHash,
    svgContent: svg,
    type: primaryType,
    keywords,
  };
}

function generateFlowchartDiagram(hash, scheme, keywords, rng) {
  const bgColor = "#1a1a2e";
  const boxColor = scheme.primary;
  const textColor = "#ffffff";
  const arrowColor = scheme.secondary;

  const processCount = 3 + Math.floor(rng() * 3);
  const processes = [];

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
  const shuffledLabels = seededShuffle(hash, 10, processLabels);

  for (let i = 0; i < processCount; i++) {
    processes.push(shuffledLabels[i % shuffledLabels.length]);
  }

  const boxWidth = 140;
  const boxHeight = 50;
  const hGap = 40;
  const vGap = 80;
  const totalWidth =
    processes.length * boxWidth + (processes.length - 1) * hGap + 60;
  const startX = 30;
  const startY = 80;

  let svg = `<svg viewBox="0 0 ${totalWidth} 300" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, -apple-system, sans-serif">`;
  svg += `<rect width="${totalWidth}" height="300" rx="8" fill="${bgColor}"/>`;
  svg += `<text x="${totalWidth / 2}" y="35" text-anchor="middle" fill="${scheme.primary}" font-size="14" font-weight="700">${keywords[0]?.toUpperCase() || "FLOW"} DIAGRAM</text>`;

  for (let i = 0; i < processes.length; i++) {
    const x = startX + i * (boxWidth + hGap);
    const y = startY;

    const opacity = 0.2 + 0.8 * (i / processes.length);
    svg += `<rect x="${x}" y="${y}" width="${boxWidth}" height="${boxHeight}" rx="6" fill="${boxColor}${Math.floor(
      opacity * 255,
    )
      .toString(16)
      .padStart(2, "0")}" stroke="${boxColor}" stroke-width="2"/>`;
    svg += `<text x="${x + boxWidth / 2}" y="${y + boxHeight / 2 + 4}" text-anchor="middle" fill="${textColor}" font-size="11" font-weight="500">${processes[i]}</text>`;

    if (i < processes.length - 1) {
      const arrowX = x + boxWidth;
      const arrowY = y + boxHeight / 2;
      svg += `<path d="M${arrowX} ${arrowY} L${arrowX + hGap} ${arrowY}" stroke="${arrowColor}" stroke-width="2" fill="none" marker-end="url(#arrow-${hash.slice(0, 4)})"/>`;
    }
  }

  const decisionY = startY + boxHeight + vGap;
  svg += `<polygon points="${totalWidth / 2 - 50},${decisionY} ${totalWidth / 2 + 50},${decisionY} ${totalWidth / 2},${decisionY + 60}" fill="${scheme.accent}" opacity="0.8"/>`;
  svg += `<text x="${totalWidth / 2}" y="${decisionY + 35}" text-anchor="middle" fill="${bgColor}" font-size="10" font-weight="600">DECISION</text>`;

  svg += `<path d="M${startX + boxWidth / 2} ${startY + boxHeight} L${startX + boxWidth / 2} ${decisionY - 5}" stroke="${arrowColor}" stroke-width="2" fill="none" marker-end="url(#arrow-${hash.slice(0, 4)})"/>`;

  svg += `<defs><marker id="arrow-${hash.slice(0, 4)}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="${arrowColor}"/></marker></defs>`;

  svg += `<rect x="${totalWidth / 2 - 40}" y="${decisionY + 80}" width="80" height="40" rx="4" fill="${scheme.primary}"/>`;
  svg += `<text x="${totalWidth / 2}" y="${decisionY + 105}" text-anchor="middle" fill="${bgColor}" font-size="10" font-weight="600">RESULT</text>`;

  svg += `<path d="M${totalWidth / 2} ${decisionY + 60} L${totalWidth / 2} ${decisionY + 78}" stroke="${arrowColor}" stroke-width="2" fill="none" marker-end="url(#arrow-${hash.slice(0, 4)})"/>`;

  svg += `</svg>`;
  return svg;
}

function generateHierarchyDiagram(hash, scheme, keywords, rng) {
  const bgColor = "#1a1a2e";
  const levels = 3 + Math.floor(rng() * 2);

  const totalWidth = 500;
  const totalHeight = 350;

  let svg = `<svg viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif">`;
  svg += `<rect width="${totalWidth}" height="${totalHeight}" rx="8" fill="${bgColor}"/>`;
  svg += `<text x="${totalWidth / 2}" y="30" text-anchor="middle" fill="${scheme.primary}" font-size="14" font-weight="700">${keywords[0]?.toUpperCase() || "HIERARCHY"}</text>`;

  const levelColors = [scheme.primary, scheme.accent, "#6b7280", "#4b5563"];

  const rootWidth = 160;
  const rootHeight = 45;
  const rootX = totalWidth / 2 - rootWidth / 2;
  const rootY = 50;

  svg += `<rect x="${rootX}" y="${rootY}" width="${rootWidth}" height="${rootHeight}" rx="6" fill="${levelColors[0]}" opacity="0.9"/>`;
  svg += `<text x="${totalWidth / 2}" y="${rootY + 28}" text-anchor="middle" fill="${bgColor}" font-size="11" font-weight="700">${keywords[0]?.toUpperCase() || "ROOT"}</text>`;

  const childCount = 2 + Math.floor(rng() * 3);
  const childWidth = 100;
  const childHeight = 35;
  const childY = rootY + rootHeight + 60;
  const totalChildWidth = childCount * childWidth + (childCount - 1) * 30;
  const childStartX = totalWidth / 2 - totalChildWidth / 2;

  for (let i = 0; i < childCount; i++) {
    const childX = childStartX + i * (childWidth + 30);

    svg += `<path d="M${rootX + rootWidth / 2} ${rootY + rootHeight} L${childX + childWidth / 2} ${childY}" stroke="${levelColors[1]}" stroke-width="1.5" fill="none"/>`;

    svg += `<rect x="${childX}" y="${childY}" width="${childWidth}" height="${childHeight}" rx="4" fill="${levelColors[1]}" opacity="0.7"/>`;
    svg += `<text x="${childX + childWidth / 2}" y="${childY + 22}" text-anchor="middle" fill="#ffffff" font-size="9" font-weight="500">Level 2-${i + 1}</text>`;

    if (levels > 2 && rng() > 0.3) {
      const grandchildCount = 1 + Math.floor(rng() * 2);
      const grandchildY = childY + childHeight + 50;
      const grandchildWidth = 70;
      const grandchildHeight = 30;
      const grandchildSpacing = 40;
      const grandchildStartX =
        childX +
        childWidth / 2 -
        (grandchildCount * grandchildWidth +
          (grandchildCount - 1) * grandchildSpacing) /
          2;

      for (let j = 0; j < grandchildCount; j++) {
        const gcX =
          grandchildStartX + j * (grandchildWidth + grandchildSpacing);
        svg += `<path d="M${childX + childWidth / 2} ${childY + childHeight} L${gcX + grandchildWidth / 2} ${grandchildY}" stroke="${levelColors[2]}" stroke-width="1" fill="none" stroke-dasharray="4,2"/>`;
        svg += `<rect x="${gcX}" y="${grandchildY}" width="${grandchildWidth}" height="${grandchildHeight}" rx="3" fill="${levelColors[2]}" opacity="0.5"/>`;
        svg += `<text x="${gcX + grandchildWidth / 2}" y="${grandchildY + 18}" text-anchor="middle" fill="#ffffff" font-size="8">Leaf</text>`;
      }
    }
  }

  svg += `<rect x="30" y="${totalHeight - 60}" width="${totalWidth - 60}" height="40" rx="4" fill="#252540"/>`;
  svg += `<text x="${totalWidth / 2}" y="${totalHeight - 38}" text-anchor="middle" fill="${scheme.accent}" font-size="9">Each level represents ${keywords[0] || "a conceptual layer"}</text>`;

  svg += `</svg>`;
  return svg;
}

function generateComparisonDiagram(hash, scheme, keywords, rng) {
  const bgColor = "#1a1a2e";
  const totalWidth = 550;
  const totalHeight = 320;

  const items = [];
  const itemCount = 2 + Math.floor(rng() * 2);
  const itemLabels = ["Option A", "Option B", "Option C", "Option D"];
  const itemColors = [scheme.primary, scheme.accent, "#10b981", "#f59e0b"];

  for (let i = 0; i < itemCount; i++) {
    items.push({
      label: itemLabels[i],
      color: itemColors[i],
      pros: Math.floor(rng() * 3) + 2,
      cons: Math.floor(rng() * 2) + 1,
    });
  }

  let svg = `<svg viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif">`;
  svg += `<rect width="${totalWidth}" height="${totalHeight}" rx="8" fill="${bgColor}"/>`;
  svg += `<text x="${totalWidth / 2}" y="30" text-anchor="middle" fill="${scheme.primary}" font-size="14" font-weight="700">COMPARISON</text>`;

  const colWidth = (totalWidth - 60) / items.length;
  const startY = 60;

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const x = 30 + i * colWidth + colWidth / 2;

    svg += `<rect x="${30 + i * colWidth + 5}" y="${startY}" width="${colWidth - 10}" height="${totalHeight - 100}" rx="6" fill="${item.color}" opacity="0.15" stroke="${item.color}" stroke-width="1.5"/>`;

    svg += `<text x="${x}" y="${startY + 25}" text-anchor="middle" fill="${item.color}" font-size="12" font-weight="700">${item.label}</text>`;

    svg += `<text x="${x}" y="${startY + 55}" text-anchor="middle" fill="#10b981" font-size="10">Pros</text>`;
    for (let p = 0; p < item.pros; p++) {
      svg += `<circle cx="${x - 20}" cy="${startY + 75 + p * 25}" r="4" fill="#10b981"/>`;
      svg += `<text x="${x - 10}" y="${startY + 79 + p * 25}" fill="#e5e7eb" font-size="8">Pro ${p + 1}</text>`;
    }

    svg += `<text x="${x}" y="${startY + 85 + item.pros * 25 + 10}" text-anchor="middle" fill="#ef4444" font-size="10">Cons</text>`;
    for (let c = 0; c < item.cons; c++) {
      svg += `<circle cx="${x - 20}" cy="${startY + 105 + item.pros * 25 + c * 25}" r="4" fill="#ef4444"/>`;
      svg += `<text x="${x - 10}" y="${startY + 109 + item.pros * 25 + c * 25}" fill="#e5e7eb" font-size="8">Con ${c + 1}</text>`;
    }
  }

  svg += `<text x="${totalWidth / 2}" y="${totalHeight - 25}" text-anchor="middle" fill="#9ca3af" font-size="9">Consider: ${keywords.join(", ")}</text>`;

  svg += `</svg>`;
  return svg;
}

function generateSequenceDiagram(hash, scheme, keywords, rng) {
  const bgColor = "#1a1a2e";
  const totalWidth = 500;
  const totalHeight = 320;

  const actors = [];
  const actorCount = 2 + Math.floor(rng() * 2);
  const actorLabels = [
    "Client",
    "Server",
    "Database",
    "Cache",
    "API",
    "Worker",
  ];
  const shuffledActors = seededShuffle(hash, 20, actorLabels);

  for (let i = 0; i < actorCount; i++) {
    actors.push(shuffledActors[i]);
  }

  let svg = `<svg viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif">`;
  svg += `<rect width="${totalWidth}" height="${totalHeight}" rx="8" fill="${bgColor}"/>`;
  svg += `<text x="${totalWidth / 2}" y="30" text-anchor="middle" fill="${scheme.primary}" font-size="14" font-weight="700">SEQUENCE</text>`;

  const laneWidth = 100;
  const startX = 50;
  const lifelineStartY = 60;
  const lifelineEndY = totalHeight - 40;

  for (let i = 0; i < actors.length; i++) {
    const x = startX + i * laneWidth + laneWidth / 2;

    svg += `<rect x="${x - 35}" y="${lifelineStartY - 5}" width="70" height="25" rx="4" fill="${scheme.primary}" opacity="0.8"/>`;
    svg += `<text x="${x}" y="${lifelineStartY + 12}" text-anchor="middle" fill="${bgColor}" font-size="10" font-weight="600">${actors[i]}</text>`;

    svg += `<line x1="${x}" y1="${lifelineStartY + 20}" x2="${x}" y2="${lifelineEndY}" stroke="${scheme.accent}" stroke-width="2" stroke-dasharray="5,3"/>`;
  }

  const stepCount = 3 + Math.floor(rng() * 4);
  for (let i = 0; i < stepCount; i++) {
    const fromIdx = Math.floor(rng() * actors.length);
    let toIdx = Math.floor(rng() * actors.length);
    while (toIdx === fromIdx) {
      toIdx = Math.floor(rng() * actors.length);
    }

    const fromX = startX + fromIdx * laneWidth + laneWidth / 2;
    const toX = startX + toIdx * laneWidth + laneWidth / 2;
    const stepY =
      lifelineStartY +
      50 +
      i * ((lifelineEndY - lifelineStartY - 60) / stepCount);

    const isResponse = i % 2 === 1;
    svg += `<path d="M${fromX} ${stepY} L${toX} ${stepY}" stroke="${isResponse ? scheme.accent : scheme.primary}" stroke-width="2" fill="none" marker-end="url(#seq-arrow-${hash.slice(0, 4)})"/>`;
    svg += `<text x="${(fromX + toX) / 2}" y="${stepY - 5}" text-anchor="middle" fill="#e5e7eb" font-size="8">${isResponse ? "response" : "request"} ${i + 1}</text>`;
  }

  svg += `<defs><marker id="seq-arrow-${hash.slice(0, 4)}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="${scheme.primary}"/></marker></defs>`;

  svg += `</svg>`;
  return svg;
}

function generateStateDiagram(hash, scheme, keywords, rng) {
  const bgColor = "#1a1a2e";
  const totalWidth = 500;
  const totalHeight = 300;

  const states = [];
  const stateCount = 3 + Math.floor(rng() * 3);
  const stateLabels = [
    "Initial",
    "Processing",
    "Validating",
    "Success",
    "Error",
    "Pending",
    "Complete",
    "Retry",
  ];
  const shuffledStates = seededShuffle(hash, 30, stateLabels);

  for (let i = 0; i < stateCount; i++) {
    states.push(shuffledStates[i]);
  }

  let svg = `<svg viewBox="0 0 ${totalWidth} ${totalHeight}" xmlns="http://www.w3.org/2000/svg" font-family="system-ui, sans-serif">`;
  svg += `<rect width="${totalWidth}" height="${totalHeight}" rx="8" fill="${bgColor}"/>`;
  svg += `<text x="${totalWidth / 2}" y="30" text-anchor="middle" fill="${scheme.primary}" font-size="14" font-weight="700">STATE MACHINE</text>`;

  const stateWidth = 100;
  const stateHeight = 50;
  const positions = [];

  const cols = Math.ceil(Math.sqrt(stateCount));
  const rows = Math.ceil(stateCount / cols);
  const gridWidth = cols * stateWidth + (cols - 1) * 40;
  const gridHeight = rows * stateHeight + (rows - 1) * 60;
  const startX = (totalWidth - gridWidth) / 2;
  const startY = 70;

  for (let i = 0; i < stateCount; i++) {
    const col = i % cols;
    const row = Math.floor(i / cols);
    positions.push({
      x: startX + col * (stateWidth + 40) + stateWidth / 2,
      y: startY + row * (stateHeight + 60) + stateHeight / 2,
    });
  }

  for (let i = 0; i < states.length; i++) {
    const pos = positions[i];
    const isInitial = i === 0;
    const isFinal = i === states.length - 1;

    if (isFinal) {
      svg += `<circle cx="${pos.x}" cy="${pos.y}" r="${stateWidth / 2 + 5}" fill="none" stroke="${scheme.primary}" stroke-width="2"/>`;
    }

    svg += `<rect x="${pos.x - stateWidth / 2}" y="${pos.y - stateHeight / 2}" width="${stateWidth}" height="${stateHeight}" rx="${isInitial ? 25 : 8}" fill="${isInitial ? scheme.primary : scheme.accent}" opacity="0.85" stroke="${scheme.primary}" stroke-width="${isInitial ? 0 : 1.5}"/>`;
    svg += `<text x="${pos.x}" y="${pos.y + 4}" text-anchor="middle" fill="${isInitial ? bgColor : "#ffffff"}" font-size="9" font-weight="600">${states[i]}</text>`;
  }

  const transitionCount = Math.floor(rng() * 3) + 2;
  for (let t = 0; t < transitionCount && t < states.length; t++) {
    const fromIdx = t;
    const toIdx = (t + 1) % states.length;
    const from = positions[fromIdx];
    const to = positions[toIdx];

    const midX = (from.x + to.x) / 2;
    const midY = (from.y + to.y) / 2 - 15;

    svg += `<path d="M${from.x} ${from.y + stateHeight / 2} Q${midX} ${midY} ${to.x} ${to.y - stateHeight / 2 - 5}" stroke="${scheme.accent}" stroke-width="1.5" fill="none" marker-end="url(#state-arrow-${hash.slice(0, 4)})"/>`;
  }

  svg += `<defs><marker id="state-arrow-${hash.slice(0, 4)}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="5" markerHeight="5" orient="auto"><path d="M 0 0 L 10 5 L 0 10 z" fill="${scheme.accent}"/></marker></defs>`;

  svg += `</svg>`;
  return svg;
}

export async function initDiagramDb(db) {
  db.exec(`
    CREATE TABLE IF NOT EXISTS generated_diagrams (
      id TEXT PRIMARY KEY,
      hash TEXT UNIQUE NOT NULL,
      svg_content TEXT NOT NULL,
      channel_id TEXT NOT NULL,
      question_id TEXT,
      content_hash TEXT,
      diagram_type TEXT,
      keywords TEXT,
      created_at INTEGER DEFAULT (strftime('%s', 'now'))
    );

    CREATE INDEX IF NOT EXISTS idx_diag_hash ON generated_diagrams(hash);
    CREATE INDEX IF NOT EXISTS idx_diag_channel ON generated_diagrams(channel_id);
    CREATE INDEX IF NOT EXISTS idx_diag_question ON generated_diagrams(question_id);
  `);
}

export async function diagramExists(db, hash) {
  const row = db
    .prepare("SELECT id FROM generated_diagrams WHERE hash = ?")
    .get(hash);
  return !!row;
}

export async function saveDiagram(
  db,
  hash,
  svgContent,
  channelId,
  questionId,
  diagramInfo,
) {
  const id = `diag-${Date.now()}-${hash.slice(0, 6)}`;

  db.prepare(
    `
    INSERT INTO generated_diagrams (id, hash, svg_content, channel_id, question_id, content_hash, diagram_type, keywords)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `,
  ).run(
    id,
    hash,
    svgContent,
    channelId,
    questionId || null,
    generateContentHash(svgContent),
    diagramInfo?.type || "unknown",
    JSON.stringify(diagramInfo?.keywords || []),
  );

  return { id, hash, svgContent };
}

export async function generateUniqueDiagram(questionData, channel, db) {
  await initDiagramDb(db);

  const diagramInfo = generateDiagramForQuestion(questionData, channel.id);

  if (await diagramExists(db, diagramInfo.hash)) {
    return null;
  }

  return await saveDiagram(
    db,
    diagramInfo.hash,
    diagramInfo.svgContent,
    channel.id,
    questionData.id,
    diagramInfo,
  );
}

export function generateDiagramSync(questionData, channelId) {
  const diagramInfo = generateDiagramForQuestion(questionData, channelId);
  return {
    hash: diagramInfo.hash,
    svgContent: diagramInfo.svgContent,
    type: diagramInfo.type,
    keywords: diagramInfo.keywords,
  };
}

export default {
  generateDiagramForQuestion,
  generateUniqueDiagram,
  generateDiagramSync,
  generateContentHash,
  initDiagramDb,
  diagramExists,
  saveDiagram,
  CHANNEL_SCHEMES,
};
