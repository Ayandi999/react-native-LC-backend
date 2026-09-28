import { z } from "zod";

export const GoogleAuthSchema = z.object({
  idToken: z.string().optional(),
  accessToken: z.string().optional(),
  callbackURL: z.string().optional(),
});

export const GitHubAuthSchema = z.object({
  callbackURL: z.string().optional(),
});

export type GoogleAuthInput = z.infer<typeof GoogleAuthSchema>;
export type GitHubAuthInput = z.infer<typeof GitHubAuthSchema>;
