import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { bearer } from "better-auth/plugins";
import { NextRequest } from 'next/server';
import { headers } from "next/headers";
import { db } from "@/db";

export const auth = betterAuth({
 
  baseURL: process.env.BETTER_AUTH_URL || "https://packinsight.vercel.app",
  secret: process.env.BETTER_AUTH_SECRET,

  database: drizzleAdapter(db, {
    provider: "sqlite",
  }),

  emailAndPassword: {
    enabled: true,
  },

  socialProviders: {
    google: {
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    },
    github: {
      clientId: process.env.GITHUB_CLIENT_ID!,
      clientSecret: process.env.GITHUB_CLIENT_SECRET!,
    },
  },

  plugins: [bearer()],

  trustedOrigins: [
    "https://packinsight.vercel.app",
  ],

  // ADD THIS - Important for production cookies
  advanced: {
    useSecureCookies: true,
    crossSubDomainCookies: {
      enabled: false,
    },
  },
});

// Session validation helper
export async function getCurrentUser(request: NextRequest) {
  const session = await auth.api.getSession({ headers: await headers() });
  return session?.user || null;
}






