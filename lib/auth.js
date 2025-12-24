import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { isEmailAllowed } from "./access-list";
import { recordAuthAttempt } from "./auth-audit";

export const authOptions = {
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID || "",
      clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      authorization: {
        params: {
          prompt: "select_account",
        },
      },
    }),
  ],
  session: {
    strategy: "jwt",
  },
  callbacks: {
    async signIn({ user, account }) {
      const email = user?.email ? String(user.email).toLowerCase() : "";
      const provider = account?.provider || "google";

      if (!email) {
        try {
          await recordAuthAttempt({
            email: null,
            status: "denied",
            provider,
            reason: "missing_email",
          });
        } catch (error) {
          // Audit failures should not block auth flow.
        }
        return false;
      }

      const allowed = await isEmailAllowed(email);
      try {
        await recordAuthAttempt({
          email,
          status: allowed ? "allowed" : "denied",
          provider,
          reason: allowed ? "allowlist" : "not_allowed",
        });
      } catch (error) {
        // Audit failures should not block auth flow.
      }

      return allowed;
    },
    async jwt({ token, user }) {
      if (user?.email) {
        token.email = String(user.email).toLowerCase();
      }
      return token;
    },
    async session({ session, token }) {
      if (session?.user && token?.email) {
        session.user.email = token.email;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
    error: "/login",
  },
};

export async function getSessionEmail() {
  const session = await getServerSession(authOptions);
  const email = session?.user?.email;
  return email ? String(email).toLowerCase() : null;
}

export async function requireAuth() {
  const email = await getSessionEmail();
  if (!email) {
    return {
      email: null,
      response: NextResponse.json(
        { error: "Unauthorized." },
        { status: 401 }
      ),
    };
  }

  const allowed = await isEmailAllowed(email);
  if (!allowed) {
    return {
      email: null,
      response: NextResponse.json({ error: "Access denied." }, { status: 403 }),
    };
  }

  return { email, response: null };
}
