/**
 * DevPrep Diagram Templates
 *
 * Provides fallback SVG diagrams for content that doesn't have one.
 * Used when AI generation fails to produce a diagram or for retroactively
 * adding diagrams to existing content.
 */

const TEMPLATES = {
  generic: {
    type: "diagram",
    language: "svg",
    filename: "concept-diagram.svg",
    title: "Concept Overview",
    description: "Visual representation of the core concept",
    svgContent: `<svg viewBox="0 0 600 280" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="10" width="580" height="260" rx="8" fill="#1a1b26" stroke="#414868" stroke-width="1.5"/>
  <rect x="40" y="60" width="160" height="80" rx="6" fill="#24283b" stroke="#7aa2f7" stroke-width="2"/>
  <text x="120" y="95" text-anchor="middle" fill="#7aa2f7" font-size="14" font-weight="600">Component A</text>
  <text x="120" y="115" text-anchor="middle" fill="#a9b1d6" font-size="11">Primary function</text>
  <rect x="220" y="60" width="160" height="80" rx="6" fill="#24283b" stroke="#bb9af7" stroke-width="2"/>
  <text x="300" y="95" text-anchor="middle" fill="#bb9af7" font-size="14" font-weight="600">Component B</text>
  <text x="300" y="115" text-anchor="middle" fill="#a9b1d6" font-size="11">Processing unit</text>
  <rect x="400" y="60" width="160" height="80" rx="6" fill="#24283b" stroke="#9ece6a" stroke-width="2"/>
  <text x="480" y="95" text-anchor="middle" fill="#9ece6a" font-size="14" font-weight="600">Component C</text>
  <text x="480" y="115" text-anchor="middle" fill="#a9b1d6" font-size="11">Output handler</text>
  <path d="M 200 100 L 220 100" stroke="#7dcfff" stroke-width="2" fill="none" marker-end="url(#arrow)"/>
  <path d="M 380 100 L 400 100" stroke="#7dcfff" stroke-width="2" fill="none" marker-end="url(#arrow)"/>
  <text x="300" y="200" text-anchor="middle" fill="#e0af68" font-size="12" font-weight="500">Data Flow: A → B → C</text>
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L9,3 z" fill="#7dcfff"/>
    </marker>
  </defs>
</svg>`,
  },
  flow: {
    type: "diagram",
    language: "svg",
    filename: "flow-diagram.svg",
    title: "Process Flow",
    description: "Step-by-step process visualization",
    svgContent: `<svg viewBox="0 0 600 320" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="10" width="580" height="300" rx="8" fill="#1a1b26" stroke="#414868" stroke-width="1.5"/>
  <rect x="200" y="30" width="200" height="50" rx="25" fill="#24283b" stroke="#7aa2f7" stroke-width="2"/>
  <text x="300" y="62" text-anchor="middle" fill="#7aa2f7" font-size="13" font-weight="600">Start</text>
  <path d="M 300 80 L 300 110" stroke="#7dcfff" stroke-width="2" marker-end="url(#arrow2)"/>
  <rect x="150" y="110" width="300" height="50" rx="6" fill="#24283b" stroke="#bb9af7" stroke-width="2"/>
  <text x="300" y="140" text-anchor="middle" fill="#bb9af7" font-size="12">Process Step 1</text>
  <path d="M 300 160 L 300 190" stroke="#7dcfff" stroke-width="2" marker-end="url(#arrow2)"/>
  <rect x="150" y="190" width="300" height="50" rx="6" fill="#24283b" stroke="#9ece6a" stroke-width="2"/>
  <text x="300" y="220" text-anchor="middle" fill="#9ece6a" font-size="12">Process Step 2</text>
  <path d="M 300 240 L 300 270" stroke="#7dcfff" stroke-width="2" marker-end="url(#arrow2)"/>
  <rect x="200" y="270" width="200" height="35" rx="17.5" fill="#24283b" stroke="#e0af68" stroke-width="2"/>
  <text x="300" y="293" text-anchor="middle" fill="#e0af68" font-size="13" font-weight="600">End</text>
  <defs>
    <marker id="arrow2" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto" markerUnits="strokeWidth">
      <path d="M0,0 L0,6 L9,3 z" fill="#7dcfff"/>
    </marker>
  </defs>
</svg>`,
  },
  architecture: {
    type: "diagram",
    language: "svg",
    filename: "architecture-diagram.svg",
    title: "System Architecture",
    description: "High-level system component diagram",
    svgContent: `<svg viewBox="0 0 600 340" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="10" width="580" height="320" rx="8" fill="#1a1b26" stroke="#414868" stroke-width="1.5"/>
  <rect x="40" y="30" width="520" height="40" rx="6" fill="#24283b" stroke="#7aa2f7" stroke-width="2"/>
  <text x="300" y="58" text-anchor="middle" fill="#7aa2f7" font-size="14" font-weight="600">Client Layer</text>
  <rect x="40" y="90" width="160" height="80" rx="6" fill="#24283b" stroke="#bb9af7" stroke-width="2"/>
  <text x="120" y="120" text-anchor="middle" fill="#bb9af7" font-size="12" font-weight="600">Load Balancer</text>
  <text x="120" y="140" text-anchor="middle" fill="#a9b1d6" font-size="10">Distribution</text>
  <rect x="220" y="90" width="160" height="80" rx="6" fill="#24283b" stroke="#bb9af7" stroke-width="2"/>
  <text x="300" y="120" text-anchor="middle" fill="#bb9af7" font-size="12" font-weight="600">API Gateway</text>
  <text x="300" y="140" text-anchor="middle" fill="#a9b1d6" font-size="10">Authentication</text>
  <rect x="400" y="90" width="160" height="80" rx="6" fill="#24283b" stroke="#bb9af7" stroke-width="2"/>
  <text x="480" y="120" text-anchor="middle" fill="#bb9af7" font-size="12" font-weight="600">Cache Layer</text>
  <text x="480" y="140" text-anchor="middle" fill="#a9b1d6" font-size="10">Redis/Memory</text>
  <rect x="40" y="190" width="250" height="60" rx="6" fill="#24283b" stroke="#9ece6a" stroke-width="2"/>
  <text x="165" y="215" text-anchor="middle" fill="#9ece6a" font-size="12" font-weight="600">Service A</text>
  <text x="165" y="235" text-anchor="middle" fill="#a9b1d6" font-size="10">Business Logic</text>
  <rect x="310" y="190" width="250" height="60" rx="6" fill="#24283b" stroke="#9ece6a" stroke-width="2"/>
  <text x="435" y="215" text-anchor="middle" fill="#9ece6a" font-size="12" font-weight="600">Service B</text>
  <text x="435" y="235" text-anchor="middle" fill="#a9b1d6" font-size="10">Data Processing</text>
  <rect x="40" y="270" width="520" height="45" rx="6" fill="#24283b" stroke="#e0af68" stroke-width="2"/>
  <text x="300" y="298" text-anchor="middle" fill="#e0af68" font-size="12" font-weight="600">Database Layer</text>
  <path d="M 200 130 L 220 130" stroke="#7dcfff" stroke-width="1.5" stroke-dasharray="4"/>
  <path d="M 380 130 L 400 130" stroke="#7dcfff" stroke-width="1.5" stroke-dasharray="4"/>
  <path d="M 165 170 L 165 190" stroke="#7dcfff" stroke-width="1.5"/>
  <path d="M 435 170 L 435 190" stroke="#7dcfff" stroke-width="1.5"/>
</svg>`,
  },
  comparison: {
    type: "diagram",
    language: "svg",
    filename: "comparison-diagram.svg",
    title: "Comparison Overview",
    description: "Side-by-side comparison of options",
    svgContent: `<svg viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="10" width="580" height="280" rx="8" fill="#1a1b26" stroke="#414868" stroke-width="1.5"/>
  <rect x="40" y="40" width="240" height="220" rx="6" fill="#24283b" stroke="#7aa2f7" stroke-width="2"/>
  <text x="160" y="70" text-anchor="middle" fill="#7aa2f7" font-size="14" font-weight="600">Option A</text>
  <line x1="50" y1="85" x2="270" y2="85" stroke="#414868" stroke-width="1"/>
  <text x="55" y="105" fill="#a9b1d6" font-size="11">• Feature 1</text>
  <text x="55" y="125" fill="#a9b1d6" font-size="11">• Feature 2</text>
  <text x="55" y="145" fill="#a9b1d6" font-size="11">• Feature 3</text>
  <text x="55" y="165" fill="#9ece6a" font-size="11" font-weight="600">✓ Advantage</text>
  <rect x="40" y="190" width="240" height="50" rx="4" fill="#1f2335"/>
  <text x="160" y="218" text-anchor="middle" fill="#e0af68" font-size="11">Use when: Scenario A</text>
  <rect x="320" y="40" width="240" height="220" rx="6" fill="#24283b" stroke="#bb9af7" stroke-width="2"/>
  <text x="440" y="70" text-anchor="middle" fill="#bb9af7" font-size="14" font-weight="600">Option B</text>
  <line x1="330" y1="85" x2="550" y2="85" stroke="#414868" stroke-width="1"/>
  <text x="335" y="105" fill="#a9b1d6" font-size="11">• Feature 1</text>
  <text x="335" y="125" fill="#a9b1d6" font-size="11">• Feature 2</text>
  <text x="335" y="145" fill="#a9b1d6" font-size="11">• Feature 3</text>
  <text x="335" y="165" fill="#9ece6a" font-size="11" font-weight="600">✓ Advantage</text>
  <rect x="320" y="190" width="240" height="50" rx="4" fill="#1f2335"/>
  <text x="440" y="218" text-anchor="middle" fill="#e0af68" font-size="11">Use when: Scenario B</text>
  <text x="300" y="170" text-anchor="middle" fill="#f7768e" font-size="18" font-weight="700">VS</text>
</svg>`,
  },
  sequence: {
    type: "diagram",
    language: "svg",
    filename: "sequence-diagram.svg",
    title: "Sequence Diagram",
    description: "Interaction flow between components",
    svgContent: `<svg viewBox="0 0 600 320" xmlns="http://www.w3.org/2000/svg">
  <rect x="10" y="10" width="580" height="300" rx="8" fill="#1a1b26" stroke="#414868" stroke-width="1.5"/>
  <rect x="50" y="40" width="100" height="35" rx="4" fill="#24283b" stroke="#7aa2f7" stroke-width="2"/>
  <text x="100" y="63" text-anchor="middle" fill="#7aa2f7" font-size="12">Client</text>
  <line x1="100" y1="75" x2="100" y2="270" stroke="#7aa2f7" stroke-width="2" stroke-dasharray="4"/>
  <rect x="200" y="40" width="100" height="35" rx="4" fill="#24283b" stroke="#bb9af7" stroke-width="2"/>
  <text x="250" y="63" text-anchor="middle" fill="#bb9af7" font-size="12">Server</text>
  <line x1="250" y1="75" x2="250" y2="270" stroke="#bb9af7" stroke-width="2" stroke-dasharray="4"/>
  <rect x="350" y="40" width="100" height="35" rx="4" fill="#24283b" stroke="#9ece6a" stroke-width="2"/>
  <text x="400" y="63" text-anchor="middle" fill="#9ece6a" font-size="12">Database</text>
  <line x1="400" y1="75" x2="400" y2="270" stroke="#9ece6a" stroke-width="2" stroke-dasharray="4"/>
  <rect x="500" y="40" width="80" height="35" rx="4" fill="#24283b" stroke="#e0af68" stroke-width="2"/>
  <text x="540" y="63" text-anchor="middle" fill="#e0af68" font-size="11">Cache</text>
  <line x1="540" y1="75" x2="540" y2="270" stroke="#e0af68" stroke-width="2" stroke-dasharray="4"/>
  <path d="M 105 90 L 245 90 L 245 110 L 105 110" fill="none" stroke="#7dcfff" stroke-width="1.5"/>
  <text x="175" y="105" text-anchor="middle" fill="#7dcfff" font-size="10">Request</text>
  <path d="M 255 130 L 395 130 L 395 150 L 255 150" fill="none" stroke="#7dcfff" stroke-width="1.5"/>
  <text x="325" y="145" text-anchor="middle" fill="#7dcfff" font-size="10">Query</text>
  <path d="M 395 170 L 255 170 L 255 190 L 395 190" fill="none" stroke="#7dcfff" stroke-width="1.5"/>
  <text x="325" y="185" text-anchor="middle" fill="#7dcfff" font-size="10">Result</text>
  <path d="M 255 210 L 535 210 L 535 190 L 255 190" fill="none" stroke="#7dcfff" stroke-width="1.5"/>
  <text x="395" y="205" text-anchor="middle" fill="#7dcfff" font-size="10">Cache?</text>
  <path d="M 255 240 L 105 240 L 105 260" fill="none" stroke="#7dcfff" stroke-width="1.5"/>
  <text x="180" y="255" text-anchor="middle" fill="#7dcfff" font-size="10">Response</text>
</svg>`,
  },
};

export function getTemplate(type = "generic") {
  return TEMPLATES[type] || TEMPLATES.generic;
}

export function getAllTemplates() {
  return TEMPLATES;
}

export function getTemplateForContent(channelId, contentType) {
  const templateMap = {
    devops: ["architecture", "flow"],
    kubernetes: ["architecture", "flow"],
    networking: ["architecture", "flow"],
    "system-design": ["architecture", "comparison", "sequence"],
    "aws-saa": ["architecture", "comparison"],
    "aws-dev": ["architecture", "flow"],
    cka: ["flow", "architecture"],
    terraform: ["architecture", "flow"],
    javascript: ["flow", "sequence"],
    react: ["flow", "sequence"],
    algorithms: ["flow", "architecture"],
  };

  const templates = templateMap[channelId] || ["generic"];
  const selected = templates[Math.floor(Math.random() * templates.length)];
  return TEMPLATES[selected] || TEMPLATES.generic;
}

export function hashDiagram(svgContent) {
  const crypto = require("crypto");
  return crypto
    .createHash("sha256")
    .update(svgContent)
    .digest("hex")
    .slice(0, 16);
}
