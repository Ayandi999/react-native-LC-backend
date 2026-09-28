import type { Request, Response, NextFunction } from "express";
import { ProblemParamSchema } from "../validations/problem.validation.js";
import { problemService } from "../services/problem.service.js";
import type { AuthenticatedRequest } from "../middlewares/auth.js";

export class ProblemController {
  /**
   * List all available problems
   */
  async getAllProblems(req: Request, res: Response, next: NextFunction) {
    try {
      const allProblems = await problemService.getAllProblems();
      return res.json({
        success: true,
        count: allProblems.length,
        problems: allProblems,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Get single problem by ID or slug
   */
  async getProblemById(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      const validatedParams = ProblemParamSchema.parse(req.params);
      const problem = await problemService.getProblemByIdOrSlug(validatedParams.id);

      return res.json({
        success: true,
        problem,
        user: {
          id: req.user?.id,
          name: req.user?.name,
          email: req.user?.email,
        },
      });
    } catch (error) {
      next(error);
    }
  }
}

export const problemController = new ProblemController();
