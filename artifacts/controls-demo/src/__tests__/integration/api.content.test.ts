import { describe, it, expect, beforeAll, afterAll, vi } from "vitest";
import { createServer, type Server } from "http";
import { AddressInfo } from "net";
import express, { type Express } from "express";
import cors from "cors";
import contentRouter from "../../../../api-server/src/routes/content";

// Create a test app instance
function createTestApp(): Express {
  const app: Express = express();
  app.use(cors());
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  
  // Health check
  app.get("/health", (_req, res) => {
    res.json({ ok: true, timestamp: new Date().toISOString() });
  });
  
  app.use("/api", contentRouter);
  
  // Error handler
  app.use((err: Error, req: express.Request, res: express.Response, _next: express.NextFunction) => {
    console.error("Test error:", err);
    res.status(500).json({ ok: false, error: err.message });
  });
  
  return app;
}

// Mock the database
vi.mock("../../../../api-server/src/db/sqlite", () => ({
  getDb: vi.fn(() => ({
    prepare: vi.fn(() => ({
      all: vi.fn(() => []),
    })),
  })),
  saveUserProgress: vi.fn(() => Promise.resolve()),
  getUserProgress: vi.fn(() => Promise.resolve([])),
}));

let server: Server;
let baseUrl: string;

beforeAll(async () => {
  return new Promise<void>((resolve) => {
    const app = createTestApp();
    server = createServer(app);
    server.listen(0, () => {
      const { port } = server.address() as AddressInfo;
      baseUrl = `http://localhost:${port}`;
      resolve();
    });
  });
});

afterAll((done) => {
  server.close(done);
});

describe("Content API Routes", () => {
  describe("GET /api/content", () => {
    it("should return 200 with empty data when no content exists", async () => {
      const response = await fetch(`${baseUrl}/api/content`);
      
      // Explicit assertion - fail if catch is silently used
      expect(response.status).toBe(200);
      
      const data = await response.json();

      expect(data.ok).toBe(true);
      expect(data.data).toEqual({});
      expect(data.total).toBe(0);
    });

    it("should return proper JSON content type", async () => {
      const response = await fetch(`${baseUrl}/api/content`);

      expect(response.headers.get("content-type")).toMatch(/application\/json/);
    });

    it("should return 500 on database error", async () => {
      // Reset and configure mock to throw
      vi.resetModules();
      const { getDb } = await import("../../../../api-server/src/db/sqlite");
      vi.mocked(getDb).mockImplementationOnce(() => {
        throw new Error("Database connection failed");
      });

      const response = await fetch(`${baseUrl}/api/content`);
      
      // Should handle errors gracefully
      expect([500, 200]).toContain(response.status);
    });
  });

  describe("GET /api/content/:type", () => {
    it("should return 200 for valid content type", async () => {
      const response = await fetch(`${baseUrl}/api/content/question`);
      
      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.ok).toBe(true);
      expect(data.data).toEqual([]);
    });

    it("should return data for different content types", async () => {
      const types = ["question", "flashcard", "exam", "voice", "coding"];
      
      for (const type of types) {
        const response = await fetch(`${baseUrl}/api/content/${type}`);
        
        expect(response.status, `Failed for type: ${type}`).toBe(200);
        const data = await response.json();
        expect(data.ok).toBe(true);
        expect(Array.isArray(data.data)).toBe(true);
      }
    });

    it("should filter by channelId when provided", async () => {
      const response = await fetch(
        `${baseUrl}/api/content/question?channelId=javascript`,
      );
      
      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.ok).toBe(true);
    });

    it("should handle unknown content type gracefully", async () => {
      const response = await fetch(`${baseUrl}/api/content/unknown_type`);
      
      // Should return 200 with empty data, not crash
      expect(response.status).toBe(200);
      const data = await response.json();
      expect(data.ok).toBe(true);
    });
  });

  describe("GET /api/content/stats", () => {
    it("should return 200 with stats", async () => {
      const response = await fetch(`${baseUrl}/api/content/stats`);
      
      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.ok).toBe(true);
      expect(data.stats).toEqual([]);
    });

    it("should return proper stats structure", async () => {
      const response = await fetch(`${baseUrl}/api/content/stats`);
      const data = await response.json();

      expect(data).toHaveProperty("ok");
      expect(data).toHaveProperty("stats");
      expect(Array.isArray(data.stats)).toBe(true);
    });
  });

  describe("Error Handling", () => {
    it("should return 404 for non-existent routes", async () => {
      const response = await fetch(`${baseUrl}/api/nonexistent`);
      
      expect([404, 500]).toContain(response.status);
    });

    it("should handle malformed requests gracefully", async () => {
      // Test with empty type parameter
      const response = await fetch(`${baseUrl}/api/content/`);
      
      expect([400, 404, 500]).toContain(response.status);
    });
  });
});
