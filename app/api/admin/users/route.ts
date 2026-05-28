import { NextResponse } from 'next/server';
import { requireAdmin, AuthError, ForbiddenError } from '@/lib/auth-utils';
import { apiOk, apiError } from '@/lib/api-response';
import { db } from '@/lib/db';
import { users, healthEntries } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

// ── GET /api/admin/users ───────────────────────────────────────────────────
export async function GET(): Promise<NextResponse> {
  try {
    await requireAdmin();

    const rows = db.select({
      id:        users.id,
      name:      users.name,
      email:     users.email,
      role:      users.role,
      createdAt: users.createdAt,
    }).from(users).all();

    // Считаем кол-во записей на каждого пользователя
    const entryCounts = db
      .select({
        userId: healthEntries.userId,
        count:  sql<number>`count(*)`,
      })
      .from(healthEntries)
      .groupBy(healthEntries.userId)
      .all();

    const countMap = new Map(entryCounts.map(r => [r.userId, Number(r.count)]));

    const result = rows.map(u => ({
      ...u,
      entriesCount: countMap.get(u.id) ?? 0,
    }));

    return apiOk(result);
  } catch (err) {
    if (err instanceof AuthError)    return apiError(err.message, 401);
    if (err instanceof ForbiddenError) return apiError(err.message, 403);
    console.error('[GET /api/admin/users]', err);
    return apiError('Ошибка сервера', 500);
  }
}
