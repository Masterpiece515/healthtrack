import { NextResponse } from 'next/server';
import { requireAdmin, AuthError, ForbiddenError } from '@/lib/auth-utils';
import { apiOk, apiError } from '@/lib/api-response';
import { db } from '@/lib/db';
import { users, healthEntries } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

// ── GET /api/admin/stats ───────────────────────────────────────────────────
export async function GET(): Promise<NextResponse> {
  try {
    await requireAdmin();

    const todayStr = new Date().toISOString().slice(0, 10);
    const weekAgo  = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);

    const [totalUsers]   = db.select({ count: sql<number>`count(*)` }).from(users).all();
    const [totalEntries] = db.select({ count: sql<number>`count(*)` }).from(healthEntries).all();

    const [newToday] = db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(sql`date(created_at) = ${todayStr}`)
      .all();

    const [newThisWeek] = db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(sql`date(created_at) >= ${weekAgo}`)
      .all();

    // Пользователи с записями за последние 7 дней
    const [activeUsers] = db
      .select({ count: sql<number>`count(distinct user_id)` })
      .from(healthEntries)
      .where(sql`date >= ${weekAgo}`)
      .all();

    const [adminCount] = db
      .select({ count: sql<number>`count(*)` })
      .from(users)
      .where(sql`role = 'admin'`)
      .all();

    return apiOk({
      totalUsers:   Number(totalUsers.count),
      totalEntries: Number(totalEntries.count),
      newToday:     Number(newToday.count),
      newThisWeek:  Number(newThisWeek.count),
      activeUsers:  Number(activeUsers.count),
      adminCount:   Number(adminCount.count),
    });
  } catch (err) {
    if (err instanceof AuthError)    return apiError(err.message, 401);
    if (err instanceof ForbiddenError) return apiError(err.message, 403);
    console.error('[GET /api/admin/stats]', err);
    return apiError('Ошибка сервера', 500);
  }
}
