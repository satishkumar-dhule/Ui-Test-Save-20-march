import { EliteAgentConfig } from "./agents";
import { streamingDB } from "./streaming-db";
import { GeneratedContent, AgentCapability } from "./types";

export interface GenerationRequest {
  contentId: string;
  type: GeneratedContent["type"];
  filePath: string;
  prompt: string;
  capabilities: AgentCapability[];
}

export class AgentWorker {
  private agent: EliteAgentConfig;

  constructor(agent: EliteAgentConfig) {
    this.agent = agent;
  }

  getAgent(): EliteAgentConfig {
    return this.agent;
  }

  async generateContent(request: GenerationRequest): Promise<void> {
    await streamingDB.initializeContent(
      request.contentId,
      request.type,
      request.filePath,
      this.agent.id,
    );

    const chunks = this.splitIntoChunks(request.prompt);

    for (let i = 0; i < chunks.length; i++) {
      await this.delay(50 + Math.random() * 100);

      const generated = await this.generateChunk(
        chunks[i],
        request.type,
        i === chunks.length - 1,
      );
      await streamingDB.streamChunk(request.contentId, generated);
    }

    await streamingDB.completeContent(request.contentId);
  }

  private async generateChunk(
    prompt: string,
    type: GeneratedContent["type"],
    isLast: boolean,
  ): Promise<string> {
    const templates = this.getTemplates(type);
    const template = templates[Math.floor(Math.random() * templates.length)];

    const componentName = this.generateComponentName(prompt);
    const props = this.generateProps(type);
    const styles = this.generateStyles(type);

    return this.fillTemplate(template, {
      componentName,
      props,
      styles,
      prompt,
      isLast: String(isLast),
    });
  }

  private getTemplates(type: GeneratedContent["type"]): string[] {
    const templates: Record<GeneratedContent["type"], string[]> = {
      component: [
        `import React from 'react';\n\ninterface {{componentName}}Props {\n  {{props}}\n}\n\nexport const {{componentName}}: React.FC<{{componentName}}Props> = ({{#if props}}{{{props}}}{{/if}}) => {\n  return (\n    <div className="{{styles}}">\n      {{prompt}}\n    </div>\n  );\n};`,
        `function {{componentName}}({{{props}}}) {\n  return (\n    <section className="{{styles}}">\n      <h2>{{prompt}}</h2>\n    </section>\n  );\n}`,
      ],
      api: [
        `export async function {{componentName}}({{{props}}}) {\n  const response = await fetch('/api/{{prompt}}', {\n    method: 'POST',\n    headers: { 'Content-Type': 'application/json' },\n    body: JSON.stringify({{{props}}}),\n  });\n  return response.json();\n}`,
      ],
      style: [`.{{componentName}} {\n  {{styles}}\n}`],
      test: [
        `import { render, screen } from '@testing-library/react';\nimport { {{componentName}} } from './{{componentName}}';\n\ndescribe('{{componentName}}', () => {\n  it('renders {{prompt}}', () => {\n    render(<{{componentName}} />);\n    expect(screen.getByText(/{{prompt}}/i)).toBeInTheDocument();\n  });\n});`,
      ],
      config: [
        `// Configuration for {{prompt}}\nmodule.exports = {\n  {{props}}\n};`,
      ],
      docs: [`# {{componentName}}\n\n{{prompt}}\n\n## Props\n\n{{{props}}}\n`],
    };
    return templates[type] || templates.component;
  }

  private generateComponentName(prompt: string): string {
    const words = prompt.split(/\s+/).filter((w) => w.length > 3);
    const name = words
      .slice(0, 3)
      .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
      .join("");
    return name || "Component";
  }

  private generateProps(type: GeneratedContent["type"]): string {
    const propSets = {
      component:
        "title?: string;\n  children?: React.ReactNode;\n  className?: string;",
      api: "data: Record<string, unknown>;\n  token?: string;",
      config: "enabled: boolean;\n  debug?: boolean;",
      test: "props: Record<string, unknown>;",
      style: "theme: string;",
      docs: "section: string;",
    };
    return propSets[type] || propSets.component;
  }

  private generateStyles(type: GeneratedContent["type"]): string {
    const styleSets = {
      component: "padding: 1rem; border-radius: 8px;",
      api: "timeout: 3000;",
      config: "cache: true;",
      test: "coverage: 80;",
      style: "display: flex;",
      docs: "margin: 1rem;",
    };
    return styleSets[type] || styleSets.component;
  }

  private fillTemplate(template: string, data: Record<string, string>): string {
    return template.replace(
      /\{\{([^}]+)\}\}/g,
      (_, key) => data[key.trim()] || "",
    );
  }

  private splitIntoChunks(text: string): string[] {
    const words = text.split(/\s+/);
    const chunks: string[] = [];
    let current = "";

    for (const word of words) {
      if ((current + word).length > 50) {
        if (current) chunks.push(current);
        current = word;
      } else {
        current += (current ? " " : "") + word;
      }
    }
    if (current) chunks.push(current);

    return chunks.length > 0 ? chunks : [text];
  }

  private delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }
}

export function createAgentWorker(agent: EliteAgentConfig): AgentWorker {
  return new AgentWorker(agent);
}
