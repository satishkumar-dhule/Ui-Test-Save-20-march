import { AgentCapability, AgentStatus } from "../types";
import {
  pollinationsService,
  ChatMessage,
} from "../../artifacts/devprep/src/services/pollinations";
import { streamingDB } from "../streaming-db";

export interface PollinatorAgentConfig {
  id: string;
  name: string;
  systemPrompt: string;
  capabilities: AgentCapability[];
  status: AgentStatus;
}

export const POLLINATOR_AGENTS: PollinatorAgentConfig[] = [
  {
    id: "pollinator-001",
    name: "Code Assistant",
    systemPrompt:
      "You are an expert code assistant. Provide clear, well-commented code examples and explanations. Focus on best practices and modern patterns.",
    capabilities: ["code-review", "react-development", "component-design"],
    status: "idle",
  },
  {
    id: "pollinator-002",
    name: "Study Coach",
    systemPrompt:
      "You are a helpful study coach specializing in technical interview preparation. Provide comprehensive explanations with real-world examples.",
    capabilities: ["system-design", "architecture-review"],
    status: "idle",
  },
  {
    id: "pollinator-003",
    name: "Debug Helper",
    systemPrompt:
      "You are a skilled debug assistant. Help identify issues in code, explain error messages, and provide solutions with step-by-step guidance.",
    capabilities: ["unit-testing", "integration-testing"],
    status: "idle",
  },
];

export class PollinatorAgent {
  private agent: PollinatorAgentConfig;
  private conversationHistory: ChatMessage[] = [];

  constructor(agent: PollinatorAgentConfig) {
    this.agent = { ...agent };
  }

  get id(): string {
    return this.agent.id;
  }

  get name(): string {
    return this.agent.name;
  }

  get status(): AgentStatus {
    return this.agent.status;
  }

  get systemPrompt(): string {
    return this.agent.systemPrompt;
  }

  async *streamResponse(
    userMessage: string,
    onChunk?: (chunk: string) => void,
  ): AsyncGenerator<string, void, unknown> {
    this.agent.status = "working";

    const messageId = `msg-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    this.conversationHistory.push({ role: "user", content: userMessage });

    try {
      await streamingDB.initializeContent(
        messageId,
        "component",
        `conversation/${messageId}.md`,
        this.agent.id,
      );

      let fullResponse = "";

      for await (const chunk of pollinationsService.streamChat(
        this.conversationHistory,
        "openai",
        this.agent.systemPrompt,
      )) {
        if (onChunk) {
          onChunk(chunk.content);
        }

        if (chunk.content) {
          fullResponse += chunk.content;
          await streamingDB.streamChunk(messageId, chunk.content);
        }

        yield chunk.content;
      }

      this.conversationHistory.push({
        role: "assistant",
        content: fullResponse,
      });
      await streamingDB.completeContent(messageId);
    } finally {
      this.agent.status = "idle";
    }
  }

  clearHistory(): void {
    this.conversationHistory = [];
  }

  getHistory(): ChatMessage[] {
    return [...this.conversationHistory];
  }
}

export function createPollinatorAgent(
  config: PollinatorAgentConfig,
): PollinatorAgent {
  return new PollinatorAgent(config);
}

export function getAvailablePollinators(): PollinatorAgentConfig[] {
  return POLLINATOR_AGENTS.filter((a) => a.status === "idle");
}
