import { NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth-utils';
import { apiOk, apiError } from '@/lib/api-response';
import { getUserStreak } from '@/lib/services/health.service';
import { getUserEntries } from '@/lib/services/health.service';
import { seedIfEmpty } from '@/lib/db/seed';

export async function GET(): Promise<NextResponse> {
  try {
    await seedIfEmpty();
    const userId = await requireUserId();
    const streak  = getUserStreak(userId);
    const entries = getUserEntries(userId);
    return apiOk({
      currentStreak: streak.currentStreak,
      longestStreak: streak.longestStreak,
      totalEntries:  entries.length,
    });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 401) {
      return apiError('Необходима авторизация', 401);
    }
    return apiError('Ошибка сервера', 500);
  }
}
