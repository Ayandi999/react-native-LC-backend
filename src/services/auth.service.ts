import { auth } from "../lib/auth.js";
import { BadRequestError } from "../utils/errors.js";

export class AuthService {
  /**
   * Handle Google native mobile SDK ID Token verification
   */
  async loginWithGoogleIdToken(idToken: string, accessToken: string | undefined, headers: Headers) {
    try {
      const result = await auth.api.signInSocial({
        body: {
          provider: "google",
          idToken: {
            token: idToken,
            accessToken,
          },
        },
        headers,
      });
      return result;
    } catch (error: any) {
      throw new BadRequestError(error?.message || "Google token verification failed");
    }
  }

  /**
   * Generate Google OAuth redirect authorization URL
   */
  async getGoogleAuthUrl(callbackURL: string, headers: Headers): Promise<string> {
    try {
      const result = await auth.api.signInSocial({
        body: {
          provider: "google",
          callbackURL,
        },
        headers,
      });
      if (!result?.url) {
        throw new BadRequestError("Failed to obtain Google authorization URL");
      }
      return result.url;
    } catch (error: any) {
      if (error instanceof BadRequestError) throw error;
      throw new BadRequestError(error?.message || "Failed to initiate Google login");
    }
  }

  /**
   * Generate GitHub OAuth redirect authorization URL
   */
  async getGitHubAuthUrl(callbackURL: string, headers: Headers): Promise<string> {
    try {
      const result = await auth.api.signInSocial({
        body: {
          provider: "github",
          callbackURL,
        },
        headers,
      });
      if (!result?.url) {
        throw new BadRequestError("Failed to obtain GitHub authorization URL");
      }
      return result.url;
    } catch (error: any) {
      if (error instanceof BadRequestError) throw error;
      throw new BadRequestError(error?.message || "Failed to initiate GitHub login");
    }
  }

  /**
   * Invalidate current user session
   */
  async logout(headers: Headers) {
    try {
      await auth.api.signOut({
        headers,
      });
      return { success: true, message: "Logged out successfully" };
    } catch (error: any) {
      throw new BadRequestError(error?.message || "Failed to log out");
    }
  }
}

export const authService = new AuthService();
