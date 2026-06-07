import { NextResponse } from 'next/server';
import { requireUserId, AuthError } from '@/lib/auth-utils';
import { apiError, apiOk } from '@/lib/api-response';
import { db } from '@/lib/db';
import { healthEntries } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';

export async function POST(): Promise<NextResponse> {
  try {
    const userId = await requireUserId();

    // Получаем все записи пользователя, отсортированные по дате создания (старые первые)
    const all = db
      .select({ id: healthEntries.id, date: healthEntries.date, createdAt: healthEntries.createdAt })
      .from(healthEntries)
      .where(eq(healthEntries.userId, userId))
      .all()
      .sort((a, b) => a.createdAt.localeCompare(b.createdAt));

    // Для каждой даты оставляем только первую (самую старую) запись
    const seen   = new Set<string>();
    const toKeep = new Set<string>();
    for (const row of all) {
      if (!seen.has(row.date)) {
        seen.add(row.date);
        toKeep.add(row.id);
      }
    }

    // Удаляем все остальные
    const toDelete = all.filter(r => !toKeep.has(r.id));
    for (const row of toDelete) {
      db.delete(healthEntries)
        .where(eq(healthEntries.id, row.id))
        .run();
    }

    return apiOk({ removed: toDelete.length, kept: toKeep.size });
  } catch (err) {
    if (err instanceof AuthError) return apiError('Необходима авторизация', 401);
    console.error('[deduplicate]', err);
    return apiError('Ошибка', 500);
  }
}
