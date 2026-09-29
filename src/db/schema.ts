import {
  pgTable,
  text,
  varchar,
  integer,
  boolean,
  timestamp,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { user } from "./auth-schema.js";

// Re-export Better Auth schema
export * from "./auth-schema.js";

// 1. Problems Table (LeetCode problems from stat_status_pairs)
export const problems = pgTable(
  "problems",
  {
    id: text("id")
      .primaryKey()
      .$defaultFn(() => crypto.randomUUID()),
    questionId: integer("question_id").notNull().unique(),
    frontendQuestionId: integer("frontend_question_id").notNull(),
    title: varchar("title", { length: 255 }).notNull(),
    titleSlug: varchar("title_slug", { length: 255 }).notNull().unique(),
    difficulty: varchar("difficulty", { length: 50 }).notNull(), // 'Easy' | 'Medium' | 'Hard'
    difficultyLevel: integer("difficulty_level").notNull(), // 1, 2, 3
    paidOnly: boolean("paid_only").notNull().default(false),
    totalAcs: integer("total_acs").default(0),
    createdAt: timestamp("created_at").defaultNow().notNull(),
    updatedAt: timestamp("updated_at")
      .defaultNow()
      .$onUpdate(() => new Date())
      .notNull(),
  },
  (table) => [
    index("problems_title_slug_idx").on(table.titleSlug),
    index("problems_frontend_id_idx").on(table.frontendQuestionId),
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
    messages: jsonb("messages")
      .$type<
        Array<{
          id: string;
          role: "user" | "assistant" | "system";
          content: string;
          createdAt: string;
        }>
      >()
      .default([])
      .notNull(),
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
