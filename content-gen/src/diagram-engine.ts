import { createHash } from "crypto";
import { randomUUID } from "crypto";
import Database from "bun:sqlite";

export type DiagramCategory =
  | "closures"
  | "promises"
  | "async-await"
  | "event-loop"
  | "prototypes"
  | "hooks-lifecycle"
  | "component-tree"
  | "state-flow"
  | "context-providers"
  | "sorting"
  | "tree-traversal"
  | "graph-algorithms"
  | "big-o-charts"
  | "cicd-pipeline"
  | "docker-arch"
  | "container-orchestration"
  | "pod-lifecycle"
  | "service-types"
  | "ingress-flow"
  | "helm-charts"
  | "tcpip-layers"
  | "dns-resolution"
  | "http-flow"
  | "osi-model"
  | "load-balancing"
  | "caching-strategies"
  | "db-sharding"
  | "multi-az"
  | "s3-lifecycle"
  | "vpc-design"
  | "codepipeline"
  | "lambda-execution"
  | "etcd-cluster"
  | "kube-scheduler"
  | "pod-scheduling"
  | "resource-deps"
  | "state-management"
  | "generic";

export interface ChannelTheme {
  id: string;
  primaryColor: string;
  secondaryColor: string;
  accentColor: string;
  fontFamily: string;
  iconSet: string;
  borderRadius: number;
}

export interface VariableSchema {
  name: string;
  type: "string" | "number" | "array" | "boolean";
  required: boolean;
  default?: unknown;
  description?: string;
}

export interface DiagramTemplate {
  id: string;
  category: DiagramCategory;
  name: string;
  description?: string;
  svgTemplate: string;
  variables: VariableSchema[];
  applicableChannels: string[];
  complexityLevel: number;
  createdAt: number;
  updatedAt: number;
}

export interface GeneratedDiagram {
  id: string;
  templateId: string;
  hash: string;
  svgContent: string;
  channelId: string;
  sourceQuestionId?: string;
  topicKeywords?: string[];
  variableSnapshot?: Record<string, unknown>;
  createdAt: number;
}

export interface DiagramOptions {
  templateId?: string;
  regenerate?: boolean;
  customVariables?: Record<string, unknown>;
}

interface ContentQuestion {
  id: string;
  type: string;
  data: Record<string, unknown>;
  tags?: string[];
}

interface Channel {
  id: string;
  name: string;
  color: string;
  type: "tech" | "cert";
}

const CHANNEL_THEMES: Record<string, ChannelTheme> = {
  javascript: {
    id: "javascript",
    primaryColor: "#F7DF1E",
    secondaryColor: "#323330",
    accentColor: "#000000",
    fontFamily: "monospace",
    iconSet: "javascript",
    borderRadius: 4,
  },
  react: {
    id: "react",
    primaryColor: "#61DAFB",
    secondaryColor: "#20232A",
    accentColor: "#61DAFB",
    fontFamily: "sans-serif",
    iconSet: "react",
    borderRadius: 8,
  },
  algorithms: {
    id: "algorithms",
    primaryColor: "#4CAF50",
    secondaryColor: "#1B5E20",
    accentColor: "#8BC34A",
    fontFamily: "monospace",
    iconSet: "algorithm",
    borderRadius: 4,
  },
  devops: {
    id: "devops",
    primaryColor: "#FF6B35",
    secondaryColor: "#1A1A2E",
    accentColor: "#00D9FF",
    fontFamily: "sans-serif",
    iconSet: "devops",
    borderRadius: 4,
  },
  kubernetes: {
    id: "kubernetes",
    primaryColor: "#326CE5",
    secondaryColor: "#FFFFFF",
    accentColor: "#7B1FA2",
    fontFamily: "sans-serif",
    iconSet: "k8s",
    borderRadius: 8,
  },
  networking: {
    id: "networking",
    primaryColor: "#2196F3",
    secondaryColor: "#0D47A1",
    accentColor: "#64B5F6",
    fontFamily: "sans-serif",
    iconSet: "network",
    borderRadius: 4,
  },
  "system-design": {
    id: "system-design",
    primaryColor: "#9C27B0",
    secondaryColor: "#4A148C",
    accentColor: "#E1BEE7",
    fontFamily: "sans-serif",
    iconSet: "system",
    borderRadius: 8,
  },
  "aws-saa": {
    id: "aws-saa",
    primaryColor: "#FF9900",
    secondaryColor: "#1A1A1A",
    accentColor: "#FF9900",
    fontFamily: "sans-serif",
    iconSet: "aws",
    borderRadius: 4,
  },
  "aws-dev": {
    id: "aws-dev",
    primaryColor: "#FF9900",
    secondaryColor: "#232F3E",
    accentColor: "#00BCD4",
    fontFamily: "sans-serif",
    iconSet: "aws",
    borderRadius: 4,
  },
  cka: {
    id: "cka",
    primaryColor: "#326CE5",
    secondaryColor: "#FFFFFF",
    accentColor: "#00B9AE",
    fontFamily: "sans-serif",
    iconSet: "k8s",
    borderRadius: 8,
  },
  terraform: {
    id: "terraform",
    primaryColor: "#7B42BC",
    secondaryColor: "#5C4EE5",
    accentColor: "#7B42BC",
    fontFamily: "monospace",
    iconSet: "terraform",
    borderRadius: 4,
  },
};

const DEFAULT_THEME: ChannelTheme = {
  id: "default",
  primaryColor: "#666666",
  secondaryColor: "#333333",
  accentColor: "#999999",
  fontFamily: "sans-serif",
  iconSet: "default",
  borderRadius: 4,
};

export class DeduplicationService {
  private db: Database;

  constructor(db: Database) {
    this.db = db;
  }

  generateHash(
    templateId: string,
    variables: Record<string, unknown>,
    channelId: string
  ): string {
    const sortedVars = JSON.stringify(variables, Object.keys(variables).sort());
    const hashInput = `${templateId}:${sortedVars}:${channelId}`;
    return createHash("sha256").update(hashInput).digest("hex").substring(0, 32);
  }

  async exists(hash: string): Promise<boolean> {
    const stmt = this.db.prepare(
      "SELECT 1 FROM generated_diagrams WHERE hash = ? LIMIT 1"
    );
    return stmt.get(hash) !== undefined;
  }

  async getByHash(hash: string): Promise<GeneratedDiagram | null> {
    const stmt = this.db.prepare(
      "SELECT * FROM generated_diagrams WHERE hash = ? LIMIT 1"
    );
    const row = stmt.get(hash) as Record<string, unknown> | undefined;
    if (!row) return null;
    return this.rowToDiagram(row);
  }

  private rowToDiagram(row: Record<string, unknown>): GeneratedDiagram {
    return {
      id: row.id as string,
      templateId: row.template_id as string,
      hash: row.hash as string,
      svgContent: row.svg_content as string,
      channelId: row.channel_id as string,
      sourceQuestionId: row.source_question_id as string | undefined,
      topicKeywords: row.topic_keywords
        ? JSON.parse(row.topic_keywords as string)
        : undefined,
      variableSnapshot: row.variable_snapshot
        ? JSON.parse(row.variable_snapshot as string)
        : undefined,
      createdAt: row.created_at as number,
    };
  }
}

export class ChannelStyler {
  private themes: Map<string, ChannelTheme>;

  constructor() {
    this.themes = new Map(Object.entries(CHANNEL_THEMES));
  }

  getTheme(channelId: string): ChannelTheme {
    return this.themes.get(channelId) || DEFAULT_THEME;
  }

  applyTheme(svg: string, theme: ChannelTheme): string {
    let themed = svg;
    themed = themed.replace(/\{\{PRIMARY_COLOR\}\}/g, theme.primaryColor);
    themed = themed.replace(/\{\{SECONDARY_COLOR\}\}/g, theme.secondaryColor);
    themed = themed.replace(/\{\{ACCENT_COLOR\}\}/g, theme.accentColor);
    themed = themed.replace(/\{\{FONT_FAMILY\}\}/g, theme.fontFamily);
    themed = themed.replace(
      /\{\{BORDER_RADIUS\}\}/g,
      String(theme.borderRadius)
    );
    return themed;
  }

  generateVariants(baseColor: string, count: number): string[] {
    const variants: string[] = [baseColor];
    for (let i = 1; i < count; i++) {
      variants.push(this.adjustBrightness(baseColor, -i * 15));
    }
    return variants;
  }

  private adjustBrightness(hex: string, amount: number): string {
    const num = parseInt(hex.replace("#", ""), 16);
    const r = Math.min(255, Math.max(0, (num >> 16) + amount));
    const g = Math.min(255, Math.max(0, ((num >> 8) & 0x00ff) + amount));
    const b = Math.min(255, Math.max(0, (num & 0x0000ff) + amount));
    return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
  }
}

export class TemplateLibrary {
  private templates: Map<string, DiagramTemplate>;
  private db: Database | null;

  constructor(db?: Database) {
    this.templates = new Map();
    this.db = db || null;
  }

  async loadTemplates(): Promise<void> {
    if (!this.db) return;
    const stmt = this.db.prepare("SELECT * FROM diagram_templates");
    const rows = stmt.all() as Record<string, unknown>[];
    for (const row of rows) {
      const template = this.rowToTemplate(row);
      this.templates.set(template.id, template);
    }
  }

  findTemplate(
    category: DiagramCategory,
    channelId: string
  ): DiagramTemplate | null {
    for (const template of this.templates.values()) {
      if (
        template.category === category &&
        (template.applicableChannels.length === 0 ||
          template.applicableChannels.includes(channelId))
      ) {
        return template;
      }
    }
    return null;
  }

  findTemplatesByChannel(channelId: string): DiagramTemplate[] {
    return Array.from(this.templates.values()).filter(
      (t) =>
        t.applicableChannels.length === 0 ||
        t.applicableChannels.includes(channelId)
    );
  }

  validateVariables(
    template: DiagramTemplate,
    variables: Record<string, unknown>
  ): boolean {
    for (const schema of template.variables) {
      if (schema.required && !(schema.name in variables)) {
        if (schema.default === undefined) {
          return false;
        }
      }
      if (schema.name in variables) {
        const value = variables[schema.name];
        if (schema.type === "string" && typeof value !== "string") return false;
        if (schema.type === "number" && typeof value !== "number") return false;
        if (schema.type === "boolean" && typeof value !== "boolean") return false;
        if (schema.type === "array" && !Array.isArray(value)) return false;
      }
    }
    return true;
  }

  private rowToTemplate(row: Record<string, unknown>): DiagramTemplate {
    return {
      id: row.id as string,
      category: row.category as DiagramCategory,
      name: row.name as string,
      description: row.description as string | undefined,
      svgTemplate: row.svg_template as string,
      variables: JSON.parse(row.variables as string),
      applicableChannels: JSON.parse(
        (row.applicable_channels as string) || "[]"
      ),
      complexityLevel: (row.complexity_level as number) || 1,
      createdAt: row.created_at as number,
      updatedAt: row.updated_at as number,
    };
  }
}

export class DiagramCache {
  private cache: Map<string, GeneratedDiagram>;
  private hashIndex: Map<string, string>;
  private maxSize: number;

  constructor(maxSize = 1000) {
    this.cache = new Map();
    this.hashIndex = new Map();
    this.maxSize = maxSize;
  }

  async get(id: string): Promise<GeneratedDiagram | null> {
    return this.cache.get(id) || null;
  }

  async getByHash(hash: string): Promise<GeneratedDiagram | null> {
    const id = this.hashIndex.get(hash);
    if (!id) return null;
    return this.cache.get(id) || null;
  }

  async store(diagram: GeneratedDiagram): Promise<void> {
    if (this.cache.size >= this.maxSize) {
      const firstKey = this.cache.keys().next().value;
      if (firstKey) {
        const oldDiagram = this.cache.get(firstKey);
        if (oldDiagram) {
          this.hashIndex.delete(oldDiagram.hash);
        }
        this.cache.delete(firstKey);
      }
    }
    this.cache.set(diagram.id, diagram);
    this.hashIndex.set(diagram.hash, diagram.id);
  }

  async invalidate(id: string): Promise<void> {
    const diagram = this.cache.get(id);
    if (diagram) {
      this.hashIndex.delete(diagram.hash);
      this.cache.delete(id);
    }
  }
}

export class DiagramEngine {
  private db: Database;
  private dedupService: DeduplicationService;
  private styler: ChannelStyler;
  private templateLibrary: TemplateLibrary;
  private cache: DiagramCache;

  constructor(db?: Database) {
    this.db = db || this.createDefaultDb();
    this.dedupService = new DeduplicationService(this.db);
    this.styler = new ChannelStyler();
    this.templateLibrary = new TemplateLibrary(this.db);
    this.cache = new DiagramCache();
  }

  private createDefaultDb(): Database {
    return new Database(":memory:");
  }

  async initialize(): Promise<void> {
    this.createTables();
    await this.templateLibrary.loadTemplates();
  }

  private createTables(): void {
    this.db.exec(`
      CREATE TABLE IF NOT EXISTS diagram_templates (
        id TEXT PRIMARY KEY,
        category TEXT NOT NULL,
        name TEXT NOT NULL,
        description TEXT,
        svg_template TEXT NOT NULL,
        variables TEXT NOT NULL,
        applicable_channels TEXT,
        complexity_level INTEGER DEFAULT 1,
        created_at INTEGER DEFAULT (strftime('%s', 'now')),
        updated_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE TABLE IF NOT EXISTS generated_diagrams (
        id TEXT PRIMARY KEY,
        template_id TEXT NOT NULL,
        hash TEXT UNIQUE NOT NULL,
        svg_content TEXT NOT NULL,
        channel_id TEXT NOT NULL,
        source_question_id TEXT,
        topic_keywords TEXT,
        variable_snapshot TEXT,
        created_at INTEGER DEFAULT (strftime('%s', 'now'))
      );

      CREATE INDEX IF NOT EXISTS idx_digrams_hash ON generated_diagrams(hash);
      CREATE INDEX IF NOT EXISTS idx_diagrams_channel ON generated_diagrams(channel_id);
      CREATE INDEX IF NOT EXISTS idx_diagrams_template ON generated_diagrams(template_id);
    `);
  }

  async generateDiagram(
    question: ContentQuestion,
    channel: Channel,
    options: DiagramOptions = {}
  ): Promise<GeneratedDiagram> {
    const category = this.detectCategory(question, channel);
    let template =
      options.templateId
        ? this.templateLibrary.findTemplate(category, channel.id)
        : this.templateLibrary.findTemplate(category, channel.id);

    if (!template) {
      template = this.getGenericTemplate();
    }

    const variables = this.extractVariables(question, template);
    if (options.customVariables) {
      Object.assign(variables, options.customVariables);
    }

    const hash = this.dedupService.generateHash(
      template.id,
      variables,
      channel.id
    );

    if (!options.regenerate) {
      const existing = await this.dedupService.getByHash(hash);
      if (existing) {
        return existing;
      }
    }

    const svg = this.renderSVG(template, variables, channel);
    const diagram: GeneratedDiagram = {
      id: randomUUID(),
      templateId: template.id,
      hash,
      svgContent: svg,
      channelId: channel.id,
      sourceQuestionId: question.id,
      topicKeywords: question.tags,
      variableSnapshot: variables,
      createdAt: Math.floor(Date.now() / 1000),
    };

    await this.persistDiagram(diagram);
    await this.cache.store(diagram);
    return diagram;
  }

  private detectCategory(
    question: ContentQuestion,
    channel: Channel
  ): DiagramCategory {
    const tags = question.tags || [];
    const dataStr = JSON.stringify(question.data).toLowerCase();
    const combined = [...tags, dataStr].join(" ");

    const categoryMap: [RegExp, DiagramCategory][] = [
      [/closure|scope|lexical/i, "closures"],
      [/promise|then|catch|async/i, "promises"],
      [/event loop|eventqueue/i, "event-loop"],
      [/prototype|__proto__|inherit/i, "prototypes"],
      [/hook|useeffect|usestate/i, "hooks-lifecycle"],
      [/component|props|children/i, "component-tree"],
      [/state|reducer|dispatch/i, "state-flow"],
      [/ci\/cd|pipeline|deploy/i, "cicd-pipeline"],
      [/docker|container|image/i, "docker-arch"],
      [/pod|service|ingress/i, "pod-lifecycle"],
      [/tcp|udp|socket/i, "tcpip-layers"],
      [/dns|resolve|lookup/i, "dns-resolution"],
      [/http|request|response/i, "http-flow"],
      [/load balance|round.?rob|weighted/i, "load-balancing"],
      [/cache|redis|memcache/i, "caching-strategies"],
      [/shard|partition|replica/i, "db-sharding"],
      [/vpc|subnet|route.?table/i, "vpc-design"],
      [/lambda|function/i, "lambda-execution"],
      [/terraform|resource|provider/i, "resource-deps"],
      [/sort|merge.?sort|quick.?sort/i, "sorting"],
      [/tree|bst|traversal|bfs|dfs/i, "tree-traversal"],
      [/graph|edge|vertex|node/i, "graph-algorithms"],
      [/big.?o|complexity|n\.?log/i, "big-o-charts"],
    ];

    for (const [pattern, category] of categoryMap) {
      if (pattern.test(combined)) {
        return category;
      }
    }

    return "generic";
  }

  private extractVariables(
    question: ContentQuestion,
    template: DiagramTemplate
  ): Record<string, unknown> {
    const variables: Record<string, unknown> = {};
    for (const schema of template.variables) {
      const value =
        question.data[schema.name] ||
        question.data[schema.name.replace(/_/g, "")] ||
        schema.default;
      variables[schema.name] = value;
    }
    return variables;
  }

  private renderSVG(
    template: DiagramTemplate,
    variables: Record<string, unknown>,
    channel: Channel
  ): string {
    let svg = template.svgTemplate;

    for (const [key, value] of Object.entries(variables)) {
      const placeholder = new RegExp(`\\{\\{${key}\\}\\}`, "g");
      svg = svg.replace(placeholder, String(value));
    }

    const theme = this.styler.getTheme(channel.id);
    svg = this.styler.applyTheme(svg, theme);

    return svg;
  }

  private getGenericTemplate(): DiagramTemplate {
    return {
      id: "generic-default",
      category: "generic",
      name: "Generic Diagram",
      svgTemplate: `<svg viewBox="0 0 400 200" xmlns="http://www.w3.org/2000/svg">
  <style>
    .box { fill: {{PRIMARY_COLOR}}; stroke: {{SECONDARY_COLOR}}; stroke-width: 2; }
    .text { font-family: {{FONT_FAMILY}}; font-size: 14px; fill: {{SECONDARY_COLOR}}; }
  </style>
  <rect class="box" x="50" y="50" width="300" height="100" rx="{{BORDER_RADIUS}}"/>
  <text class="text" x="200" y="105" text-anchor="middle">{{title}}</text>
</svg>`,
      variables: [{ name: "title", type: "string", required: true, default: "Diagram" }],
      applicableChannels: [],
      complexityLevel: 1,
      createdAt: 0,
      updatedAt: 0,
    };
  }

  private async persistDiagram(diagram: GeneratedDiagram): Promise<void> {
    const stmt = this.db.prepare(`
      INSERT OR REPLACE INTO generated_diagrams 
      (id, template_id, hash, svg_content, channel_id, source_question_id, topic_keywords, variable_snapshot, created_at)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    stmt.run(
      diagram.id,
      diagram.templateId,
      diagram.hash,
      diagram.svgContent,
      diagram.channelId,
      diagram.sourceQuestionId || null,
      diagram.topicKeywords ? JSON.stringify(diagram.topicKeywords) : null,
      diagram.variableSnapshot ? JSON.stringify(diagram.variableSnapshot) : null,
      diagram.createdAt
    );
  }

  async getByHash(hash: string): Promise<GeneratedDiagram | null> {
    const cached = await this.cache.getByHash(hash);
    if (cached) return cached;
    return this.dedupService.getByHash(hash);
  }

  async getDiagramsForChannel(
    channelId: string,
    limit = 20
  ): Promise<GeneratedDiagram[]> {
    const stmt = this.db.prepare(
      "SELECT * FROM generated_diagrams WHERE channel_id = ? ORDER BY created_at DESC LIMIT ?"
    );
    const rows = stmt.all(channelId, limit) as Record<string, unknown>[];
    return rows.map((row) => ({
      id: row.id as string,
      templateId: row.template_id as string,
      hash: row.hash as string,
      svgContent: row.svg_content as string,
      channelId: row.channel_id as string,
      sourceQuestionId: row.source_question_id as string | undefined,
      topicKeywords: row.topic_keywords
        ? JSON.parse(row.topic_keywords as string)
        : undefined,
      variableSnapshot: row.variable_snapshot
        ? JSON.parse(row.variable_snapshot as string)
        : undefined,
      createdAt: row.created_at as number,
    }));
  }

  async deleteDuplicates(): Promise<{ deleted: number }> {
    const stmt = this.db.prepare(`
      DELETE FROM generated_diagrams 
      WHERE id NOT IN (
        SELECT MIN(id) FROM generated_diagrams GROUP BY hash
      )
    `);
    const result = stmt.run();
    return { deleted: this.db.changes };
  }
}

export { CHANNEL_THEMES };
