import { eq, or } from "drizzle-orm";
import { db } from "../db/db.js";
import { problems } from "../db/schema.js";
import { NotFoundError } from "../utils/errors.js";

export class ProblemService {
  /**
   * Fetch all available LeetCode problems
   */
  async getAllProblems() {
    const list = await db
      .select({
        id: problems.id,
        slug: problems.slug,
        title: problems.title,
        difficulty: problems.difficulty,
        category: problems.category,
        defaultTimeLimitSeconds: problems.defaultTimeLimitSeconds,
      })
      .from(problems);

    return list;
  }

  /**
   * Fetch problem by ID or slug
   */
  async getProblemByIdOrSlug(idOrSlug: string) {
    const [problem] = await db
      .select()
      .from(problems)
      .where(or(eq(problems.id, idOrSlug), eq(problems.slug, idOrSlug)))
      .limit(1);

    if (!problem) {
      throw new NotFoundError(`Problem '${idOrSlug}' was not found`);
    }

    return problem;
  }
}

export const problemService = new ProblemService();
