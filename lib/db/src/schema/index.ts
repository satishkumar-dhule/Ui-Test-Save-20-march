import {
  pgTable,
  text,
  serial,
  integer,
  timestamp,
  boolean,
  pgEnum,
  jsonb,
} from "drizzle-orm/pg-core";

export const userRoleEnum = pgEnum("user_role", [
  "student",
  "instructor",
  "admin",
]);

export const contentTypeEnum = pgEnum("content_type", [
  "question",
  "flashcard",
  "coding_challenge",
]);

export const usersTable = pgTable("users", {
  id: serial("id").primaryKey(),
  email: text("email").notNull().unique(),
  name: text("name").notNull(),
  role: userRoleEnum("role").notNull().default("student"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const contentTable = pgTable("content", {
  id: serial("id").primaryKey(),
  type: contentTypeEnum("type").notNull(),
  title: text("title").notNull(),
  body: text("body").notNull(),
  options: jsonb("options"),
  answer: text("answer").notNull(),
  explanation: text("explanation"),
  difficulty: integer("difficulty").default(1),
  tags: text("tags").array(),
  authorId: integer("author_id").references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const quizzesTable = pgTable("quizzes", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  contentIds: integer("content_ids").array(),
  authorId: integer("author_id").references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export const examsTable = pgTable("exams", {
  id: serial("id").primaryKey(),
  title: text("title").notNull(),
  description: text("description"),
  quizId: integer("quiz_id").references(() => quizzesTable.id),
  timeLimit: integer("time_limit"),
  passingScore: integer("passing_score"),
  isPublished: boolean("is_published").default(false),
  authorId: integer("author_id").references(() => usersTable.id),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

export type User = typeof usersTable.$inferSelect;
export type Content = typeof contentTable.$inferSelect;
export type Quiz = typeof quizzesTable.$inferSelect;
export type Exam = typeof examsTable.$inferSelect;

export type InsertUser = Omit<User, "id" | "createdAt" | "updatedAt">;
export type InsertContent = Omit<Content, "id" | "createdAt" | "updatedAt">;
export type InsertQuiz = Omit<Quiz, "id" | "createdAt" | "updatedAt">;
export type InsertExam = Omit<Exam, "id" | "createdAt" | "updatedAt">;
