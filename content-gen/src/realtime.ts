import { WebSocketServer, WebSocket } from "ws";
import { randomUUID } from "crypto";
import type { Server as HTTPServer } from "http";
import type { Server as HTTPSServer } from "https";

type HTTPServerType = HTTPServer | HTTPSServer;

export interface ContentEvent {
  type: "progress" | "complete" | "error" | "stats";
  taskId: string;
  agentId?: string;
  data: object;
  timestamp: Date;
}

export interface ProgressData {
  percentage: number;
  message: string;
  phase?: string;
}

export interface CompleteData {
  contentId: string;
  type: string;
  channelId: string;
  qualityScore: number;
}

export interface ErrorData {
  message: string;
  retryable: boolean;
}

export interface StatsData {
  totalTasks: number;
  completedTasks: number;
  failedTasks: number;
  pendingTasks: number;
  runningTasks: number;
  workers: {
    id: string;
    status: string;
    tasksCompleted: number;
  }[];
  throughput: number;
}

interface Client {
  id: string;
  socket: WebSocket;
  connectedAt: number;
  lastPingAt: number;
  isAlive: boolean;
}

const RECONNECT_DELAY_MS = 1000;
const MAX_RECONNECT_DELAY_MS = 30000;
const PING_INTERVAL_MS = 30000;
const STATS_BROADCAST_INTERVAL_MS = 5000;

export class RealtimeServer {
  private wss: WebSocketServer | null = null;
  private clients: Map<string, Client> = new Map();
  private httpServer: HTTPServerType | null = null;
  private pingInterval: NodeJS.Timeout | null = null;
  private statsInterval: NodeJS.Timeout | null = null;
  private onConnectCallbacks: ((clientId: string) => void)[] = [];
  private onDisconnectCallbacks: ((clientId: string) => void)[] = [];
  private reconnectAttempts: Map<string, number> = new Map();

  constructor(server?: HTTPServerType) {
    if (server) {
      this.httpServer = server;
      this.attach(server);
    }
  }

  attach(server: HTTPServerType): void {
    if (this.wss) {
      this.close();
    }

    this.httpServer = server;
    this.wss = new WebSocketServer({ server, path: "/ws/realtime" });

    this.wss.on("connection", (socket, request) => {
      this.handleConnection(socket, request);
    });

    this.startPingInterval();
  }

  private handleConnection(socket: WebSocket, request: { url?: string }): void {
    const clientId = this.extractClientId(request.url) || randomUUID();

    const client: Client = {
      id: clientId,
      socket,
      connectedAt: Date.now(),
      lastPingAt: Date.now(),
      isAlive: true,
    };

    this.clients.set(clientId, client);
    this.reconnectAttempts.delete(clientId);

    socket.on("pong", () => {
      client.lastPingAt = Date.now();
      client.isAlive = true;
    });

    socket.on("message", (data) => {
      this.handleMessage(clientId, data.toString());
    });

    socket.on("close", (code, reason) => {
      this.handleDisconnect(clientId, code, reason?.toString());
    });

    socket.on("error", (error) => {
      console.error(`Client ${clientId} error:`, error.message);
    });

    this.sendToClient(clientId, {
      type: "connected",
      clientId,
      timestamp: new Date(),
    });

    this.onConnectCallbacks.forEach((cb) => cb(clientId));
  }

  private extractClientId(url?: string): string | null {
    if (!url) return null;
    const params = new URLSearchParams(url.split("?")[1]);
    return params.get("clientId");
  }

  private handleMessage(clientId: string, data: string): void {
    try {
      const message = JSON.parse(data);

      if (message.type === "ping") {
        const client = this.clients.get(clientId);
        if (client) {
          client.lastPingAt = Date.now();
          this.sendToClient(clientId, { type: "pong", timestamp: new Date() });
        }
      } else if (message.type === "subscribe") {
        this.sendToClient(clientId, {
          type: "subscribed",
          channels: message.channels || [],
          timestamp: new Date(),
        });
      }
    } catch {
      console.warn(`Invalid message from client ${clientId}`);
    }
  }

  private handleDisconnect(
    clientId: string,
    code: number,
    reason?: string,
  ): void {
    const client = this.clients.get(clientId);
    if (client) {
      client.isAlive = false;
    }

    this.clients.delete(clientId);
    this.onDisconnectCallbacks.forEach((cb) => cb(clientId));

    if (!reason?.includes("reconnect")) {
      this.scheduleReconnect(clientId);
    }
  }

  private scheduleReconnect(clientId: string): void {
    const attempts = this.reconnectAttempts.get(clientId) || 0;
    const delay = Math.min(
      RECONNECT_DELAY_MS * Math.pow(2, attempts),
      MAX_RECONNECT_DELAY_MS,
    );

    this.reconnectAttempts.set(clientId, attempts + 1);

    setTimeout(() => {
      if (!this.clients.has(clientId)) {
        console.log(`Client ${clientId} reconnection window expired`);
        this.reconnectAttempts.delete(clientId);
      }
    }, delay);
  }

  private startPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
    }

    this.pingInterval = setInterval(() => {
      this.clients.forEach((client) => {
        if (!client.isAlive) {
          client.socket.terminate();
          return;
        }

        client.isAlive = false;
        client.socket.ping();
      });
    }, PING_INTERVAL_MS);
  }

  private sendToClient(clientId: string, data: object): boolean {
    const client = this.clients.get(clientId);
    if (!client || client.socket.readyState !== WebSocket.OPEN) {
      return false;
    }

    try {
      client.socket.send(JSON.stringify(data));
      return true;
    } catch {
      return false;
    }
  }

  broadcast(event: ContentEvent): void {
    const message = JSON.stringify(event);
    const deadClients: string[] = [];

    this.clients.forEach((client) => {
      if (client.socket.readyState === WebSocket.OPEN) {
        try {
          client.socket.send(message);
        } catch {
          deadClients.push(client.id);
        }
      }
    });

    deadClients.forEach((id) => {
      const client = this.clients.get(id);
      if (client) {
        client.socket.terminate();
      }
      this.clients.delete(id);
    });
  }

  broadcastProgress(
    taskId: string,
    percentage: number,
    message: string,
    agentId?: string,
    phase?: string,
  ): void {
    this.broadcast({
      type: "progress",
      taskId,
      agentId,
      data: { percentage, message, phase } as ProgressData,
      timestamp: new Date(),
    });
  }

  broadcastComplete(
    taskId: string,
    contentId: string,
    type: string,
    channelId: string,
    qualityScore: number,
    agentId?: string,
  ): void {
    this.broadcast({
      type: "complete",
      taskId,
      agentId,
      data: {
        contentId,
        type,
        channelId,
        qualityScore,
      } as CompleteData,
      timestamp: new Date(),
    });
  }

  broadcastError(
    taskId: string,
    message: string,
    retryable: boolean = false,
    agentId?: string,
  ): void {
    this.broadcast({
      type: "error",
      taskId,
      agentId,
      data: { message, retryable } as ErrorData,
      timestamp: new Date(),
    });
  }

  startStatsBroadcast(getStats: () => object): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }

    this.statsInterval = setInterval(() => {
      if (this.clients.size === 0) return;

      const stats = getStats();
      this.broadcast({
        type: "stats",
        taskId: "system",
        data: stats,
        timestamp: new Date(),
      });
    }, STATS_BROADCAST_INTERVAL_MS);
  }

  stopStatsBroadcast(): void {
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
      this.statsInterval = null;
    }
  }

  onClientConnect(cb: (client: string) => void): void {
    this.onConnectCallbacks.push(cb);
  }

  onClientDisconnect(cb: (client: string) => void): void {
    this.onDisconnectCallbacks.push(cb);
  }

  getClientCount(): number {
    return this.clients.size;
  }

  getClients(): string[] {
    return Array.from(this.clients.keys());
  }

  close(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }

    this.stopStatsBroadcast();

    this.clients.forEach((client) => {
      client.socket.close(1001, "Server shutting down");
    });

    this.clients.clear();

    if (this.wss) {
      this.wss.close();
      this.wss = null;
    }
  }
}

export function createRealtimeServer(server?: HTTPServerType): RealtimeServer {
  return new RealtimeServer(server);
}
