import { Router, type IRouter, type Response } from "express";
import { eq, like, or, and } from "drizzle-orm";
import {
  db,
  contentTable,
  usersTable,
  type Content,
  type InsertContent,
} from "@workspace/db";
import { authMiddleware, type AuthenticatedRequest } from "../middleware/auth";
import { AppError } from "../middleware/error";

const router: IRouter = Router();

router.get("/content", async (_req, res: Response) => {
  const content = await db.select().from(contentTable);
  res.json(content);
});

router.get("/content/:id", async (req, res: Response) => {
  const id = parseInt(req.params.id);
  if (isNaN(id)) {
    throw new AppError("Invalid content ID", 400);
  }

  const content = await db
    .select()
    .from(contentTable)
    .where(eq(contentTable.id, id));
  if (content.length === 0) {
    throw new AppError("Content not found", 404);
  }
  res.json(content[0]);
});

router.post(
  "/content",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      throw new AppError("Unauthorized", 401);
    }

    const body = req.body as Partial<InsertContent>;
    if (!body.type || !body.title || !body.body || !body.answer) {
      throw new AppError(
        "Missing required fields: type, title, body, answer",
        400,
      );
    }

    const newContent: InsertContent = {
      type: body.type,
      title: body.title,
      body: body.body,
      options: body.options ?? null,
      answer: body.answer,
      explanation: body.explanation ?? null,
      difficulty: body.difficulty ?? 1,
      tags: body.tags ?? [],
      authorId: user.id,
    };

    const result = await db.insert(contentTable).values(newContent).returning();
    res.status(201).json(result[0]);
  },
);

router.put(
  "/content/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      throw new AppError("Unauthorized", 401);
    }

    const idParam = req.params.id;
    const id =
      typeof idParam === "string" ? parseInt(idParam) : parseInt(idParam[0]);
    if (isNaN(id)) {
      throw new AppError("Invalid content ID", 400);
    }

    const existing = await db
      .select()
      .from(contentTable)
      .where(eq(contentTable.id, id));
    if (existing.length === 0) {
      throw new AppError("Content not found", 404);
    }

    if (existing[0].authorId !== user.id && user.role !== "admin") {
      throw new AppError(
        "Forbidden: Cannot update content you didn't create",
        403,
      );
    }

    const body = req.body as Partial<InsertContent>;
    const updated = await db
      .update(contentTable)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(contentTable.id, id))
      .returning();

    res.json(updated[0]);
  },
);

router.delete(
  "/content/:id",
  authMiddleware,
  async (req: AuthenticatedRequest, res: Response) => {
    const user = req.user;
    if (!user) {
      throw new AppError("Unauthorized", 401);
    }

    const idParam = req.params.id;
    const id =
      typeof idParam === "string" ? parseInt(idParam) : parseInt(idParam[0]);
    if (isNaN(id)) {
      throw new AppError("Invalid content ID", 400);
    }

    const existing = await db
      .select()
      .from(contentTable)
      .where(eq(contentTable.id, id));
    if (existing.length === 0) {
      throw new AppError("Content not found", 404);
    }

    if (existing[0].authorId !== user.id && user.role !== "admin") {
      throw new AppError(
        "Forbidden: Cannot delete content you didn't create",
        403,
      );
    }

    await db.delete(contentTable).where(eq(contentTable.id, id));
    res.status(204).send();
  },
);

router.get("/search", async (req, res: Response) => {
  const query = Array.isArray(req.query.q) ? req.query.q[0] : req.query.q;
  const type = Array.isArray(req.query.type)
    ? req.query.type[0]
    : req.query.type;

  if (!query) {
    throw new AppError("Search query is required", 400);
  }

  let conditions = [
    like(contentTable.title, `%${query}%`),
    like(contentTable.body, `%${query}%`),
  ];

  if (type) {
    conditions.push(eq(contentTable.type, type as any));
  }

  const results = await db
    .select()
    .from(contentTable)
    .where(and(...conditions));
  res.json(results);
});

export default router;
