# DevPrep Diagram Generation Architecture

## System Overview

```
┌─────────────────────────────────────────────────────────────────────────────┐
│                           DIAGRAM GENERATION SYSTEM                         │
├─────────────────────────────────────────────────────────────────────────────┤
│                                                                              │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────────┐             │
│  │   Content    │────▶│   Diagram    │────▶│    Channel       │             │
│  │   Request    │     │   Engine     │     │    Styler        │             │
│  └──────────────┘     └──────────────┘     └──────────────────┘             │
│                              │                        │                      │
│                              ▼                        ▼                      │
│                       ┌──────────────┐     ┌──────────────────┐             │
│                       │   Template   │     │   Deduplication  │             │
│                       │   Library    │     │     Service      │             │
│                       └──────────────┘     └──────────────────┘             │
│                              │                        │                      │
│                              ▼                        ▼                      │
│                       ┌─────────────────────────────────────┐               │
│                       │          Diagram Cache              │               │
│                       │     (LRU + Hash-based lookup)       │               │
│                       └─────────────────────────────────────┘               │
│                                         │                                    │
│                                         ▼                                    │
│                       ┌─────────────────────────────────────┐               │
│                       │         SQLite Database              │               │
│                       │  ┌─────────────┐ ┌───────────────┐  │               │
│                       │  │   diagram_  │ │   generated_  │  │               │
│                       │  │  templates  │ │   diagrams    │  │               │
│                       │  └─────────────┘ └───────────────┘  │               │
│                       └─────────────────────────────────────┘               │
└─────────────────────────────────────────────────────────────────────────────┘
```

## Module Descriptions

### 1. DiagramEngine (Core)

The central orchestrator that coordinates diagram generation:

```typescript
class DiagramEngine {
  // Primary entry point
  async generateDiagram(
    question: ContentQuestion,
    channel: Channel,
    options?: DiagramOptions,
  ): Promise<GeneratedDiagram>;

  // Template selection based on content analysis
  private selectTemplate(question: ContentQuestion): DiagramTemplate;

  // Variable extraction from question data
  private extractVariables(
    question: ContentQuestion,
    template: DiagramTemplate,
  ): TemplateVariables;

  // SVG rendering with channel theming
  private renderSVG(
    template: DiagramTemplate,
    variables: TemplateVariables,
    channel: Channel,
  ): string;
}
```

**Key Responsibilities:**

- Parse question content and extract relevant diagram components
- Select appropriate template based on topic keywords
- Inject channel-specific styling
- Generate unique hash for deduplication
- Coordinate with cache and deduplication service

### 2. TemplateLibrary

Stores and manages SVG templates with variable placeholders:

```typescript
interface DiagramTemplate {
  id: string;
  category: DiagramCategory;
  svgTemplate: string; // SVG with {{variable}} placeholders
  variables: VariableSchema[];
  applicableChannels: string[];
}

class TemplateLibrary {
  // Load templates from database
  async loadTemplates(): Promise<void>;

  // Find best matching template
  findTemplate(
    category: DiagramCategory,
    channelId: string,
  ): DiagramTemplate | null;

  // Validate variable schema
  validateVariables(
    template: DiagramTemplate,
    variables: Record<string, unknown>,
  ): boolean;
}
```

**Template Categories by Channel:**

| Channel       | Categories                                                     |
| ------------- | -------------------------------------------------------------- |
| javascript    | closures, promises, async-await, event-loop, prototypes        |
| react         | hooks-lifecycle, component-tree, state-flow, context-providers |
| algorithms    | sorting, tree-traversal, graph-algorithms, big-o-charts        |
| devops        | cicd-pipeline, docker-arch, container-orchestration            |
| kubernetes    | pod-lifecycle, service-types, ingress-flow, helm-charts        |
| networking    | tcpip-layers, dns-resolution, http-flow, osi-model             |
| system-design | load-balancing, caching-strategies, db-sharding                |
| aws-saa       | multi-az, s3-lifecycle, vpc-design                             |
| aws-dev       | codepipeline, lambda-execution                                 |
| cka           | etcd-cluster, kube-scheduler, pod-scheduling                   |
| terraform     | resource-deps, state-management                                |

### 3. DeduplicationService

Prevents duplicate diagrams using content-aware hashing:

```typescript
class DeduplicationService {
  // Generate deterministic hash from diagram content
  generateHash(
    templateId: string,
    variables: Record<string, unknown>,
    channelId: string,
  ): string;

  // Check if diagram already exists
  async exists(hash: string): Promise<boolean>;

  // Get existing diagram by hash
  async getByHash(hash: string): Promise<GeneratedDiagram | null>;

  // Remove duplicate diagrams (admin operation)
  async removeDuplicates(): Promise<{ deleted: number }>;
}
```

**Hash Generation Strategy:**

```
hash = SHA256(template_id + sorted_variables_json + channel_id)
```

This ensures:

- Same template + same variables + same channel = same hash
- Different channels produce different hashes (allows channel-specific variations)
- Variable order doesn't affect hash (sorted keys)

### 4. ChannelStyler

Applies channel-specific visual theming:

```typescript
interface ChannelTheme {
  id: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  iconSet: string;
  borderRadius: number;
}

class ChannelStyler {
  private themes: Map<string, ChannelTheme>;

  // Get theme for channel
  getTheme(channelId: string): ChannelTheme;

  // Apply theme variables to SVG
  applyTheme(svg: string, theme: ChannelTheme): string;

  // Generate channel-specific colors
  generateVariants(baseColor: string, count: number): string[];
}
```

**Default Themes:**

| Channel       | Primary | Secondary | Accent  |
| ------------- | ------- | --------- | ------- |
| javascript    | #F7DF1E | #323330   | #000000 |
| react         | #61DAFB | #20232A   | #61DAFB |
| algorithms    | #4CAF50 | #1B5E20   | #8BC34A |
| devops        | #FF6B35 | #1A1A2E   | #00D9FF |
| kubernetes    | #326CE5 | #FFFFFF   | #7B1FA2 |
| networking    | #2196F3 | #0D47A1   | #64B5F6 |
| system-design | #9C27B0 | #4A148C   | #E1BEE7 |
| aws-saa       | #FF9900 | #1A1A1A   | #FF9900 |
| aws-dev       | #FF9900 | #232F3E   | #00BCD4 |
| cka           | #326CE5 | #FFFFFF   | #00B9AE |
| terraform     | #7B42BC | #5C4EE5   | #7B42BC |

### 5. DiagramCache

Efficient retrieval with LRU cache:

```typescript
class DiagramCache {
  private cache: LRUCache<string, GeneratedDiagram>;
  private hashIndex: Map<string, string>; // hash -> diagramId

  // Get from cache or database
  async get(id: string): Promise<GeneratedDiagram | null>;
  async getByHash(hash: string): Promise<GeneratedDiagram | null>;

  // Store in cache and database
  async store(diagram: GeneratedDiagram): Promise<void>;

  // Invalidate cache entry
  async invalidate(id: string): Promise<void>;

  // Bulk operations
  async getByChannel(
    channelId: string,
    limit: number,
  ): Promise<GeneratedDiagram[]>;
}
```

## Data Flow Diagrams

### Diagram Generation Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                    GENERATE DIAGRAM SEQUENCE                         │
└──────────────────────────────────────────────────────────────────────┘

Content Request
      │
      ▼
┌─────────────────┐
│  Parse Question │
│  Extract Topics │
└─────────────────┘
      │
      ▼
┌─────────────────┐
│  Select Template│
│  (by category)  │
└─────────────────┘
      │
      ▼
┌─────────────────┐     ┌──────────────────┐
│ Extract Variables│────▶│ Validate Schema │
└─────────────────┘     └──────────────────┘
      │                         │
      ▼                         │ (retry/select alt)
┌─────────────────┐              │
│ Generate Hash   │              │
│ (template+vars) │              │
└─────────────────┘              │
      │                          │
      ▼                          │
┌─────────────────┐              │
│ Check Duplicate │──────────────┤
│ (Deduplication) │              │
└─────────────────┘              │
      │                          │
      ├──[EXISTS]────────────────┘
      │
      ▼
┌─────────────────┐
│ Apply Channel   │
│ Theming         │
└─────────────────┘
      │
      ▼
┌─────────────────┐
│ Render SVG      │
│ from Template   │
└─────────────────┘
      │
      ▼
┌─────────────────┐
│ Store in Cache  │
│ & Database      │
└─────────────────┘
      │
      ▼
   Return { id, svg, hash }
```

### Deduplication Flow

```
┌──────────────────────────────────────────────────────────────────────┐
│                      DEDUPLICATION SEQUENCE                          │
└──────────────────────────────────────────────────────────────────────┘

┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│ Content +    │    │ Generate     │    │ Check Hash   │
│ Channel      │───▶│ SHA256 Hash  │───▶│ in Index     │
└──────────────┘    └──────────────┘    └──────────────┘
                                                  │
                              ┌───────────────────┴───────────────────┐
                              │                                       │
                              ▼                                       ▼
                       ┌──────────────┐                        ┌──────────────┐
                       │ NOT FOUND    │                        │    FOUND     │
                       │ → Continue   │                        │ → Return     │
                       │   Generate   │                        │   Existing   │
                       └──────────────┘                        └──────────────┘
```

## Deduplication Strategy

### Hash-Based Detection

1. **Content Hash**: SHA256 of normalized template variables
2. **Channel-Aware**: Same diagram different channel = different hash
3. **Collision Handling**: Linear probing with prefix increment

### Similarity Detection (Advanced)

For semantic deduplication beyond exact matches:

```typescript
interface DiagramSimilarity {
  templateMatch: number      // 0-1, same template family
  variableOverlap: number    // 0-1, shared variable values
  structuralSimilarity: number // 0-1, SVG structure comparison
}

async findSimilarDiagrams(
  diagram: GeneratedDiagram,
  threshold: number = 0.8
): Promise<GeneratedDiagram[]>
```

### Cleanup Operations

```typescript
// Admin endpoint: Remove exact duplicates
DELETE /api/diagrams/duplicates
Response: { deleted: number, byChannel: Record<string, number> }

// Admin endpoint: Remove orphaned diagrams
DELETE /api/diagrams/orphans
Response: { deleted: number }
```

## Database Schema

```sql
-- Diagram templates with SVG and variable schemas
CREATE TABLE diagram_templates (
  id TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  svg_template TEXT NOT NULL,
  variables TEXT NOT NULL,  -- JSON: [{ name, type, required, default }]
  applicable_channels TEXT,  -- JSON: ["javascript", "react", ...]
  complexity_level INTEGER DEFAULT 1,  -- 1-5
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  updated_at INTEGER DEFAULT (strftime('%s', 'now'))
);

CREATE INDEX idx_templates_category ON diagram_templates(category);
CREATE INDEX idx_templates_channel ON diagram_templates(applicable_channels);

-- Generated diagrams with hash for deduplication
CREATE TABLE generated_diagrams (
  id TEXT PRIMARY KEY,
  template_id TEXT NOT NULL,
  hash TEXT UNIQUE NOT NULL,
  svg_content TEXT NOT NULL,
  channel_id TEXT NOT NULL,
  source_question_id TEXT,
  topic_keywords TEXT,      -- JSON: extracted keywords for search
  variable_snapshot TEXT,   -- JSON: snapshot of variables used
  created_at INTEGER DEFAULT (strftime('%s', 'now')),
  FOREIGN KEY (template_id) REFERENCES diagram_templates(id)
);

CREATE INDEX idx_diagrams_hash ON generated_diagrams(hash);
CREATE INDEX idx_diagrams_channel ON generated_diagrams(channel_id);
CREATE INDEX idx_diagrams_template ON generated_diagrams(template_id);
CREATE INDEX idx_diagrams_question ON generated_diagrams(source_question_id);

-- Cache metadata for performance tracking
CREATE TABLE diagram_stats (
  channel_id TEXT PRIMARY KEY,
  total_diagrams INTEGER DEFAULT 0,
  last_generated_at INTEGER,
  avg_generation_ms INTEGER
);
```

## API Design

### Core Endpoints

```typescript
// Generate diagram for question
POST /api/diagrams/generate
Body: {
  questionId: string,
  channelId: string,
  options?: {
    templateId?: string,      // Force specific template
    regenerate?: boolean      // Force regenerate even if duplicate exists
  }
}
Response: {
  ok: true,
  data: {
    id: string,
    hash: string,
    svg: string,
    templateId: string,
    isNew: boolean
  }
}

// Get diagram by hash
GET /api/diagrams/hash/:hash
Response: {
  ok: true,
  data: GeneratedDiagram | null
}

// Get diagrams for channel
GET /api/diagrams/channel/:channelId?limit=20&offset=0
Response: {
  ok: true,
  data: GeneratedDiagram[],
  total: number
}

// Get available templates
GET /api/diagrams/templates?channel=javascript&category=promises
Response: {
  ok: true,
  data: DiagramTemplate[]
}

// Admin: Remove duplicates
DELETE /api/diagrams/duplicates?channel=javascript
Response: {
  ok: true,
  data: { deleted: number }
}
```

## Implementation Roadmap

### Phase 1: Core Infrastructure (Week 1)

- [ ] Create database tables
- [ ] Implement TemplateLibrary with basic SVG templates
- [ ] Implement DeduplicationService with hash generation
- [ ] Create DiagramEngine orchestrator

### Phase 2: Channel Integration (Week 2)

- [ ] Implement ChannelStyler with all 11 channel themes
- [ ] Create template library (10-15 templates per channel)
- [ ] Integrate with content generation pipeline

### Phase 3: Caching & Optimization (Week 3)

- [ ] Implement DiagramCache with LRU eviction
- [ ] Add similarity detection for semantic deduplication
- [ ] Performance benchmarking and tuning

### Phase 4: Advanced Features (Week 4)

- [ ] Template editor UI for admins
- [ ] Template versioning and A/B testing
- [ ] Analytics dashboard for diagram usage

## SVG Template Examples

### JavaScript Closures Template

```svg
<svg viewBox="0 0 400 300" xmlns="http://www.w3.org/2000/svg">
  <style>
    .box { fill: #F7DF1E; stroke: #323330; stroke-width: 2; }
    .arrow { stroke: #323330; stroke-width: 2; fill: none; marker-end: url(#arrow); }
    .label { font-family: monospace; font-size: 12px; fill: #323330; }
    .scope-box { fill: none; stroke: #7B42BC; stroke-width: 1; stroke-dasharray: 4; }
  </style>

  <!-- Function Scope -->
  <rect class="scope-box" x="50" y="50" width="300" height="200" rx="8"/>
  <text class="label" x="60" y="40">function scope</text>

  <!-- Variable -->
  <rect class="box" x="80" y="80" width="100" height="40" rx="4"/>
  <text class="label" x="90" y="105">let x = {{initialValue}}</text>

  <!-- Inner Function -->
  <rect class="box" x="180" y="140" width="140" height="60" rx="4"/>
  <text class="label" x="190" y="165">function {{innerName}}</text>
  <text class="label" x="195" y="180">  return x + 1</text>

  <!-- Closure Reference Arrow -->
  <path class="arrow" d="M250 140 L130 120"/>
  <text class="label" x="160" y="125">closure</text>

  <!-- Marker Definition -->
  <defs>
    <marker id="arrow" markerWidth="10" markerHeight="10" refX="9" refY="3" orient="auto">
      <path d="M0,0 L0,6 L9,3 z" fill="#323330"/>
    </marker>
  </defs>
</svg>
```

### DevOps CI/CD Pipeline Template

```svg
<svg viewBox="0 0 600 300" xmlns="http://www.w3.org/2000/svg">
  <style>
    .stage { fill: #FF6B35; stroke: #1A1A2E; stroke-width: 2; }
    .arrow { stroke: #00D9FF; stroke-width: 2; }
    .label { font-family: sans-serif; font-size: 14px; fill: #1A1A2E; }
    .pipeline { fill: none; stroke: #1A1A2E; stroke-width: 3; }
  </style>

  <!-- Pipeline Background -->
  <path class="pipeline" d="M50 150 L550 150"/>

  <!-- Build Stage -->
  <circle class="stage" cx="100" cy="150" r="40"/>
  <text class="label" x="85" y="155">Build</text>

  <!-- Test Stage -->
  <circle class="stage" cx="220" cy="150" r="40"/>
  <text class="label" x="200" y="155">Test</text>

  <!-- Deploy Stage -->
  <circle class="stage" cx="340" cy="150" r="40"/>
  <text class="label" x="320" y="155">Deploy</text>

  <!-- Production Stage -->
  <circle class="stage" cx="460" cy="150" r="40"/>
  <text class="label" x="435" y="155">Production</text>

  <!-- Stage Labels -->
  <text class="label" x="100" y="230">{{buildSteps}}</text>
  <text class="label" x="220" y="230">{{testSteps}}</text>
  <text class="label" x="340" y="230">{{deployTarget}}</text>
  <text class="label" x="460" y="230">{{envType}}</text>
</svg>
```

## Performance Targets

| Metric              | Target      |
| ------------------- | ----------- |
| Diagram generation  | < 100ms p95 |
| Cache hit rate      | > 90%       |
| Hash lookup         | < 5ms       |
| Template render     | < 50ms      |
| Deduplication check | < 10ms      |

## Error Handling

```typescript
// Error types
enum DiagramErrorType {
  TEMPLATE_NOT_FOUND = "TEMPLATE_NOT_FOUND",
  INVALID_VARIABLES = "INVALID_VARIABLES",
  RENDER_FAILED = "RENDER_FAILED",
  DB_ERROR = "DB_ERROR",
}

// Error response format
interface DiagramError {
  type: DiagramErrorType;
  message: string;
  details?: Record<string, unknown>;
  retryable: boolean;
}
```
