import type { NextAuthConfig } from "next-auth";

export const authConfig = {
  trustHost: true,
  session: { strategy: "jwt" },
  pages: { signIn: "/login" },
  providers: [],
  callbacks: {
    authorized({ auth, request }) {
      if (request.nextUrl.pathname.startsWith("/dashboard")) {
        return Boolean(auth?.user);
      }
      return true;
    },
    async jwt({ token, user }) {
      if (user) {
        token.userId = user.id;
        token.tenantId = user.tenantId;
        token.role = user.role;
      }
      return token;
    },
    async session({ session, token }) {
      session.user.id = String(token.userId ?? token.sub ?? "");
      session.user.tenantId = String(token.tenantId ?? "");
      session.user.role = String(token.role ?? "");
      return session;
    },
  },
} satisfies NextAuthConfig;
