# DevPrep — Single-Shot Replit Agent Prompt

Copy everything between the triple-backtick block below and paste it as your Replit Agent prompt:

---

````
Build a full-stack tech interview prep web app called **DevPrep** on Replit using a pnpm monorepo. The project needs two artifacts: a React + Vite frontend (at path "/") and an Express API server (at path "/api"). Use TypeScript throughout. Use Tailwind CSS v4 for styling.

---

## OVERALL CONCEPT

DevPrep is a GitHub-inspired study hub. Users pick learning "channels" (JavaScript, React, Algorithms, DevOps, Kubernetes, Networking, System Design, AWS SAA, AWS Developer, CKA, Terraform) in an onboarding modal. Only selected channels are visible. The app has 5 study sections. All state persists in localStorage — no login required. A daily GitHub Actions workflow uses opencode-ai CLI to generate new content and saves it to SQLite; the API server reads from that SQLite file and the frontend merges generated + static data at runtime.

---

## VISUAL DESIGN

GitHub-inspired dark/light theme:
- Dark bg: #0d1117, secondary: #010409, border: #30363d, text: #c9d1d9, muted: #8b949e
- Light bg: #ffffff, secondary: #f6f8fa, border: #d0d7de, text: #24292f, muted: #57606a
- Accent blue: #388bfd, green: #56d364, orange: #ffa657, yellow: #e3b341, purple: #d2a8ff, red: #ff7b72
- Font: system-ui, monospace for code blocks
- App is full-viewport height (body overflow: hidden), no page scroll
- Header 52px, channel bar 44px, section tabs 44px, rest is scrollable content area
- Toggle between dark/light with a Sun/Moon icon button in the header
- Use shadcn/ui components (badge, button, card, tabs, progress, dialog) styled to match the GitHub theme

---

## CHANNEL SYSTEM

Define these 11 channels in `src/data/channels.ts`:

```ts
type Channel = {
  id: string;          // e.g. "javascript"
  name: string;        // e.g. "JavaScript"
  shortName: string;   // e.g. "JS"
  emoji: string;       // e.g. "⚡"
  color: string;       // hex accent color
  type: "tech" | "cert";
  certCode?: string;   // e.g. "SAA-C03" for certs
  tagFilter: string[]; // tags used to filter questions/flashcards
}
````

Channels:

- javascript | JavaScript | JS | ⚡ | #f7df1e | tech | tags: javascript, async, closures, prototype, types, generators
- react | React | React | ⚛️ | #61dafb | tech | tags: react, hooks, state, performance
- algorithms | Algorithms | Algo | 🧮 | #56d364 | tech | tags: algorithms, sorting, big-o, dynamic-programming, trees, graphs
- devops | DevOps | DevOps| 🐳 | #2496ed | tech | tags: devops, docker, ci-cd, linux
- kubernetes | Kubernetes | K8s | ☸️ | #326de6 | tech | tags: kubernetes, k8s, containers, orchestration
- networking | Networking | Net | 🌐 | #0ea5e9 | tech | tags: networking, http, rest, dns
- system-design | System Design | Sys | 🏗️ | #a855f7 | tech | tags: cs, distributed, concurrency, memory, oop, data-structures
- aws-saa | AWS Solutions Architect | AWS | ☁️ | #ff9900 | cert | certCode: SAA-C03 | tags: aws, cloud
- aws-dev | AWS Developer | AWS Dev | ☁️ | #ff9900 | cert | certCode: DVA-C02 | tags: aws, cloud, serverless
- cka | CKA | CKA | ☸️ | #326de6 | cert | certCode: CKA | tags: kubernetes, k8s
- terraform | Terraform | TF | 🏔️ | #7b42bc | cert | certCode: TA-003 | tags: terraform, iac, devops

---

## 5 STUDY SECTIONS

### 1. Q&A Page (`src/pages/QAPage.tsx`)

Left sidebar (280px) lists questions filtered by current channel's tagFilter. Each row shows number, title (truncated), tags as colored badges, vote count, and difficulty dot. Clicking a row shows the full answer in the right pane.

Answer pane renders "sections" array:

- `type: "short"` → render markdown (bold, inline code, bullets)
- `type: "code"` → syntax-highlighted code block with filename tab, copy button, language badge
- `type: "diagram"` → render `svgContent` directly as inline SVG inside a dark card with title
- `type: "eli5"` → render in a yellow/amber card with a 🧠 icon labeled "ELI5"
- `type: "related"` → render a grid of related topic cards with tag badge

Seed 3–5 questions per channel in `src/data/questions.ts`:

```ts
type Question = {
  id: string;
  number: number;
  title: string;
  tags: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  votes: number;
  views: string;
  askedBy: string;
  askedAt: string;
  sections: AnswerSection[];
};
```

Include at minimum these seed questions with real, educational content:

1. "How does the JavaScript Event Loop work?" (javascript tag) — include a real SVG diagram showing Call Stack → Web APIs → Callback Queue → Event Loop flow, plus ELI5
2. "What is the difference between useMemo and useCallback?" (react, hooks tags)
3. "Explain Big-O notation with examples" (algorithms, big-o tags)
4. "What is a Docker layer and how does caching work?" (devops, docker tags)
5. "What is a Kubernetes Pod vs Deployment?" (kubernetes, k8s tags)
6. "Explain TCP vs UDP" (networking tags)
7. "What is the CAP Theorem?" (cs, distributed tags)
8. "What is AWS S3 lifecycle management?" (aws, cloud tags)

### 2. Flashcards Page (`src/pages/FlashcardsPage.tsx`)

Category filter pills at the top. Below: a grid of flip cards (CSS 3D flip on click). Front shows question, back shows answer + optional code snippet. Progress bar at top shows how many cards have been "flipped" in this session. "Shuffle" button randomizes order. "Reset" button unflips all cards.

Seed 3 flashcards per channel in `src/data/flashcards.ts`:

```ts
type Flashcard = {
  id: string;
  front: string;
  back: string;
  hint?: string;
  tags: string[];
  difficulty: "beginner" | "intermediate" | "advanced";
  category: string;
  codeExample?: { language: string; code: string };
};
```

### 3. Mock Exam Page (`src/pages/MockExamPage.tsx`)

Timed MCQ exam. Shows: question count badge, countdown timer (configurable 10/20/30 min), progress bar.

- During exam: one question per screen, 4 choices (A/B/C/D), click to select, "Next" button
- After exam: score screen with %, pass/fail badge, per-question review showing correct vs chosen answer with explanation
- "Retake" button resets the exam

Seed 4–6 exam questions per cert channel in `src/data/exam.ts`:

```ts
type ExamQuestion = {
  id: string;
  channelId: string;
  domain: string;
  question: string;
  choices: { id: "A" | "B" | "C" | "D"; text: string }[];
  correct: "A" | "B" | "C" | "D";
  explanation: string;
  difficulty: "easy" | "medium" | "hard";
};
```

### 4. Voice Practice Page (`src/pages/VoicePracticePage.tsx`)

Interview-style voice recording practice. Shows a prompt card with the question, time limit, domain badge, and key points bullets the answer should cover.

Features:

- "Start Recording" button uses `navigator.mediaDevices.getUserMedia` for audio capture
- Shows live timer counting up while recording
- "Stop" saves the recording (use URL.createObjectURL for playback)
- Audio playback control (play/pause) for the recorded answer
- Self-rating: 5-star rating after listening
- "Next Prompt" shuffles to another prompt
- Key points shown after recording so user can self-check

Seed 3 voice prompts per channel in `src/data/voicePractice.ts`:

```ts
type VoicePrompt = {
  id: string;
  channelId: string;
  prompt: string;
  type: "technical" | "behavioral" | "scenario" | "explain";
  timeLimit: number; // seconds
  difficulty: "beginner" | "intermediate" | "advanced";
  domain: string;
  keyPoints: string[];
  followUp?: string;
};
```

### 5. Coding Page (`src/pages/CodingPage.tsx`)

Split-pane layout: left pane = challenge description (resizable, default 40%), right pane = code editor + output.

Left pane tabs: "Description" | "Approach" | "Complexity" | "ELI5"

- Description: problem statement, constraints, examples (input/output tables)
- Approach: step-by-step markdown
- Complexity: time/space with explanation
- ELI5: simple analogy

Right pane:

- Language switcher: JavaScript / TypeScript / Python (tabs)
- Code editor: `<textarea>` with monospace font, tab-key support, line numbers via CSS counter
- Action bar: "Run Tests" button, "Hint" button (reveals progressive hints one at a time), "Show Solution" toggle
- Output panel below editor: shows test results as pass/fail rows with actual vs expected values
- Test runner: for JavaScript/TypeScript use `new Function()` to evaluate code and run test cases; for Python show a link to repl.it

Challenge list sidebar (left side, 240px): lists challenges grouped by difficulty (Easy/Medium/Hard). Clicking loads the challenge.

Seed 9 coding challenges in `src/data/coding.ts`:

```ts
type CodingChallenge = {
  id: string;
  channelId: string;
  title: string;
  slug: string;
  difficulty: "easy" | "medium" | "hard";
  tags: string[];
  category: string;
  timeEstimate: number; // minutes
  description: string;
  constraints: string[];
  examples: { input: string; output: string; explanation?: string }[];
  starterCode: { javascript: string; typescript: string; python: string };
  solution: { javascript: string; typescript: string; python: string };
  hints: string[];
  testCases: { input: string; expected: string; description: string }[];
  eli5: string;
  approach: string;
  complexity: { time: string; space: string; explanation: string };
  relatedConcepts: string[];
};
```

Include these 9 challenges with complete, correct code:

1. JavaScript — "Flatten Nested Array" (easy)
2. JavaScript — "Debounce Function" (medium)
3. JavaScript — "Deep Clone Object" (medium)
4. Algorithms — "Two Sum" (easy)
5. Algorithms — "Valid Parentheses" (easy)
6. Algorithms — "Merge Two Sorted Lists" (medium)
7. React — "useLocalStorage Hook" (medium)
8. System Design — "LRU Cache" (hard)
9. Algorithms — "Binary Search" (easy)

---

## APP SHELL (`src/App.tsx`)

Header bar:

- Left: GitHub octocat SVG logo + "DevPrep" text + "/" separator + current channel name + cert badge
- Right: theme toggle (Sun/Moon icon)

Channel bar (below header):

- Horizontal scrollable tabs with TECH / CERTS section labels
- Each tab: emoji + shortName, colored bottom border when active
- "+ Edit" button (dashed border) re-opens onboarding modal

Section tabs:

- 📖 Q&A | 🃏 Flashcards | 💻 Coding | 📝 Mock Exam | 🎤 Voice
- Active tab has colored bottom border and shows item count badge
- Auto-switch section if the new channel has 0 items in the current section

localStorage persistence (prefix "devprep:"):

- `devprep:selectedIds` — JSON array of selected channel IDs
- `devprep:channelId` — currently active channel
- `devprep:theme` — "dark" | "light"
- `devprep:section` — "qa" | "flashcards" | "coding" | "exam" | "voice"
- `devprep:generated-content` — cached API response (expire after 2 min, skip cache if empty)

---

## ONBOARDING MODAL (`src/components/OnboardingModal.tsx`)

Shows on first load (when no selectedIds in localStorage). Full-screen overlay with centered card.

- Header: DevPrep logo + "Welcome to DevPrep" + subtitle
- Two sections: "TECH TOPICS" and "CERTIFICATIONS" (each as a grid)
- Each channel card: emoji icon + name + short description, checkbox in corner, highlighted when selected
- Footer: "X tracks selected" count + "Start Learning →" button (disabled if 0 selected)
- "At least 1 track must be selected" validation

---

## API SERVER (`artifacts/api-server`)

Express 5 server on port 8080, served at path "/api".

Install `better-sqlite3` and `@types/better-sqlite3`.

Add `better-sqlite3` to the `onlyBuiltDependencies` list in `pnpm-workspace.yaml`.

Create `src/db/sqlite.ts`:

- Opens `data/devprep.db` (relative to workspace root, create if missing)
- WAL mode, creates table:
  ```sql
  CREATE TABLE IF NOT EXISTS generated_content (
    id TEXT PRIMARY KEY,
    channel_id TEXT NOT NULL,
    content_type TEXT NOT NULL,  -- question | flashcard | exam | voice | coding
    data TEXT NOT NULL,          -- JSON string of the full item
    created_at INTEGER DEFAULT (strftime('%s', 'now'))
  );
  ```
- Singleton connection (cached in module scope)

Routes (all under `/api`):

- `GET /api/healthz` → `{ status: "ok" }`
- `GET /api/content` → all generated items grouped by type: `{ ok: true, data: { question: [...], flashcard: [...], exam: [...], voice: [...], coding: [...] }, total: N }`
- `GET /api/content/:type` → items of that type, optional `?channelId=` filter
- `GET /api/content/stats` → counts per type per channel

---

## FRONTEND HOOK (`src/hooks/useGeneratedContent.ts`)

```ts
// Fetches /api/content, caches in localStorage for 2 minutes
// Only caches if response has actual items (never caches empty {})
// hasContent(data) = Object.values(data).some(arr => arr.length > 0)
// On load: if valid non-empty cache exists, use it; else fetch API
// Exposes: { generated, loading, error, refresh }
// refresh() clears cache and re-fetches
```

In `App.tsx`, merge static + generated data with deduplication by id:

```ts
const allQuestions = useMemo(() => {
  const gen = generated.question ?? [];
  const existingIds = new Set(staticQuestions.map((q) => q.id));
  return [...staticQuestions, ...gen.filter((q) => !existingIds.has(q.id))];
}, [generated.question]);
// Same pattern for flashcards, exam, voice, coding
```

---

## CONTENT GENERATOR (`content-gen/` directory — NOT part of the pnpm monorepo)

Create `content-gen/` as a standalone Node.js ESM project (NOT in pnpm-workspace.yaml):

`content-gen/package.json`:

```json
{
  "name": "devprep-content-generator",
  "type": "module",
  "private": true,
  "scripts": {
    "generate": "node generate-content.mjs"
  },
  "dependencies": {
    "better-sqlite3": "^12.8.0",
    "opencode-ai": "^1.2.27"
  }
}
```

`content-gen/generate-content.mjs`:

The script generates study content using the opencode-ai CLI:

1. Environment variables:
   - `CONTENT_TYPE`: "auto" (default) | "all" | "question" | "flashcard" | "exam" | "voice" | "coding"
   - `TARGET_CHANNEL`: channel ID, or blank for auto-detect (lowest count channel)
   - `COUNT`: items per type (default 1)
   - In "auto" mode: generates 1 item per type for the lowest-count channel (ignores COUNT)

2. Opens `../data/devprep.db` with better-sqlite3 (createRequire for ESM compat), creates table if missing

3. For each content type, queries DB to find the channel with the fewest items below threshold (5)

4. Calls opencode CLI via `spawn()`:

   ```js
   const child = spawn(binPath, ["run", prompt], {
     stdio: ["ignore", "pipe", "pipe"],
   });
   // collect stdout, resolve on close code 0
   ```

   The `binPath` resolves `node_modules/.bin/opencode` relative to content-gen dir.

5. JSON extraction from opencode output (try multiple strategies):
   - Find largest JSON code fence in output
   - Walk braces with string-aware parser to find outermost `{ ... }`

6. JSON parsing with fallbacks:
   - Direct JSON.parse
   - Strip trailing commas then parse
   - Escape literal newlines then parse
   - Trim to last `}` then parse

7. Saves valid parsed JSON to SQLite via INSERT OR REPLACE

8. Prompts for each type are detailed templates with placeholder comments instructing the LLM to fill in realistic, educational content specific to the channel. Each prompt ends with a json code fence template showing the exact schema.

---

## GITHUB ACTIONS (`.github/workflows/generate-content.yml`)

```yaml
name: Generate DevPrep Content
on:
  schedule:
    - cron: "0 3 * * *" # daily 3AM UTC
  workflow_dispatch:
    inputs:
      channel:
        { description: "Channel ID (blank=auto)", required: false, default: "" }
      content_type:
        {
          type: choice,
          options: [auto, question, flashcard, exam, voice, coding],
          default: auto,
        }
      count: { description: "Items to generate", default: "1" }
permissions:
  contents: write
jobs:
  generate:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: actions/setup-node@v4
        with:
          {
            node-version: "20",
            cache: "npm",
            cache-dependency-path: "content-gen/package.json",
          }
      - run: npm install
        working-directory: content-gen
      - run: node generate-content.mjs
        working-directory: content-gen
        env:
          TARGET_CHANNEL: ${{ github.event.inputs.channel || '' }}
          CONTENT_TYPE: ${{ github.event.inputs.content_type || 'auto' }}
          COUNT: ${{ github.event.inputs.count || '1' }}
          ANTHROPIC_API_KEY: ${{ secrets.ANTHROPIC_API_KEY }}
          OPENAI_API_KEY: ${{ secrets.OPENAI_API_KEY }}
      - name: Commit SQLite DB
        run: |
          git config user.name "DevPrep Bot"
          git config user.email "devprep-bot@noreply.github.com"
          git add data/devprep.db
          git diff --staged --quiet || git commit -m "chore: auto-generate content [skip ci]" && git push
```

---

## FILE STRUCTURE

```
workspace/
├── artifacts/
│   ├── api-server/
│   │   ├── src/
│   │   │   ├── index.ts
│   │   │   ├── app.ts
│   │   │   ├── db/sqlite.ts
│   │   │   └── routes/
│   │   │       ├── index.ts
│   │   │       ├── health.ts
│   │   │       └── content.ts
│   │   └── package.json
│   └── devprep/
│       ├── src/
│       │   ├── App.tsx
│       │   ├── main.tsx
│       │   ├── index.css
│       │   ├── data/
│       │   │   ├── channels.ts
│       │   │   ├── questions.ts
│       │   │   ├── flashcards.ts
│       │   │   ├── exam.ts
│       │   │   ├── voicePractice.ts
│       │   │   └── coding.ts
│       │   ├── pages/
│       │   │   ├── QAPage.tsx
│       │   │   ├── FlashcardsPage.tsx
│       │   │   ├── MockExamPage.tsx
│       │   │   ├── VoicePracticePage.tsx
│       │   │   └── CodingPage.tsx
│       │   ├── components/
│       │   │   └── OnboardingModal.tsx
│       │   └── hooks/
│       │       └── useGeneratedContent.ts
│       └── package.json
├── content-gen/             # standalone, NOT in pnpm workspace
│   ├── generate-content.mjs
│   ├── package.json
│   └── .gitignore           # node_modules/
├── data/
│   └── devprep.db           # SQLite — tracked by git for CI commits
├── .github/workflows/
│   └── generate-content.yml
└── .gitignore               # add: data/*.db-shm, data/*.db-wal
```

---

## QUALITY REQUIREMENTS

- All seed data must be real, accurate, educational content — no lorem ipsum or placeholders
- The Event Loop question must include a genuine SVG diagram (dark background, labeled arrows)
- All 9 coding challenges must have working, tested JavaScript solutions
- The app must be usable with only static seed data (API fetch failures are silent)
- TypeScript strict mode, no `any` in component props (use proper interfaces)
- The coding test runner must correctly evaluate flatten, debounce, two-sum, binary-search challenges
- Channel selection persists across page refreshes with no flash of wrong content
- Theme preference persists and is applied before first paint (set class in useEffect at mount)
- The voice recorder must handle browsers that don't support getUserMedia gracefully (show a warning)
- CSS flip animation for flashcards must be smooth (use transform-style: preserve-3d, backface-visibility: hidden)

```

```
