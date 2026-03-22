# DevPrep — Content Standards

> Authoritative reference for every content entity in the platform.
> All contributors and AI-generated content must conform to these standards.
> Modelled on the editorial bar of LeetCode, Educative, ByteByteGo, Tutorials Dojo, Exponent, and KillerCoda.

---

## Table of Contents

1. [Universal Principles](#1-universal-principles)
2. [Difficulty Calibration](#2-difficulty-calibration)
3. [Tagging Standards](#3-tagging-standards)
4. [Q&A Questions](#4-qa-questions)
5. [Flashcards](#5-flashcards)
6. [Coding Challenges](#6-coding-challenges)
7. [Mock Exam Questions](#7-mock-exam-questions)
8. [Voice Practice Prompts](#8-voice-practice-prompts)
9. [Channel Coverage Targets](#9-channel-coverage-targets)
10. [Anti-Patterns](#10-anti-patterns)
11. [Revision Checklist](#11-revision-checklist)

---

## 1. Universal Principles

These rules apply to every entity across every channel.

| Principle | Rule |
|---|---|
| **Accuracy** | Every technical claim must be verifiable against official documentation. No guesses. |
| **Currency** | Reference the current stable version of the technology. Flag deprecated APIs explicitly. |
| **Precision** | Prefer specific nouns over vague ones. "The call stack" not "the JavaScript thing". |
| **Brevity** | Remove every word that doesn't add meaning. No padding, no filler, no "great question!". |
| **Actionability** | A candidate should be able to use the knowledge in an interview within 24 hours of reading it. |
| **Neutrality** | No opinion on tooling wars (e.g. "React vs Vue is subjective"). State trade-offs, not verdicts. |
| **Tone** | Expert peer talking to a smart colleague. Never condescending. Never over-simplified. |
| **Code style** | All code must be syntactically correct and runnable. No pseudo-code unless explicitly labelled. |
| **Markdown** | Use `**bold**` for key terms on first mention, `` `backtick` `` for inline code, no emoji in body text. |

---

## 2. Difficulty Calibration

DevPrep uses **two parallel difficulty taxonomies** depending on channel type. Each entity's TypeScript interface declares which taxonomy applies. The taxonomies are intentionally kept separate — do not mix terms across channel types (e.g. do not label an AWS-SAA Q&A as "intermediate").

### Taxonomy A — Tech Channels
Applies to: Q&A, Flashcards, Voice Practice on **JavaScript, TypeScript, React, Algorithms, System Design, DevOps, Networking**

```typescript
type DifficultyTech = 'beginner' | 'intermediate' | 'advanced'
```

| Level | Definition | Experience signal | Example |
|---|---|---|---|
| `beginner` | Covered in any intro tutorial | 0–1 yr | `typeof`, `var` vs `let`, what is a Promise, `useState` basics |
| `intermediate` | Requires applied understanding | 2–4 yr | Event loop microtask ordering, closure-based module pattern, React reconciliation |
| `advanced` | Deep internals or senior-level design | 5+ yr | V8 hidden classes, custom scheduler, concurrent rendering, distributed consensus |

### Taxonomy B — Certification Channels
Applies to: Q&A, Flashcards, Mock Exam, Voice Practice on **AWS-SAA, AWS-DEV, CKA, Terraform**

```typescript
type DifficultyExam = 'easy' | 'medium' | 'hard'
```

| Level | Definition | Exam alignment | Example |
|---|---|---|---|
| `easy` | Single-service, single-concept; directly stated in official docs | Direct recall | What is an Internet Gateway? RDS Multi-AZ vs Read Replica |
| `medium` | Combines two or more concepts; selects among similar services | Applied knowledge | S3 lifecycle vs Intelligent-Tiering; ALB vs NLB for a specific traffic pattern |
| `hard` | Multi-constraint scenario; requires eliminating plausible distractors | Scenario analysis | RPO/RTO trade-offs between DR strategies; VPC peering vs Transit Gateway at scale |

### Exception — Coding Challenges use Taxonomy B universally
Coding challenges follow the **LeetCode/InterviewBit standard** of Easy / Medium / Hard on **all channels**, including tech channels. This is an intentional override: the problem-solving difficulty of an algorithm is not the same dimension as the career-seniority of a conceptual question.

```typescript
// Coding challenges always use DifficultyExam, regardless of channel type
type CodingDifficulty = 'easy' | 'medium' | 'hard'
```

This means a JavaScript channel contains both:
- Q&A / Flashcards using `DifficultyTech` (`beginner` / `intermediate` / `advanced`)
- Coding Challenges using `CodingDifficulty` (`easy` / `medium` / `hard`)

### Mix targets per channel per content type

| Content Type | First level (Beginner / Easy) | Second level (Intermediate / Medium) | Third level (Advanced / Hard) |
|---|---|---|---|
| Q&A | 25% | 50% | 25% |
| Flashcards | 35% | 45% | 20% |
| Coding | 25% | 50% | 25% |
| Mock Exam | 30% | 50% | 20% |
| Voice | 20% | 50% | 30% |

---

## 3. Tagging Standards

Tags are used for filtering, search, and coverage tracking.

- Use **kebab-case**: `event-loop`, `closure`, `multi-az`, not `EventLoop` or `multi az`
- Maximum **5 tags** per entity
- First tag must always be the **channel slug** (e.g. `javascript`, `aws-saa`, `cka`)
- Subsequent tags are **concept tags** drawn from the channel's canonical concept list
- Never use generic tags like `important`, `review`, `misc`
- Never duplicate the difficulty as a tag

### Approved concept tags by channel (non-exhaustive)

**JavaScript:** `closures`, `event-loop`, `promises`, `async-await`, `prototypes`, `hoisting`, `this-binding`, `generators`, `modules`, `destructuring`, `types`, `scope`

**TypeScript:** `types`, `generics`, `interfaces`, `enums`, `utility-types`, `type-guards`, `decorators`, `inference`, `mapped-types`, `narrowing`, `modules`, `strict-mode`

**React:** `hooks`, `state`, `context`, `reconciliation`, `performance`, `lifecycle`, `refs`, `suspense`, `server-components`, `patterns`

**Algorithms:** `arrays`, `strings`, `trees`, `graphs`, `dynamic-programming`, `sorting`, `binary-search`, `heaps`, `sliding-window`, `two-pointers`, `recursion`

**System Design:** `scalability`, `availability`, `consistency`, `caching`, `load-balancing`, `databases`, `message-queues`, `cdn`, `rate-limiting`, `sharding`, `replication`, `api-design`, `microservices`, `cap-theorem`

**DevOps:** `ci-cd`, `containers`, `docker`, `kubernetes`, `monitoring`, `logging`, `infrastructure-as-code`, `git`, `pipelines`, `secrets-management`, `blue-green`, `canary`, `sre`

**Terraform:** `providers`, `resources`, `modules`, `state`, `workspaces`, `variables`, `outputs`, `data-sources`, `lifecycle`, `remote-backend`, `plan-apply`, `import`, `drift`

**Networking:** `tcp-ip`, `dns`, `http`, `tls`, `load-balancing`, `firewalls`, `osi-model`, `subnets`, `routing`, `nat`, `vpn`, `cdn`

**AWS-SAA:** `iam`, `ec2`, `s3`, `rds`, `vpc`, `lambda`, `cloudfront`, `elb`, `auto-scaling`, `route53`, `dynamodb`, `efs`, `sqs-sns`, `disaster-recovery`, `security`

**CKA:** `pods`, `deployments`, `services`, `networking`, `storage`, `rbac`, `cluster-maintenance`, `scheduling`, `troubleshooting`, `etcd`

---

## 4. Q&A Questions

### TypeScript Interface

```typescript
// AnswerSection is a discriminated union — each `type` value unlocks different fields.
// The `short` section is the only required section; all others are optional but ordered.
type AnswerSection =
  | { type: 'short'; content: string }
  // content: Markdown string, 80–250 words
  | { type: 'code'; language: string; content: string; filename?: string }
  // language: must match channel primary language; content: ≤ 35 lines runnable code
  | { type: 'diagram'; title: string; description: string; svgContent: string }
  // svgContent: inline SVG string, dark-mode palette, viewBox 500×300 / 500×400 / 700×300
  | { type: 'eli5'; content: string }
  // content: plain-English analogy only, 30–80 words, no technical terms
  | { type: 'related'; topics: { title: string; description: string; tag: string }[] }
  // topics: 2–4 items; title 2–5 words, description ≤ 25 words, tag valid concept tag
  | { type: 'video'; title: string; url: string; description: string }
  // Rarely used — only for official vendor conference talks or canonical explainers

interface Question {
  id: string                  // Format: "q{n}" — sequential, never reused
  number: number              // Display number, 1-indexed per channel
  title: string               // The question, written as a full sentence
  tags: string[]              // 2–5 tags per tagging standards
  difficulty: DifficultyTech  // Tech channels: 'beginner' | 'intermediate' | 'advanced'
                              // Cert channels:  use DifficultyExam — 'easy' | 'medium' | 'hard'
                              // (The interface field accepts string; the value must match channel taxonomy)
  votes: number               // Seed value: beginner/easy 50–150, intermediate/medium 150–350, advanced/hard 200–500
  views: string               // Seed value formatted "Xk" — proportional to votes × 50
  askedBy: string             // Realistic lowercase username, no real names
  askedAt: string             // ISO date string, within last 18 months
  sections: AnswerSection[]   // Ordered: short → code → diagram → eli5 → related
  channelId?: string          // Set at runtime — do not hardcode in static data files
}
```

### Title (the question)

- Phrased as a full English sentence ending with `?`
- 6–20 words
- Must be answerable in an interview context — not trivia, not opinion
- Starts with: "What", "How", "Why", "When", "Explain", "What is the difference between"
- Never starts with: "Can you", "Do you know", "Tell me about" (those go in Voice)

**Good:** `How does the JavaScript event loop handle microtasks versus macrotasks?`
**Bad:** `Event loop?`, `Can you explain promises?`

### Sections (the answer)

Every Q&A answer is composed of **ordered sections**. Requirements:

#### Required sections (must appear in this order if present)

| # | Section type | Purpose | Length |
|---|---|---|---|
| 1 | `short` | Core answer — the "30-second interview answer" | 80–250 words |
| 2 | `code` | Runnable code demonstrating the concept | 8–35 lines |
| 3 | `diagram` | SVG architecture or flow diagram | Only when a visual genuinely clarifies |
| 4 | `eli5` | ELI5 analogy for conceptual grounding | 30–80 words |
| 5 | `related` | 2–4 related topics with 1-sentence descriptions | Each topic ≤ 25 words |

#### Section: `short`

- Written in **Markdown**: bold key terms, inline code for symbols/APIs
- Structure: **1 sentence summary** → **bullet-point breakdown** of 3–6 key sub-concepts
- Each bullet: concept name in bold + 1–2 sentence explanation
- Do NOT use numbered lists unless describing a strict sequence (e.g. "steps 1, 2, 3")
- Max 250 words. If you exceed this, you are not summarising — you are writing an article

**Template:**
```
The **[concept]** is [one-sentence definition].

Key components:
- **[Term A]**: [explanation]
- **[Term B]**: [explanation]
- **[Term C]**: [explanation]
```

#### Section: `code`

- Language must match the channel (JavaScript/TypeScript for JS channel, Python acceptable as secondary)
- Filename is optional — only include for multi-file examples
- Code must include at least **1 inline comment** explaining the non-obvious part
- Output must be shown as a `// comment` on the same line where possible
- Max 35 lines. Long solutions → split into two separate `code` sections with distinct filenames
- No `console.log('hello world')` filler — every line must serve the concept

**Good code block:**
```javascript
// Closure captures the outer variable by reference, not value
function makeCounter() {
  let count = 0                    // private state
  return () => ++count             // returns incremented value
}
const counter = makeCounter()
counter() // 1
counter() // 2
```

**Bad code block:**
```javascript
// example
function foo() {
  // ...
}
foo()
```

#### Section: `diagram`

- Only required when the concept is inherently spatial (event loop, OSI layers, VPC architecture, React render tree)
- SVG must: use dark-mode colour palette (`#21262d` backgrounds, `#30363d` borders, brand accent colours)
- SVG viewBox must be `"0 0 500 300"` (standard), `"0 0 500 400"` (tall), or `"0 0 700 300"` (wide)
- Must include `<text>` labels for every box/node
- No external image references — everything inline

#### Section: `eli5`

- Analogy only. No technical terms allowed in this section
- Written in plain English, first-person perspective is fine
- Must map precisely to the actual concept — not just a vague metaphor

**Good ELI5:** `Think of the call stack like a stack of plates. JavaScript can only wash the top plate. When it's done, it picks up the next one. The event loop checks when there are no plates left, then adds new ones from the queue.`

**Bad ELI5:** `It's like a computer doing things one at a time.`

#### Section: `related`

- 2–4 topics only — the most commonly paired concepts
- Each topic: `title` (2–5 words), `description` (1 sentence, max 20 words), `tag` (valid concept tag)

### Q&A — Minimum per channel

| Channel | Minimum Q&A count |
|---|---|
| JavaScript | 25 |
| TypeScript | 15 |
| React | 20 |
| System Design | 15 |
| Algorithms | 15 |
| AWS-SAA | 20 |
| CKA | 15 |
| DevOps | 15 |
| All others | 10 |

---

## 5. Flashcards

Flashcards train **rapid recall** — the ability to define a concept under interview pressure in 5–10 seconds.

### TypeScript Interface

```typescript
interface Flashcard {
  id: string                  // Format: "fc{n}" — sequential
  front: string               // The question / prompt
  back: string                // The answer
  hint?: string               // Optional retrieval cue
  tags: string[]              // 2–4 tags
  difficulty: DifficultyTech | DifficultyExam
  // Tech channels  → DifficultyTech: 'beginner' | 'intermediate' | 'advanced'
  // Cert channels  → DifficultyExam: 'easy' | 'medium' | 'hard'
  // Rule: match the taxonomy of the channel the card belongs to (see §2)
  category: string            // Human-readable category, Title Case
  codeExample?: {             // Optional — only for code-heavy concepts
    language: Language        // Must be one of: 'javascript' | 'typescript' | 'python'
    code: string              // Max 12 lines; syntactically correct; no solution walkthroughs
  }
  mnemonic?: string           // Optional memory device, max 20 words
  channelId?: string          // Set at runtime — do not hardcode in static data files
}
```

### Front (the question)

- **10–15 words maximum** — if it's longer, split into two cards
- Written as a direct question or a fill-in-the-blank completion
- One concept per card. Never "What is X and how does it differ from Y?" — make two cards
- Use `backtick` for API names: `` What does `Array.prototype.reduce()` return? ``

**Good fronts:**
- `` What is the difference between `null` and `undefined`? ``
- `Name the three phases of the JavaScript event loop`
- `What HTTP status code means "resource not found"?`

**Bad fronts:**
- `Explain the entire React component lifecycle including hooks mapping to class methods`
- `JavaScript async`

### Back (the answer)

- **40–120 words** — every word must earn its place
- Lead with the direct answer in the **first sentence** — never bury the lede
- Key terms in `**bold**`, inline code in backticks
- Bullets are permitted if listing 3+ parallel items
- Do NOT repeat the front question in the answer

**Good back:**
`**Hoisting** moves `var` declarations to the top of their scope before execution. `var` is hoisted but **not initialized** (value is `undefined` until the assignment line). `let` and `const` are hoisted but sit in the **Temporal Dead Zone** — accessing them before declaration throws a `ReferenceError`.`

**Bad back:**
`Hoisting is when JavaScript hoists things. Variables declared with var are hoisted. Let and const have TDZ.`

### hint (optional)

- 5–15 words
- A **retrieval cue**, not a partial answer
- Triggers a memory pathway without giving the answer away

**Good hint:** `Think about what happens before code execution starts`
**Bad hint:** `It moves declarations to the top`

### codeExample (optional)

- Include only when the concept **cannot** be understood without seeing code
- Max **12 lines** — if longer, the concept belongs in Q&A, not flashcards
- Must be syntactically correct and directly illustrate the `front` concept
- No solution walkthroughs — flashcards teach recall, not problem-solving

### mnemonic (optional)

- A memorable device: acronym, rhyme, story, or visual anchor
- Max 20 words
- Must be technically accurate — a mnemonic that misteaches is worse than none

### Minimum per channel

| Channel | Minimum flashcard count |
|---|---|
| JavaScript | 30 |
| TypeScript | 20 |
| React | 25 |
| Algorithms | 20 |
| AWS-SAA | 30 |
| CKA | 25 |
| All others | 15 |

---

## 6. Coding Challenges

Coding challenges train **structured problem-solving** under time pressure, modelled on the LeetCode/InterviewBit standard with the addition of multi-language support and built-in pedagogy.

### TypeScript Interface

```typescript
// Language controls which starter code and solution entries are required.
// All three values are mandatory on every challenge regardless of channel.
type Language = 'javascript' | 'typescript' | 'python'

interface CodingChallenge {
  id: string                  // Format: "cc{n}"
  channelId: string           // Channel slug
  title: string               // Title case, noun phrase describing the task
  slug: string                // kebab-case version of title
  difficulty: CodingDifficulty // Always 'easy' | 'medium' | 'hard' — see Section 2 Exception
  tags: string[]              // 2–5 concept tags
  category: string            // e.g. "Arrays", "Trees", "Strings", "Dynamic Programming"
  timeEstimate: number        // Expected minutes for target level: easy 10–20, medium 20–40, hard 35–60
  description: string         // Problem statement in Markdown
  constraints: string[]       // 2–5 constraint strings
  examples: Example[]         // 2–3 worked examples
  starterCode: Record<Language, string>
  solution: Record<Language, string>
  hints: string[]             // 2–4 progressive hints
  testCases: TestCase[]       // 4–8 test cases
  eli5: string                // Plain-English analogy
  approach: string            // Algorithmic approach walkthrough in Markdown
  complexity: Complexity      // Big-O analysis
  relatedConcepts: string[]   // 2–4 related concept names
}

interface Example {
  input: string               // Exact function call arguments as string
  output: string              // Exact expected return value as string
  explanation?: string        // Required for medium/hard — 1–2 sentences
}

interface TestCase {
  input: string               // Same format as Example.input
  expected: string            // Same format as Example.output
  description: string         // Edge case label: "Empty array", "Single element", "Already sorted"
}

interface Complexity {
  time: string                // Big-O notation: "O(n)", "O(n log n)", "O(n²)"
  space: string               // Big-O notation
  explanation: string         // 1–3 sentences justifying both
}
```

### `title`

- Noun phrase describing the operation, not the data structure: "Implement Array Flatten", not "Array"
- Title Case, 2–6 words
- Must uniquely identify the problem within the channel

### `description`

- 50–200 words
- Structure: **task sentence** → **constraints note** → **example reference**
- State what the function receives and what it must return with exact types
- Use `**bold**` for the function name and key terms
- Never embed examples in the description — they go in `examples[]`

**Template:**
```
Implement a `[functionName]` function that [task description in plain English].

The function takes [input description] and returns [output description].

Do not use [banned API if applicable].
```

### `constraints`

- 2–5 items
- Each constraint is a **single, verifiable rule** — not a paragraph
- Cover: input range, valid types, performance requirements, API restrictions
- Format: imperative or declarative — `"Input is a non-empty array"`, `"Do not use Array.prototype.flat()"`

**Good constraints:**
```
"1 ≤ arr.length ≤ 10⁵"
"Values are integers in range [-10⁴, 10⁴]"
"Do not use built-in sort methods"
```

**Bad constraints:**
```
"The input will be valid"   ← too vague
"Be efficient"              ← not verifiable
```

### `examples`

- **2 examples for easy, 3 for medium and hard**
- Example 1: the "happy path" — straightforward case
- Example 2: a boundary or near-edge case
- Example 3 (medium/hard only): a tricky edge case that exposes a common mistake
- Every medium/hard example must have an `explanation`

### `starterCode`

All three languages required: `javascript`, `typescript`, `python`

- JavaScript: JSDoc comment with `@param` and `@returns`
- TypeScript: typed function signature
- Python: `def` with type hints and a docstring

**Each starter code must:**
- Include the correct function signature matching the problem
- Include **one representative test call** as a comment at the bottom
- NOT include any solution logic — only the skeleton

**JavaScript starter template:**
```javascript
/**
 * @param {InputType} paramName - description
 * @returns {ReturnType}
 */
function functionName(paramName) {
  // Your solution here
}

// Test
console.log(functionName(exampleInput)); // expectedOutput
```

### `solution`

All three languages required.

- Must be the **optimal** solution for the stated time/space complexity
- Include an alternative approach as a comment block if the optimal solution is non-obvious
- Add inline comments explaining **why**, not what: `// Use a set for O(1) lookups`
- Solutions must pass all `testCases`

### `hints`

- **2 hints for easy, 3 for medium, 4 for hard**
- Progressive — each hint reveals slightly more
- Hint 1: reframe the problem or point to the right data structure
- Hint 2: describe the approach without code
- Hint 3 (medium/hard): describe the key insight or loop invariant
- Hint 4 (hard only): describe the exact algorithm step-by-step

**Good hints for a sliding window problem:**
1. `"Think about maintaining a window of elements rather than recomputing from scratch each time"`
2. `"A sliding window with two pointers can give you O(n) instead of O(n²)"`
3. `"Expand the right pointer to grow the window; shrink the left pointer when the constraint is violated"`

### `testCases`

- **4 test cases for easy, 6 for medium, 8 for hard**
- Must include: happy path, empty/null input, single element, large input, all-equal elements, sorted/reversed input
- `description` must name the case: `"Empty array"`, `"All same values"`, `"Already sorted descending"`
- Input and expected must be stringified representations of actual values

### `eli5`

- 30–60 words
- A non-technical analogy that maps to the algorithmic approach (not just the problem)
- Must be accurate — if the analogy breaks down, remove it

### `approach`

- 100–300 words in Markdown
- Structure: **strategy** → **step-by-step walkthrough** → **why it works**
- Reference the complexity in the last paragraph
- No code in this field — the solution field has code

### `complexity`

- `time` and `space` both required — always Big-O notation
- Explanation: justify the dominant term, mention the input variable (n = array length, etc.)

**Good:**
```
time: "O(n log n)"
space: "O(n)"
explanation: "The sort step dominates at O(n log n). The auxiliary array used during the merge step is O(n) where n is the input length."
```

### Time estimate calibration

| Difficulty | Target percentile candidate | Expected time |
|---|---|---|
| Easy | P50 junior candidate | 10–20 min |
| Medium | P50 mid-level candidate | 20–40 min |
| Hard | P50 senior candidate | 35–60 min |

### Minimum per channel

| Channel | Minimum challenge count |
|---|---|
| JavaScript | 10 |
| TypeScript | 8 |
| Algorithms | 20 |
| React | 8 |
| All others | 5 |

---

## 7. Mock Exam Questions

Mock exam questions simulate the format and difficulty distribution of real vendor certification exams (AWS, CKA, Terraform) and whiteboard technical screens (for tech channels). Standards are modelled on Tutorials Dojo, Whizlabs, and official AWS sample exams.

### TypeScript Interface

```typescript
interface ExamQuestion {
  id: string                  // Format: "ex-{channelSlug}{n}" — e.g. "ex-js1"
  channelId: string
  domain: string              // Topic domain within the channel, Title Case
  question: string            // The question stem — plain text or code block
  choices: Choice[]           // Exactly 4 choices
  correct: 'A' | 'B' | 'C' | 'D'
  explanation: string         // Why correct is right AND why others are wrong
  difficulty: 'easy' | 'medium' | 'hard'
}

interface Choice {
  id: 'A' | 'B' | 'C' | 'D'
  text: string
}
```

### Question stem (`question`)

- 20–80 words for concept questions
- 60–150 words for scenario questions (medium/hard)
- End with `?` for direct questions; end with `.` for scenario prompts like `"Which solution BEST meets these requirements?"`
- Code snippets are embedded inline using newline characters (the UI renders them as code blocks)
- Never ask "Which of the following is NOT true" — avoid negatives unless absolutely necessary; if used, bold **NOT**

**Difficulty → question style mapping:**

| Difficulty | Style | Pattern |
|---|---|---|
| Easy | Concept recall | "What does X do?" / "Which service provides Y?" |
| Medium | Application | "A company needs X. Which approach provides Y while ensuring Z?" |
| Hard | Scenario analysis | Multi-constraint scenario requiring elimination of 3 plausible options |

### Choices (`choices`)

- **Always exactly 4 choices** (A, B, C, D)
- Each choice is a complete sentence or phrase — no single-word answers
- All 4 choices must be **plausible** — an obvious wrong answer is not a distractor, it's a gift
- All 4 choices must be **roughly equal length** — length asymmetry leaks the answer
- The correct answer must not always be the most specific/detailed choice
- Rotate the position of the correct answer across questions — do not cluster correct answers in position A or B

**Distractor quality checklist:**
- [ ] At least 2 distractors are services/approaches that actually exist but are wrong for this specific scenario
- [ ] At least 1 distractor would be correct in a slightly different scenario (tests nuance)
- [ ] No distractor is obviously absurd

**Good choices for "Which database for single-digit ms at scale?":**
```
A: Amazon RDS PostgreSQL with read replicas
B: Amazon Redshift
C: Amazon DynamoDB
D: Amazon Neptune
```

**Bad choices (distractor C is absurd):**
```
A: RDS PostgreSQL
B: Microsoft Excel
C: DynamoDB
D: Redshift
```

### `explanation`

- **100–200 words**
- Structure: **Why correct is correct** (2–3 sentences) → **Why each wrong answer is wrong** (1–2 sentences each)
- Name each wrong option explicitly: "Option A (RDS) provides…but does not guarantee…"
- Include the relevant rule, acronym, or key decision criterion that makes this question memorable

**Template:**
```
[Correct option] is correct because [reason — cite the specific capability or service feature].

Option [A/B/D] is incorrect because [specific reason this option doesn't meet the stated requirement].
Option [A/B/D] is incorrect because [specific reason].
Option [A/B/D] is a [plausible service] but [why it fails here].
```

### `domain`

- The sub-topic within the channel's exam guide
- Title Case, 2–5 words
- Must match actual exam domain names where they exist (e.g. AWS-SAA: "High Availability", "Storage", "Security")

### Minimum per channel

| Channel | Minimum exam questions |
|---|---|
| JavaScript | 10 |
| React | 8 |
| Algorithms | 6 |
| AWS-SAA | 40 |
| CKA | 30 |
| Terraform | 20 |
| All certification channels | 30 |
| All tech channels | 8 |

---

## 8. Voice Practice Prompts

Voice practice prompts train **verbal communication** of technical knowledge — modelled on Exponent's interview prep and Google/Meta/Amazon STAR behavioural frameworks.

### TypeScript Interface

```typescript
interface VoicePrompt {
  id: string                  // Format: "vp{n}"
  channelId: string
  prompt: string              // What the interviewer says — 10–30 words of natural spoken speech
  type: 'technical' | 'behavioral' | 'scenario' | 'explain'
  timeLimit: number           // Seconds — see timeLimit table below; calibrated by type × difficulty
  difficulty: DifficultyTech | DifficultyExam
  // Tech channels  → DifficultyTech: 'beginner' | 'intermediate' | 'advanced'
  // Cert channels  → DifficultyExam: 'easy' | 'medium' | 'hard'
  // The timeLimit table in this section uses Taxonomy A labels;
  // for cert channels map: easy→beginner, medium→intermediate, hard→advanced
  domain: string              // Sub-topic within the channel, Title Case, 2–5 words
  keyPoints: string[]         // 4–8 concrete sub-topics in answer order (see keyPoints rules)
  followUp?: string           // Required for advanced / hard — 8–20 words natural follow-up
}
```

### Prompt types

| Type | Definition | Example |
|---|---|---|
| `technical` | "Implement / design / walk me through X" | "Walk me through implementing a debounce function from scratch" |
| `behavioral` | STAR-format experience question | "Tell me about a time you debugged a complex production issue" |
| `scenario` | Hypothetical situation requiring a technical response | "Your API latency spiked 10× in production — what do you do?" |
| `explain` | "Explain X to me" / "How does X work?" | "Explain how Kubernetes pod networking works" |

### `prompt` (the question)

- Written as the **interviewer's spoken words** — casual, direct, natural
- 10–30 words
- Must be a question a real interviewer would ask — verified against Glassdoor, Levels.fyi, and Exponent interviews
- Do NOT include hints or scaffolding in the prompt — that belongs in `keyPoints`

**Good prompts:**
- `"Walk me through how you would implement rate limiting on an API"`
- `"Explain Docker networking modes and when you'd use each one"`
- `"Tell me about a time you had to refactor a large codebase. What was your approach?"`

**Bad prompts:**
- `"Explain Docker networking including bridge, host, none, and overlay modes and give examples of when to use each in production (hint: think about container isolation)"`
- `"What is rate limiting?"` ← too short for a voice practice prompt; belongs in Q&A or flashcards

### `timeLimit` (seconds)

| Type | Beginner | Intermediate | Advanced |
|---|---|---|---|
| `explain` | 60–90 | 90–150 | 150–240 |
| `technical` | 90–120 | 120–180 | 180–300 |
| `behavioral` | 90–120 | 120–180 | 150–240 |
| `scenario` | 120–150 | 150–240 | 240–360 |

- Time limits represent **target answer duration** — a strong candidate should fill most of the time
- Exceeding the time limit is as bad as running short — both signal poor pacing
- System design questions at advanced level may go to 360 seconds (6 minutes)

### `keyPoints`

- **4 key points for beginner, 5–6 for intermediate, 6–8 for advanced**
- Each key point is a **concrete sub-topic**, not a vague instruction
- Order them as they would appear in a well-structured verbal answer
- Do NOT include "be specific", "give examples", "use STAR format" as key points — those are meta-instructions, not content

**Good key points for "Explain the event loop":**
```
"Call stack — single-threaded execution model"
"Web APIs handle async ops (setTimeout, fetch, DOM)"
"Microtask queue — Promise.then, higher priority"
"Macrotask queue — setTimeout, setInterval, lower priority"
"Event loop checks stack empty → drains microtasks → picks one macrotask"
```

**Bad key points:**
```
"Explain clearly"
"Give an example"
"Talk about async"
"Mention queues"
```

### `followUp` (optional)

- A natural interviewer follow-up — the question an interviewer would ask after a strong initial answer
- 8–20 words
- Must deepen or pivot the topic, not just ask for more of the same
- Required for all `advanced` difficulty prompts

**Good follow-ups:**
- `"How would this change if JavaScript were multi-threaded?"`
- `"How do you handle cache invalidation in production?"`
- `"How would you design this to handle 10× the current traffic?"`

**Bad follow-ups:**
- `"Can you explain more?"` ← too vague
- `"Good answer! Any more details?"` ← not a real follow-up question

### Minimum per channel

| Channel | Minimum voice prompts |
|---|---|
| JavaScript | 8 |
| React | 6 |
| System Design | 8 |
| AWS-SAA | 6 |
| CKA | 6 |
| All others | 4 |

---

## 9. Channel Coverage Targets

Every channel must have all five content types populated at or above their per-entity minimums (defined in each section above). Targets differ by channel type because certification channels simulate full-length timed exams while tech channels supplement interview coaching.

### Tech Channels
Applies to: JavaScript, TypeScript, React, Algorithms, System Design, DevOps, Networking

| Content Type | Minimum | Target |
|---|---|---|
| Q&A Questions | Per §4 table | 20–40 |
| Flashcards | Per §5 table | 25–50 |
| Coding Challenges | Per §6 table | 8–20 |
| Mock Exam Questions | 8 (per §7) | 10–20 |
| Voice Practice Prompts | Per §8 table | 8–15 |

Mock Exam for tech channels is intentionally smaller — its purpose is spot-checking conceptual accuracy, not simulating a full certification exam. 10–20 questions is the correct target; do not inflate to certification levels.

### Certification Channels
Applies to: AWS-SAA, AWS-DEV, CKA, Terraform

| Content Type | Minimum | Target |
|---|---|---|
| Q&A Questions | Per §4 table | 20–35 |
| Flashcards | Per §5 table | 30–60 |
| Coding Challenges | 0 (see note) | 0–8 |
| Mock Exam Questions | 30 (per §7) | 40–65 |
| Voice Practice Prompts | Per §8 table | 6–15 |

Mock Exam is the primary assessment vehicle for certification channels — 40–65 questions approaches the length of real practice exams (AWS-SAA: 65 q, CKA: 17–25 performance tasks, Terraform: 57 q).

### Coding Challenge applicability

Coding challenges are **not applicable** on pure certification channels (AWS-SAA, CKA) unless the exam explicitly tests scripting or configuration writing. Exceptions:

| Channel | Coding applicable? | Reasoning |
|---|---|---|
| JavaScript, TypeScript, Algorithms | Yes — required | Core competency |
| React | Yes — recommended | JSX/hook patterns are code problems |
| DevOps | Yes — recommended | Bash scripting, Dockerfile, YAML authoring |
| Terraform | Yes — recommended | HCL resource authoring is the exam format |
| AWS-SAA, AWS-DEV | Optional | Boto3 / SDK snippets only if exam-weighted |
| CKA | Optional | kubectl YAML manifests only |
| System Design | No | System design is diagrammatic, not code |

---

## 10. Anti-Patterns

The following patterns violate these standards and must be rejected during review.

### Content anti-patterns

| Anti-pattern | Why it fails |
|---|---|
| "Great question!" / "That's interesting!" | Sycophantic filler; wastes space |
| Burying the answer in paragraph 3 | Fails the "30-second interview answer" test |
| "It depends" as a complete answer | Always true but never useful; follow with the actual factors it depends on |
| Explaining what, never why | Candidates need to know why to defend an answer under pressure |
| Recycled definitions from Wikipedia | Passive voice, verbose, not interview-calibrated |
| Code with `// ...` placeholders | Not runnable; teaches nothing |
| Mislabelled difficulty | A "beginner" question that requires 5 years of experience to answer loses trust |
| Overly long flashcard backs | If the back is > 120 words, it's a Q&A answer, not a flashcard |
| Single-distractor exam questions | 3 obvious wrong answers + 1 right answer is not a test; it's a hint |

### Technical anti-patterns

| Anti-pattern | Correct approach |
|---|---|
| Deprecated APIs without warning | Add `⚠️ Deprecated as of [version]` note |
| Framework-specific code in language channel | Separate into the appropriate framework channel |
| O(n²) solution labelled as optimal | Always provide the provably optimal solution; note trade-offs |
| Starter code that partially solves the problem | Starter code = signature + comments only |
| Test cases that duplicate examples | Test cases must cover cases NOT shown in examples |

---

## 11. Revision Checklist

Before submitting any content, verify every item:

### Q&A Questions
- [ ] Title is 6–20 words, ends with `?`, answerable in an interview
- [ ] `short` section is 80–250 words, leads with a 1-sentence summary
- [ ] Code section is ≤ 35 lines, syntactically correct, runs without error
- [ ] Diagram uses the standard dark-mode SVG palette and `500×300` viewBox
- [ ] ELI5 is ≤ 80 words, analogy maps precisely to the concept
- [ ] Tags follow kebab-case and include the channel slug as tag[0]
- [ ] Difficulty matches the calibration table

### Flashcards
- [ ] Front is ≤ 15 words, tests a single concept
- [ ] Back is 40–120 words, direct answer in sentence 1
- [ ] Code example is ≤ 12 lines if present
- [ ] Hint is a retrieval cue, not a partial answer

### Coding Challenges
- [ ] All three language solutions are present and pass all test cases
- [ ] Constraints are specific and verifiable
- [ ] Examples include happy path + edge cases; all medium/hard have explanations
- [ ] Hints are progressive (not all the same depth)
- [ ] Test cases include at minimum: empty input, single element, large input
- [ ] `approach` describes the algorithm without code
- [ ] Complexity is justified in 1–3 sentences

### Mock Exam Questions
- [ ] Exactly 4 choices, all plausible, roughly equal in length
- [ ] Explanation addresses why correct is right AND why each wrong option is wrong
- [ ] No negatively-phrased question unless **NOT** is bold
- [ ] Correct answer is not always A or B

### Voice Practice Prompts
- [ ] Prompt reads as natural spoken interviewer speech
- [ ] Time limit matches the type × difficulty table
- [ ] Key points are concrete sub-topics in answer order, not meta-instructions
- [ ] Follow-up is required for all `advanced` prompts
- [ ] Type matches: `explain` for definitions, `technical` for implementation, `scenario` for hypotheticals, `behavioral` for STAR stories
