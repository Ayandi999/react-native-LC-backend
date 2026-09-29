import { Router } from "express";
import { authController } from "../controllers/auth.controller.js";
import { requireAuth } from "../middlewares/auth.js";

const authRouter = Router();

// Google Sign-In (Native ID token or Web OAuth redirect)
authRouter.post("/login-with-google", (req, res, next) =>
  authController.loginWithGoogle(req, res, next)
);
authRouter.get("/login-with-google", (req, res, next) =>
  authController.loginWithGoogle(req, res, next)
);

// GitHub Sign-In (Web OAuth redirect)
authRouter.post("/login-with-github", (req, res, next) =>
  authController.loginWithGitHub(req, res, next)
);
authRouter.get("/login-with-github", (req, res, next) =>
  authController.loginWithGitHub(req, res, next)
);

// Current User Profile & Logout (Protected)
authRouter.get("/me", requireAuth, (req, res, next) =>
  authController.getMe(req, res, next)
);
authRouter.post("/logout", requireAuth, (req, res, next) =>
  authController.logout(req, res, next)
);

export default authRouter;
