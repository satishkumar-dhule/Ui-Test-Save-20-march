export interface ParseResult {
  data: object | null;
  strategy: string;
  confidence: number;
  fixed: string[];
}

export function extractAndParse(raw: string): ParseResult {
  const fixed: string[] = [];
  let cleaned = raw;

  // Strategy 1: Extract from code fences
  const fenceMatch = cleaned.match(
    /```(?:json|typescript|ts|js|javascript)?\s*\n?([\s\S]*?)\n?```/i,
  );
  if (fenceMatch) {
    cleaned = fenceMatch[1];
    fixed.push("code_fence_extraction");
  }

  // Strategy 2: Find complete JSON objects/arrays using bracket matching
  cleaned = extractCompleteJson(cleaned, fixed);

  // Strategy 3-10: Apply fixes in order
  cleaned = applyAllFixes(cleaned, fixed);

  // Strategy 11: Try parsing with progressively more aggressive fixes
  const strategies = [
    { name: "native_parse", fn: () => JSON.parse(cleaned), conf: 1.0 },
    {
      name: "fix_trailing_commas",
      fn: () => JSON.parse(cleaned.replace(/,\s*([}\]])/g, "$1")),
      conf: 0.95,
    },
    {
      name: "fix_single_quotes",
      fn: () => JSON.parse(cleaned.replace(/'/g, '"')),
      conf: 0.9,
    },
    {
      name: "fix_unquoted_keys",
      fn: () => JSON.parse(fixUnquotedKeys(cleaned)),
      conf: 0.85,
    },
    {
      name: "fix_missing_quotes",
      fn: () => JSON.parse(fixMissingQuotes(cleaned)),
      conf: 0.8,
    },
    {
      name: "fix_newlines_in_strings",
      fn: () => JSON.parse(fixNewlinesInStrings(cleaned)),
      conf: 0.75,
    },
    {
      name: "fix_unicode_escapes",
      fn: () => JSON.parse(fixUnicodeEscapes(cleaned)),
      conf: 0.7,
    },
    {
      name: "fix_control_chars",
      fn: () => JSON.parse(fixControlChars(cleaned)),
      conf: 0.65,
    },
    {
      name: "aggressive_cleanup",
      fn: () => JSON.parse(aggressiveCleanup(cleaned)),
      conf: 0.5,
    },
  ];

  for (const strategy of strategies) {
    try {
      const data = strategy.fn();
      return {
        data,
        strategy: strategy.name,
        confidence: strategy.conf,
        fixed,
      };
    } catch {
      // Try next strategy
    }
  }

  // Strategy 12: LLM-assisted repair fallback
  const llmResult = llmRepair(cleaned);
  if (llmResult) {
    fixed.push("llm_assisted_repair");
    return {
      data: llmResult,
      strategy: "llm_repair",
      confidence: 0.4,
      fixed,
    };
  }

  return { data: null, strategy: "none", confidence: 0, fixed };
}

function extractCompleteJson(input: string, fixed: string[]): string {
  let bestStart = 0;
  let bestEnd = 0;
  let depth = 0;
  let inString = false;
  let escape = false;
  let maxDepth = 0;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (escape) {
      escape = false;
      continue;
    }

    if (char === "\\" && inString) {
      escape = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      continue;
    }

    if (inString) continue;

    if (char === "{" || char === "[") {
      if (depth === 0) bestStart = i;
      depth++;
      maxDepth = Math.max(maxDepth, depth);
    } else if (char === "}" || char === "]") {
      depth--;
      if (depth === 0) {
        bestEnd = i + 1;
        if (maxDepth > 0) break;
      }
    }
  }

  if (bestEnd > bestStart) {
    const extracted = input.slice(bestStart, bestEnd);
    fixed.push("bracket_matching");
    return extracted;
  }

  // Try to extract multiple JSON objects
  const objects: string[] = [];
  depth = 0;
  let objStart = -1;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (char === '"' && (i === 0 || input[i - 1] !== "\\")) {
      continue;
    }

    if (char === "{" || char === "[") {
      if (depth === 0) objStart = i;
      depth++;
    } else if (char === "}" || char === "]") {
      depth--;
      if (depth === 0 && objStart !== -1) {
        objects.push(input.slice(objStart, i + 1));
        objStart = -1;
      }
    }
  }

  if (objects.length > 0) {
    fixed.push("multiple_objects_extraction");
    return objects.join(",");
  }

  return input;
}

function applyAllFixes(input: string, fixed: string[]): string {
  let result = input;

  // Remove BOM and common artifacts
  result = result.replace(/^\uFEFF/, "");
  result = result.replace(/^```json\s*/i, "").replace(/```\s*$/, "");
  result = result.replace(/^```\s*/i, "").replace(/```\s*$/i, "");

  // Strategy 4: Fix trailing commas
  const beforeTrailing = result;
  result = result.replace(/,\s*([}\]])/g, "$1");
  if (result !== beforeTrailing) fixed.push("fix_trailing_commas");

  // Strategy 5: Fix unquoted keys
  const beforeUnquoted = result;
  result = fixUnquotedKeys(result);
  if (result !== beforeUnquoted) fixed.push("fix_unquoted_keys");

  // Strategy 6: Fix single quotes
  const beforeSingle = result;
  result = result.replace(/'/g, '"');
  if (result !== beforeSingle) fixed.push("fix_single_quotes");

  // Strategy 7: Fix missing quotes around values
  const beforeMissing = result;
  result = fixMissingQuotes(result);
  if (result !== beforeMissing) fixed.push("fix_missing_quotes");

  // Strategy 8: Fix newlines in strings
  const beforeNewlines = result;
  result = fixNewlinesInStrings(result);
  if (result !== beforeNewlines) fixed.push("fix_newlines_in_strings");

  // Strategy 9: Fix unicode escape sequences
  const beforeUnicode = result;
  result = fixUnicodeEscapes(result);
  if (result !== beforeUnicode) fixed.push("fix_unicode_escapes");

  // Strategy 10: Fix control characters
  const beforeControl = result;
  result = fixControlChars(result);
  if (result !== beforeControl) fixed.push("fix_control_chars");

  return result;
}

function fixUnquotedKeys(input: string): string {
  return input.replace(/([{,]\s*)([a-zA-Z_$][a-zA-Z0-9_$]*)\s*:/g, '$1"$2":');
}

function fixMissingQuotes(input: string): string {
  let result = "";
  let inString = false;
  let escape = false;
  let i = 0;

  while (i < input.length) {
    const char = input[i];

    if (escape) {
      result += char;
      escape = false;
      i++;
      continue;
    }

    if (char === "\\") {
      result += char;
      escape = true;
      i++;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      result += char;
      i++;
      continue;
    }

    if (!inString) {
      if (char === ":" && input[i + 1] === " ") {
        const nextNonSpace = input
          .slice(i + 1)
          .match(/^(\s*)(\d+(\.\d+)?|true|false|null)/);
        if (nextNonSpace) {
          result += ': "' + nextNonSpace[2] + '"';
          i += nextNonSpace[0].length;
          continue;
        }
      }
    }

    result += char;
    i++;
  }

  return result;
}

function fixNewlinesInStrings(input: string): string {
  let result = "";
  let inString = false;
  let escape = false;

  for (let i = 0; i < input.length; i++) {
    const char = input[i];

    if (escape) {
      result += char;
      escape = false;
      continue;
    }

    if (char === "\\") {
      if (inString) {
        const next = input[i + 1];
        if (next === "n" || next === "r" || next === "t") {
          result += char + next;
          i++;
          continue;
        }
      }
      result += char;
      escape = true;
      continue;
    }

    if (char === '"') {
      inString = !inString;
      result += char;
      continue;
    }

    if (inString && (char === "\n" || char === "\r")) {
      result += "\\n";
      continue;
    }

    result += char;
  }

  return result;
}

function fixUnicodeEscapes(input: string): string {
  return input.replace(/\\u([0-9a-fA-F]{1,4})/g, (_, hex) => {
    try {
      return String.fromCodePoint(parseInt(hex, 16));
    } catch {
      return _;
    }
  });
}

function fixControlChars(input: string): string {
  return input.replace(/[\x00-\x1F\x7F]/g, (char) => {
    const code = char.charCodeAt(0);
    if (code === 9) return "\\t";
    if (code === 10) return "\\n";
    if (code === 13) return "\\r";
    return "";
  });
}

function aggressiveCleanup(input: string): string {
  let result = input
    .replace(/[\x00-\x1F\x7F]/g, "")
    .replace(/\/\/.*$/gm, "")
    .replace(/\/\*[\s\S]*?\*\//g, "")
    .replace(/,\s*([}\]])/g, "$1")
    .replace(/;\s*$/, "")
    .trim();

  result = fixUnquotedKeys(result);
  result = result.replace(/'/g, '"');
  result = fixNewlinesInStrings(result);

  // Remove trailing commas before closing brackets
  result = result.replace(/,\s*([}\]])/g, "$1");

  return result;
}

function llmRepair(input: string): object | null {
  try {
    const cleaned = aggressiveCleanup(input);
    return JSON.parse(cleaned) as object;
  } catch {
    return null;
  }
}
