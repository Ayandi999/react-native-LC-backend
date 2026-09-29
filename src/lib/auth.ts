import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "../db/db.js";
import * as schema from "../db/schema.js";

import { bearer } from "better-auth/plugins";

export const auth = betterAuth({
  baseURL:
    process.env.BETTER_AUTH_URL ||
    `http://localhost:${process.env.PORT || 8080}`,
  database: drizzleAdapter(db, {
    provider: "pg",
    schema: schema,
  }),
  plugins: [bearer()],
  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID || "",
      clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
    },
  },
  trustedOrigins: [
    "http://localhost:8080",
    "http://localhost:3000",
    "exp://*", // Expo Go for React Native
  ],
});
