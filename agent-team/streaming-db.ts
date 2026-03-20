import { GeneratedContent, StreamingUpdate } from "./types";

type ContentEventType =
  | "content:initialized"
  | "content:chunk"
  | "content:completed"
  | "content:progress";

interface ContentListener {
  id: string;
  callback: (data: unknown) => void;
  event: ContentEventType;
}

export class StreamingDBService {
  private contentStore: Map<string, GeneratedContent> = new Map();
  private listeners: ContentListener[] = [];

  constructor() {
    this.loadFromStorage();
  }

  private async loadFromStorage(): Promise<void> {
    if (typeof globalThis !== "undefined") {
      const stored = (globalThis as Record<string, unknown>).__agentDB as
        | Map<string, GeneratedContent>
        | undefined;
      if (stored) {
        this.contentStore = stored;
      }
    }
  }

  private saveToStorage(): void {
    if (typeof globalThis !== "undefined") {
      (globalThis as Record<string, unknown>).__agentDB = this.contentStore;
    }
  }

  async initializeContent(
    contentId: string,
    type: GeneratedContent["type"],
    filePath: string,
    agentId: string,
  ): Promise<void> {
    const content: GeneratedContent = {
      id: contentId,
      type,
      content: "",
      filePath,
      generatedAt: new Date(),
      streamedChunks: [],
      isComplete: false,
      agentId,
    };

    this.contentStore.set(contentId, content);
    this.saveToStorage();
    this.emit("content:initialized", { contentId, type, filePath, agentId });
  }

  async streamChunk(contentId: string, chunk: string): Promise<void> {
    const content = this.contentStore.get(contentId);
    if (!content) {
      throw new Error(`Content ${contentId} not found`);
    }

    content.streamedChunks.push(chunk);
    content.content += chunk;

    const progress = this.calculateProgress(content);

    this.saveToStorage();

    this.emit("content:chunk", {
      contentId,
      chunk,
      progress,
      timestamp: new Date(),
    });

    this.emit("content:progress", {
      taskId: contentId,
      agentId: content.agentId,
      chunk,
      progress,
      timestamp: new Date(),
    });
  }

  async completeContent(contentId: string): Promise<void> {
    const content = this.contentStore.get(contentId);
    if (!content) {
      throw new Error(`Content ${contentId} not found`);
    }

    content.isComplete = true;
    content.generatedAt = new Date();

    this.saveToStorage();
    this.emit("content:completed", { contentId, content });
  }

  async getContent(contentId: string): Promise<GeneratedContent | null> {
    return this.contentStore.get(contentId) || null;
  }

  async getContentByAgent(agentId: string): Promise<GeneratedContent[]> {
    return Array.from(this.contentStore.values()).filter(
      (c) => c.agentId === agentId,
    );
  }

  async getContentByStatus(complete: boolean): Promise<GeneratedContent[]> {
    return Array.from(this.contentStore.values()).filter(
      (c) => c.isComplete === complete,
    );
  }

  async getAllContent(): Promise<GeneratedContent[]> {
    return Array.from(this.contentStore.values());
  }

  private calculateProgress(content: GeneratedContent): number {
    const chunkCount = content.streamedChunks.length;
    if (chunkCount < 5) return Math.min(chunkCount * 10, 50);
    if (chunkCount < 10) return Math.min(50 + (chunkCount - 5) * 8, 90);
    return Math.min(90 + (chunkCount - 10) * 2, 99);
  }

  private emit(event: ContentEventType, data: unknown): void {
    this.listeners
      .filter((l) => l.event === event)
      .forEach((l) => l.callback(data));
  }

  on(event: ContentEventType, callback: (data: unknown) => void): () => void {
    const id = Math.random().toString(36);
    this.listeners.push({ id, callback, event });
    return () => {
      this.listeners = this.listeners.filter((l) => l.id !== id);
    };
  }

  off(event: ContentEventType, callback: (data: unknown) => void): void {
    this.listeners = this.listeners.filter(
      (l) => !(l.event === event && l.callback === callback),
    );
  }

  subscribe(callback: (update: StreamingUpdate) => void): () => void {
    return this.on("content:chunk", callback as (data: unknown) => void);
  }

  getProgress(contentId: string): number {
    const content = this.contentStore.get(contentId);
    if (!content) return 0;
    return this.calculateProgress(content);
  }

  async markTaskComplete(taskId: string): Promise<void> {
    const content = this.contentStore.get(taskId);
    if (content) {
      content.isComplete = true;
      this.saveToStorage();
    }
  }
}

export const streamingDB = new StreamingDBService();
