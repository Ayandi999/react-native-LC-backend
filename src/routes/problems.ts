import { Router } from "express";
import { problemController } from "../controllers/problem.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const problemsRouter = Router();

// GET /api/problems - List all problems
problemsRouter.get("/", (req, res, next) => problemController.getAllProblems(req, res, next));

// GET /api/problems/:id - Get problem details (Protected)
problemsRouter.get("/:id", requireAuth, (req, res, next) => problemController.getProblemById(req, res, next));

export default problemsRouter;
