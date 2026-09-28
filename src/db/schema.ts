import { pgTable, text, varchar, integer, timestamp, jsonb, index } from "drizzle-orm/pg-core";
import { user } from "./auth-schema.js";

// Re-export Better Auth schema
export * from "./auth-schema.js";

// 1. Problems Table (LeetCode problems)
export const problems = pgTable(
  "problems",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    slug: varchar("slug", { length: 255 }).notNull().unique(),
    title: varchar("title", { length: 255 }).notNull(),
    difficulty: varchar("difficulty", { length: 50 }).notNull(), // 'Easy' | 'Medium' | 'Hard'
    category: varchar("category", { length: 100 }), // e.g. 'Arrays & Hashing', 'Two Pointers'
    description: text("description").notNull(),
    starterCode: jsonb("starter_code").notNull(), // { javascript: string, python: string, ... }
    testCases: jsonb("test_cases").notNull(), // [{ input: any, expected: any, isHidden?: boolean }]
    constraints: jsonb("constraints"), // string[]
    hints: jsonb("hints"), // string[]
    defaultTimeLimitSeconds: integer("default_time_limit_seconds").notNull().default(1800), // 30 mins
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("problems_slug_idx").on(table.slug),
    index("problems_difficulty_idx").on(table.difficulty),
  ]
);

// 2. Interview Sessions Table (tracks each mock interview practice run)
export const interviewSessions = pgTable(
  "interview_sessions",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    problemId: text("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 50 }).notNull().default("in_progress"), // 'in_progress' | 'completed' | 'timed_out' | 'abandoned'
    submittedCode: text("submitted_code"),
    language: varchar("language", { length: 50 }).default("javascript"),
    timeSpentSeconds: integer("time_spent_seconds").default(0),
    finalScore: integer("final_score"), // 0 - 100
    finalEvaluation: jsonb("final_evaluation"), // Structured breakdown: { summary, rubricScores, feedback }
    startedAt: timestamp("started_at").defaultNow().notNull(),
    endedAt: timestamp("ended_at"),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("interview_sessions_user_idx").on(table.userId),
    index("interview_sessions_problem_idx").on(table.problemId),
    index("interview_sessions_status_idx").on(table.status),
  ]
);

// 3. Interview Messages Table (persistent transcript of the conversation)
export const interviewMessages = pgTable(
  "interview_messages",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    sessionId: text("session_id")
      .notNull()
      .references(() => interviewSessions.id, { onDelete: "cascade" }),
    role: varchar("role", { length: 50 }).notNull(), // 'user' | 'assistant' | 'system'
    content: text("content").notNull(),
    createdAt: timestamp("created_at").defaultNow().notNull(),
  },
  (table) => [
    index("interview_messages_session_idx").on(table.sessionId),
    index("interview_messages_created_idx").on(table.createdAt),
  ]
);

// 4. User Problem Stats (aggregate progress for mobile dashboard)
export const userProblemStats = pgTable(
  "user_problem_stats",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    userId: text("user_id")
      .notNull()
      .references(() => user.id, { onDelete: "cascade" }),
    problemId: text("problem_id")
      .notNull()
      .references(() => problems.id, { onDelete: "cascade" }),
    status: varchar("status", { length: 50 }).notNull().default("attempted"), // 'attempted' | 'solved'
    attemptsCount: integer("attempts_count").notNull().default(1),
    bestScore: integer("best_score").default(0),
    lastAttemptedAt: timestamp("last_attempted_at").defaultNow().notNull(),
    firstSolvedAt: timestamp("first_solved_at"),
  },
  (table) => [
    index("user_stats_user_problem_idx").on(table.userId, table.problemId),
  ]
);
