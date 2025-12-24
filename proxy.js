import { withAuth } from "next-auth/middleware";

async function checkAllowlist(request) {
  const cookie = request.headers.get("cookie") || "";
  const url = new URL("/api/access/check", request.nextUrl.origin);

  const response = await fetch(url, {
    headers: {
      cookie,
    },
    cache: "no-store",
  });

  return response.ok;
}

export default withAuth({
  callbacks: {
    authorized: async ({ token, req }) => {
      if (!token) {
        return false;
      }

      try {
        return await checkAllowlist(req);
      } catch (error) {
        return false;
      }
    },
  },
  pages: {
    signIn: "/login",
  },
});

export const config = {
  matcher: [
    "/((?!api|_next/static|_next/image|favicon|favicon/|login|.*\\..*).*)",
  ],
};
