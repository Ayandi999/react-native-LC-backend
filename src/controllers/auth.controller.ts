import type { Request, Response, NextFunction } from "express";
import { fromNodeHeaders } from "better-auth/node";
import {
  GoogleAuthSchema,
  GitHubAuthSchema,
} from "../validations/auth.validation.js";
import { authService } from "../services/auth.service.js";
import type { AuthenticatedRequest } from "../middlewares/auth.js";

export class AuthController {
  /**
   * Handle Google login (supports both native ID token and web OAuth redirect)
   */
  async loginWithGoogle(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = { ...req.query, ...req.body };
      const validatedData = GoogleAuthSchema.parse(payload);
      const headers = fromNodeHeaders(req.headers);

      // 1. Native Mobile SDK ID token flow (Play Store)
      if (validatedData.idToken) {
        const result = await authService.loginWithGoogleIdToken(
          validatedData.idToken,
          validatedData.accessToken,
          headers
        );
        return res.json({
          success: true,
          message: "Google login successful",
          ...result,
        });
      }

      // 2. Web / Expo browser redirect flow
      const callbackURL =
        validatedData.callbackURL || "mobleet://auth/callback";
      const authUrl = await authService.getGoogleAuthUrl(callbackURL, headers);

      // Return JSON if POST or Accept: application/json
      if (
        req.method === "POST" ||
        req.headers.accept?.includes("application/json")
      ) {
        return res.json({
          success: true,
          provider: "google",
          url: authUrl,
        });
      }

      return res.redirect(authUrl);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Handle GitHub login (web OAuth redirect URL)
   */
  async loginWithGitHub(req: Request, res: Response, next: NextFunction) {
    try {
      const payload = { ...req.query, ...req.body };
      const validatedData = GitHubAuthSchema.parse(payload);
      const headers = fromNodeHeaders(req.headers);
      const callbackURL =
        validatedData.callbackURL || "mobleet://auth/callback";

      const authUrl = await authService.getGitHubAuthUrl(callbackURL, headers);

      if (
        req.method === "POST" ||
        req.headers.accept?.includes("application/json")
      ) {
        return res.json({
          success: true,
          provider: "github",
          url: authUrl,
        });
      }

      return res.redirect(authUrl);
    } catch (error) {
      next(error);
    }
  }

  /**
   * Return authenticated user profile and session
   */
  async getMe(req: AuthenticatedRequest, res: Response, next: NextFunction) {
    try {
      return res.json({
        success: true,
        user: req.user,
        session: req.session,
      });
    } catch (error) {
      next(error);
    }
  }

  /**
   * Log out user and invalidate session
   */
  async logout(req: Request, res: Response, next: NextFunction) {
    try {
      const headers = fromNodeHeaders(req.headers);
      const result = await authService.logout(headers);
      return res.json(result);
    } catch (error) {
      next(error);
    }
  }
}

export const authController = new AuthController();
