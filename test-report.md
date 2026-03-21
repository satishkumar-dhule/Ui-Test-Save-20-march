# DevPrep Diagram Issue - QA Test Report

## Executive Summary

**Status**: CRITICAL ISSUE FOUND  
**Date**: 2026-03-21  
**Test Suite**: `/home/runner/workspace/test-diagrams.mjs`

---

## Verification Results

### Database Analysis

- **Database**: `/home/runner/workspace/data/devprep.db` (8MB)
- **Total Records**: 1,371
- **Records with Diagrams**: 75
- **Unique Diagrams**: 1
- **Duplicate Diagrams**: 74 (all 75 are identical)

### Critical Finding: MASS DUPLICATE DIAGRAM BUG

**All 75 questions have the EXACT same generic SVG diagram:**

```svg
<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <!-- Generic microservices diagram -->
  <rect ... /> <!-- Client/App -->
  <rect ... /> <!-- Service A -->
  <rect ... /> <!-- Service B -->
  <rect ... /> <!-- Service C -->
  <rect ... /> <!-- Database/Cache -->
</svg>
```

**This diagram:**

- Has no channel-specific content
- Uses generic "Service A/B/C" labels
- Is identical across ALL channels (algorithms, aws-saa, javascript, devops, kubernetes, etc.)
- Provides zero educational value for the specific topic

---

## Code Verification

| File                                                        | Status      | Notes                   |
| ----------------------------------------------------------- | ----------- | ----------------------- |
| `/home/runner/workspace/content-gen/generate-diagrams.mjs`  | **MISSING** | Required file not found |
| `/home/runner/workspace/content-gen/src/diagram-engine.mjs` | **MISSING** | Required file not found |

**Note**: Diagram generation relies on AI prompts in `generate-content.mjs` (lines 358-390), which have not produced unique diagrams.

---

## Duplicate Diagram Analysis

### Affected Records (75 total)

All records share the same SVG hash. Example IDs:

- `que-1774087810938-4059` [algorithms]
- `que-1774087810936-6a40` [angular]
- `que-1774087810938-8783` [kubernetes]
- `que-1774087810938-6652` [linux]
- `que-1774087810940-ed36` [devops]
- ... (71 more)

### Root Cause

Questions were generated in a batch (timestamp ~1774087810) and the AI model returned the same generic "microservices architecture" diagram for ALL of them, regardless of channel topic.

---

## Test Results

```json
{
  "duplicateCount": 1,
  "uniqueDiagrams": 1,
  "testsPassed": false,
  "issues": [
    "CRITICAL: All 75 diagrams are identical - duplicate group contains 75 records",
    "Missing required file: /home/runner/workspace/content-gen/generate-diagrams.mjs",
    "Missing required file: /home/runner/workspace/content-gen/src/diagram-engine.mjs",
    "Diagrams are not channel-specific (all show generic microservices architecture)"
  ]
}
```

---

## Required Fixes

### 1. Create Dedicated Diagram Engine (`src/diagram-engine.mjs`)

Must implement:

- Channel-specific SVG generation with unique visual styles
- Topic-aware diagram templates
- Color schemes per technology/domain
- Content-specific labels and icons
- Hash-based uniqueness verification before insertion

### 2. Create Diagram Generator (`generate-diagrams.mjs`)

Must implement:

- Integration with content generation pipeline
- Per-record diagram generation with topic context
- Deduplication check against existing diagrams
- Channel-specific styling injection

### 3. Fix Existing Duplicate Diagrams

Options:

- **Option A**: Delete all 75 duplicate diagrams
- **Option B**: Regenerate diagrams using new engine
- **Option C**: Update diagrams with channel-specific content

---

## Recommended Next Steps

1. **Immediate**: Create `diagram-engine.mjs` with channel-aware SVG generation
2. **Immediate**: Create `generate-diagrams.mjs` to integrate with pipeline
3. **Short-term**: Run new engine on existing 75 questions to replace duplicates
4. **Validation**: Re-run `/home/runner/workspace/test-diagrams.mjs` to verify fixes

---

## Test Execution

```bash
# Run tests
bun /home/runner/workspace/test-diagrams.mjs

# Check database directly
bun -e '
import { Database } from "bun:sqlite";
const db = new Database("/home/runner/workspace/data/devprep.db");
const dups = db.prepare("SELECT COUNT(DISTINCT substr(data, instr(data, \"<svg\"), 500)) as unique_svgs FROM generated_content WHERE data LIKE \"%<svg%\"").get();
console.log("Unique SVGs:", dups.unique_svgs);
'
```
