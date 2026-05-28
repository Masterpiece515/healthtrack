import NextAuth from 'next-auth';
import Credentials from 'next-auth/providers/credentials';
import Google from 'next-auth/providers/google';
import bcrypt from 'bcryptjs';
import { db } from '@/lib/db';
import { users } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { authConfig } from '@/auth.config';
import { randomUUID } from 'crypto';

export const { handlers, auth, signIn, signOut } = NextAuth({
  ...authConfig,
  trustHost: true,
  secret: process.env.AUTH_SECRET,
  providers: [
    Google({
      clientId:     process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    Credentials({
      credentials: {
        email:    { label: 'Email',  type: 'email'    },
        password: { label: 'Пароль', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) return null;

        const [user] = db
          .select()
          .from(users)
          .where(eq(users.email, String(credentials.email).toLowerCase().trim()))
          .all();

        if (!user) return null;

        // Аккаунт только через Google — пароля нет; bcrypt.compare('', ...) может зависнуть
        const hash = user.passwordHash;
        if (!hash || !hash.startsWith('$2')) {
          return null;
        }

        const valid = await bcrypt.compare(String(credentials.password), hash);
        if (!valid) return null;

        return { id: user.id, name: user.name, email: user.email, role: user.role };
      },
    }),
  ],
  callbacks: {
    async signIn({ user, account }) {
      if (account?.provider === 'google') {
        if (!user.email) return false;
        const email = user.email.toLowerCase();
        const existing = db.select().from(users).where(eq(users.email, email)).get();
        if (!existing) {
          const newId = randomUUID();
          db.insert(users).values({
            id:           newId,
            name:         user.name ?? user.email.split('@')[0],
            email,
            passwordHash: '',
            createdAt:    new Date().toISOString(),
          }).run();
          user.id = newId;
        } else {
          user.id = existing.id;
        }
      }

      // Локальная разработка / диплом: через .env назначить администратора без правки SQLite вручную
      const adminEmails = (process.env.AUTH_ADMIN_EMAILS ?? '')
        .split(/[,;\s]+/)
        .map((e) => e.trim().toLowerCase())
        .filter(Boolean);
      if (user.email && adminEmails.includes(user.email.toLowerCase())) {
        db.update(users).set({ role: 'admin' }).where(eq(users.email, user.email.toLowerCase())).run();
      }

      return true;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    jwt({ token, user }: { token: any; user: any }) {
      if (user?.id) {
        token.id = user.id as string;
      }
      if (user && 'role' in user && (user as { role?: string }).role) {
        token.role = (user as { role: string }).role;
      }
      // Роль всегда из БД (OAuth не передаёт role; после ручного UPDATE сессия обновится)
      if (token.id) {
        const row = db.select({ role: users.role }).from(users).where(eq(users.id, String(token.id))).get();
        if (row) token.role = row.role;
      }
      if (!token.role) token.role = 'user';
      return token;
    },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    session({ session, token }: { session: any; token: any }) {
      if (token.id) session.user.id = token.id as string;
      session.user.role = (token.role as string) ?? 'user';
      return session;
    },
  },
});
