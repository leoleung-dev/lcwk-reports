import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import GoogleProvider from "next-auth/providers/google";
import { isEmailAllowed } from "./access-list";

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
    async signIn({ user }) {
      const email = user?.email;
      if (!email) {
        return false;
      }
      return isEmailAllowed(email);
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
