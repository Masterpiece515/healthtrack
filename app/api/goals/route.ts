import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth-utils';
import { apiOk, apiError } from '@/lib/api-response';
import { getUserGoals, upsertGoal } from '@/lib/services/goals.service';
import { UpsertGoalSchema } from '@/lib/validators/goals.schema';
import { seedIfEmpty } from '@/lib/db/seed';

export async function GET(): Promise<NextResponse> {
  try {
    await seedIfEmpty();
    const userId = await requireUserId();
    const goals  = getUserGoals(userId);
    return apiOk({ goals });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 401) {
      return apiError('Необходима авторизация', 401);
    }
    console.error('[GET /api/goals]', err);
    return apiError('Ошибка сервера', 500);
  }
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  try {
    const userId = await requireUserId();

    let body: unknown;
    try { body = await req.json(); }
    catch { return apiError('Неверный JSON', 400); }

    const parsed = UpsertGoalSchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Ошибка валидации', 422);
    }

    upsertGoal(userId, parsed.data);
    return apiOk({ ok: true });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 401) {
      return apiError('Необходима авторизация', 401);
    }
    console.error('[POST /api/goals]', err);
    return apiError('Ошибка сервера', 500);
  }
}
