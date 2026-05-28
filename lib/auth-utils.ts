import { auth } from '@/auth';
import { NextResponse } from 'next/server';

type SessionUser = { id?: string; role?: string };

/** Возвращает ID текущего пользователя из сессии или null */
export async function getCurrentUserId(): Promise<string | null> {
  const session = await auth();
  return (session?.user as SessionUser)?.id ?? null;
}

/** Возвращает роль текущего пользователя из сессии или 'user' */
export async function getCurrentUserRole(): Promise<string> {
  const session = await auth();
  return (session?.user as SessionUser)?.role ?? 'user';
}

/** Возвращает ID пользователя или выбрасывает 401 ответ */
export async function requireUserId(): Promise<string> {
  const userId = await getCurrentUserId();
  if (!userId) throw new AuthError();
  return userId;
}

/** Возвращает ID пользователя, проверяя что он админ, или выбрасывает 401/403 */
export async function requireAdmin(): Promise<string> {
  const session = await auth();
  const user = session?.user as SessionUser | undefined;
  if (!user?.id) throw new AuthError();
  if (user.role !== 'admin') throw new ForbiddenError();
  return user.id;
}

/** Класс для 401 ошибки — перехватывается в route-хендлерах */
export class AuthError extends Error {
  readonly status = 401;
  constructor() { super('Необходима авторизация'); }
}

/** Класс для 403 ошибки */
export class ForbiddenError extends Error {
  readonly status = 403;
  constructor() { super('Доступ запрещён'); }
}

/** Обёртка для route-хендлеров с автоматической обработкой AuthError */
export function withAuth<T>(
  handler: (userId: string) => Promise<NextResponse<T>>
): () => Promise<NextResponse<T | { error: string }>> {
  return async () => {
    try {
      const userId = await requireUserId();
      return await handler(userId);
    } catch (err) {
      if (err instanceof AuthError) {
        return NextResponse.json({ error: err.message }, { status: 401 }) as NextResponse<{ error: string }>;
      }
      console.error('[withAuth]', err);
      return NextResponse.json({ error: 'Внутренняя ошибка сервера' }, { status: 500 }) as NextResponse<{ error: string }>;
    }
  };
}
