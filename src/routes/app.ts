import express from "express";
import cors from "cors";
import { toNodeHandler } from "better-auth/node";
import { auth } from "../lib/auth.js";
import authRouter from "./auth.routes.js";
import problemsRouter from "./problems.js";
import { globalErrorHandler } from "../middlewares/errorHandler.js";
import { NotFoundError } from "../utils/errors.js";

const app = express();

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow mobile apps, localhost, and expo
      callback(null, true);
    },
    credentials: true,
  })
);

// Body parsing middleware
app.use(express.json());

// 1. Mobile Auth Routes (/signup, /login, /login-with-google, /login-with-github, /me, /logout)
app.use("/api/auth", authRouter);

// 2. Native Better Auth handler for OAuth callbacks and internal endpoints
app.all("/api/auth/*splat", toNodeHandler(auth));

// 3. Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "ok", timestamp: new Date().toISOString() });
});

// 4. LeetCode problems router
app.use("/api/problems", problemsRouter);

// 5. Catch-all 404 Handler
app.use((req, res, next) => {
  next(new NotFoundError(`Route ${req.method} ${req.originalUrl} not found`));
});

// 6. Global Error Handler (must be last)
app.use(globalErrorHandler);

export default app;
