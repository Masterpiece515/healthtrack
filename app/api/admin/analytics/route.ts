import { NextResponse } from 'next/server';
import { requireAdmin, AuthError, ForbiddenError } from '@/lib/auth-utils';
import { apiOk, apiError } from '@/lib/api-response';
import { db } from '@/lib/db';
import { users, healthEntries } from '@/lib/db/schema';
import { sql } from 'drizzle-orm';

export async function GET(): Promise<NextResponse> {
  try {
    await requireAdmin();

    // Последние 30 дней
    const days: { date: string; users: number; entries: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = new Date(Date.now() - i * 86400000);
      days.push({ date: d.toISOString().slice(0, 10), users: 0, entries: 0 });
    }

    const since = days[0].date;

    const newUsers = db
      .select({ date: sql<string>`date(created_at)`, count: sql<number>`count(*)` })
      .from(users)
      .where(sql`date(created_at) >= ${since}`)
      .groupBy(sql`date(created_at)`)
      .all();

    const newEntries = db
      .select({ date: sql<string>`date(created_at)`, count: sql<number>`count(*)` })
      .from(healthEntries)
      .where(sql`date(created_at) >= ${since}`)
      .groupBy(sql`date(created_at)`)
      .all();

    const userMap  = new Map(newUsers.map(r  => [r.date,  Number(r.count)]));
    const entryMap = new Map(newEntries.map(r => [r.date,  Number(r.count)]));

    const chart = days.map(d => ({
      date:    d.date,
      users:   userMap.get(d.date)  ?? 0,
      entries: entryMap.get(d.date) ?? 0,
    }));

    // Топ-7 пользователей по количеству записей
    const topUsers = db
      .select({
        id:           users.id,
        name:         users.name,
        email:        users.email,
        role:         users.role,
        entriesCount: sql<number>`count(${healthEntries.id})`,
        lastEntry:    sql<string>`max(${healthEntries.date})`,
      })
      .from(users)
      .leftJoin(healthEntries, sql`${healthEntries.userId} = ${users.id}`)
      .groupBy(users.id)
      .orderBy(sql`count(${healthEntries.id}) desc`)
      .limit(7)
      .all()
      .map(u => ({ ...u, entriesCount: Number(u.entriesCount) }));

    // Распределение ролей
    const [adminCount] = db
      .select({ count: sql<number>`count(*)` })
      .from(users).where(sql`role = 'admin'`).all();
    const [userCount] = db
      .select({ count: sql<number>`count(*)` })
      .from(users).where(sql`role = 'user'`).all();

    // Средние значения метрик
    const [avgs] = db
      .select({
        avgSteps:      sql<number>`avg(steps)`,
        avgSleep:      sql<number>`avg(sleep_hours)`,
        avgHeartRate:  sql<number>`avg(heart_rate)`,
        avgWeight:     sql<number>`avg(weight)`,
      })
      .from(healthEntries)
      .all();

    return apiOk({
      chart,
      topUsers,
      roles: [
        { name: 'Пользователи', value: Number(userCount.count)  },
        { name: 'Администраторы', value: Number(adminCount.count) },
      ],
      avgs: {
        steps:     Math.round(Number(avgs?.avgSteps)     || 0),
        sleep:     Math.round((Number(avgs?.avgSleep)    || 0) * 10) / 10,
        heartRate: Math.round(Number(avgs?.avgHeartRate) || 0),
        weight:    Math.round((Number(avgs?.avgWeight)   || 0) * 10) / 10,
      },
    });
  } catch (err) {
    if (err instanceof AuthError)     return apiError(err.message, 401);
    if (err instanceof ForbiddenError) return apiError(err.message, 403);
    console.error('[GET /api/admin/analytics]', err);
    return apiError('Ошибка сервера', 500);
  }
}
