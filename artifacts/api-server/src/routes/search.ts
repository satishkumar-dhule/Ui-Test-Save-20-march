import { Router } from "express";
import type { Request, Response } from "express";

const router = Router();

router.get("/", async (req: Request, res: Response) => {
  const { q, type, channel, limit = "10" } = req.query;

  if (!q || typeof q !== "string") {
    res.status(400).json({ error: "Missing search query parameter 'q'" });
    return;
  }

  res.json({
    results: [],
    query: q,
    type: type || "all",
    channel: channel || "all",
    limit: parseInt(limit as string, 10),
    message: "Vector search coming soon. Currently returning empty results.",
    timestamp: new Date().toISOString(),
  });
});

router.post("/vector", async (req: Request, res: Response) => {
  const { query, limit = 10 } = req.body;

  if (!query || typeof query !== "string") {
    res.status(400).json({ error: "Missing query in request body" });
    return;
  }

  res.json({
    results: [],
    query,
    limit,
    message:
      "Vector search endpoint - to be implemented with FAISS integration",
    timestamp: new Date().toISOString(),
  });
});

export default router;
