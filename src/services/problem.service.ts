import { eq, or, asc } from "drizzle-orm";
import { db } from "../db/db.js";
import { problems } from "../db/schema.js";
import { NotFoundError } from "../utils/errors.js";

export class ProblemService {
  /**
   * Fetch all available LeetCode problems ordered by frontend question ID
   */
  async getAllProblems() {
    const list = await db
      .select({
        id: problems.id,
        questionId: problems.questionId,
        frontendQuestionId: problems.frontendQuestionId,
        title: problems.title,
        titleSlug: problems.titleSlug,
        difficulty: problems.difficulty,
        difficultyLevel: problems.difficultyLevel,
        paidOnly: problems.paidOnly,
        totalAcs: problems.totalAcs,
      })
      .from(problems)
      .orderBy(asc(problems.frontendQuestionId));

    return list;
  }

  /**
   * Fetch problem by UUID id, titleSlug, or numeric question/frontend ID
   */
  async getProblemByIdOrSlug(idOrSlug: string) {
    const isNumeric = /^\d+$/.test(idOrSlug);
    const numericId = isNumeric ? parseInt(idOrSlug, 10) : null;

    const conditions = [
      eq(problems.id, idOrSlug),
      eq(problems.titleSlug, idOrSlug.toLowerCase()),
    ];

    if (numericId !== null) {
      conditions.push(eq(problems.frontendQuestionId, numericId));
      conditions.push(eq(problems.questionId, numericId));
    }

    const [problem] = await db
      .select()
      .from(problems)
      .where(or(...conditions))
      .limit(1);

    if (!problem) {
      throw new NotFoundError(`Problem '${idOrSlug}' was not found`);
    }

    return problem;
  }
}

export const problemService = new ProblemService();
