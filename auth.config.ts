import type { NextAuthConfig } from 'next-auth';

export const authConfig = {
  pages: { signIn: '/login', error: '/login' },
  session: { strategy: 'jwt' as const },
  callbacks: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jwt({ token, user }: { token: any; user: any }) {
      if (user) {
        token.id   = user.id;
        token.role = (user as { role?: string }).role ?? 'user';
      }
      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session({ session, token }: { session: any; token: any }) {
      if (token.id)   session.user.id   = token.id   as string;
      if (token.role) session.user.role = token.role as string;
      return session;
    },
  },
  providers: [],
} satisfies NextAuthConfig;
