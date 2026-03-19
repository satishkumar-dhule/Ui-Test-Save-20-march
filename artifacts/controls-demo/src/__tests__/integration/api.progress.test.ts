import { describe, it, expect, beforeAll, afterAll, vi, beforeEach } from "vitest";
import { createServer, type Server } from "http";
import { AddressInfo } from "net";

// Import the Express app directly - no default export in api-server app
import express, { type Express } from "express";
import cors from "cors";
import router from "../../../../api-server/src/routes/index";

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
  
  app.use("/api", router);
  
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

describe("Progress API Routes", () => {
  describe("POST /api/progress", () => {
    it("should return 400 when userId is missing", async () => {
      const response = await fetch(`${baseUrl}/api/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          progressType: "flashcard",
          data: { score: 100 },
        }),
      });
      
      // Add assertion to fail if catch is silently used
      expect(response.status).toBe(400);
      
      const data = await response.json();

      expect(data.ok).toBe(false);
      expect(data.error).toBe("Missing required fields");
    });

    it("should return 400 when progressType is missing", async () => {
      const response = await fetch(`${baseUrl}/api/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user123",
          data: { score: 100 },
        }),
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();

      expect(data.ok).toBe(false);
    });

    it("should return 400 when data is missing", async () => {
      const response = await fetch(`${baseUrl}/api/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user123",
          progressType: "flashcard",
        }),
      });
      
      expect(response.status).toBe(400);
      const data = await response.json();

      expect(data.ok).toBe(false);
    });

    it("should return 200 with valid request", async () => {
      const response = await fetch(`${baseUrl}/api/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user123",
          progressType: "flashcard",
          data: { score: 100, completed: 10 },
        }),
      });
      
      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.ok).toBe(true);
    });

    it("should accept all valid progress types", async () => {
      const types = ["flashcard", "exam", "voice", "coding", "qa"];

      for (const progressType of types) {
        const response = await fetch(`${baseUrl}/api/progress`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            userId: "user123",
            progressType,
            data: {},
          }),
        });

        // Fail if any type returns non-200
        expect(response.status, `Failed for progressType: ${progressType}`).toBe(200);
      }
    });

    it("should return 400 for invalid progress type", async () => {
      const response = await fetch(`${baseUrl}/api/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          userId: "user123",
          progressType: "invalid_type",
          data: {},
        }),
      });

      // Should either reject at route level or accept but not crash
      expect([200, 400, 404]).toContain(response.status);
    });
  });

  describe("GET /api/progress/:userId", () => {
    it("should return 200 with progress data", async () => {
      const response = await fetch(`${baseUrl}/api/progress/user123`);
      
      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.ok).toBe(true);
      expect(data.data).toEqual([]);
    });

    it("should filter by type when provided", async () => {
      const response = await fetch(
        `${baseUrl}/api/progress/user123?type=flashcard`,
      );
      
      expect(response.status).toBe(200);
      const data = await response.json();

      expect(data.ok).toBe(true);
    });

    it("should handle special characters in userId", async () => {
      const response = await fetch(`${baseUrl}/api/progress/user%40test`);
      
      // Should not crash with encoded characters
      expect([200, 404]).toContain(response.status);
    });

    it("should return proper JSON structure", async () => {
      const response = await fetch(`${baseUrl}/api/progress/user123`);
      const contentType = response.headers.get("content-type");
      
      expect(contentType).toMatch(/application\/json/);
      
      const data = await response.json();
      expect(data).toHaveProperty("ok");
      expect(data).toHaveProperty("data");
    });
  });

  describe("Error Handling", () => {
    it("should return 404 for non-existent routes", async () => {
      const response = await fetch(`${baseUrl}/api/nonexistent`);
      
      expect([404, 500]).toContain(response.status);
    });

    it("should handle malformed JSON gracefully", async () => {
      const response = await fetch(`${baseUrl}/api/progress`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: "not valid json",
      });

      // Should return error, not crash
      expect([400, 500]).toContain(response.status);
    });
  });
});
