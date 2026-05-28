import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin, AuthError, ForbiddenError } from '@/lib/auth-utils';
import { apiOk, apiNoContent, apiError } from '@/lib/api-response';
import { db } from '@/lib/db';
import { users, healthEntries, goals } from '@/lib/db/schema';
import { eq, desc, sql } from 'drizzle-orm';

// ── GET /api/admin/users/[id] — детали пользователя ───────────────────────
export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    await requireAdmin();
    const { id } = await params;

    const user = db.select().from(users).where(eq(users.id, id)).get();
    if (!user) return apiError('Пользователь не найден', 404);

    const entries = db
      .select()
      .from(healthEntries)
      .where(eq(healthEntries.userId, id))
      .orderBy(desc(healthEntries.date))
      .limit(30)
      .all();

    const userGoals = db.select().from(goals).where(eq(goals.userId, id)).all();

    const [avgs] = db
      .select({
        avgSteps:     sql<number>`avg(steps)`,
        avgSleep:     sql<number>`avg(sleep_hours)`,
        avgHeartRate: sql<number>`avg(heart_rate)`,
        avgWeight:    sql<number>`avg(weight)`,
      })
      .from(healthEntries)
      .where(eq(healthEntries.userId, id))
      .all();

    return apiOk({
      user: { id: user.id, name: user.name, email: user.email, role: user.role, createdAt: user.createdAt },
      entries,
      goals: userGoals,
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
    console.error('[GET /api/admin/users/[id]]', err);
    return apiError('Ошибка сервера', 500);
  }
}

// ── DELETE /api/admin/users/[id] ───────────────────────────────────────────
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse | Response> {
  try {
    const adminId = await requireAdmin();
    const { id } = await params;

    if (id === adminId) {
      return apiError('Нельзя удалить собственный аккаунт', 400);
    }

    const target = db.select().from(users).where(eq(users.id, id)).get();
    if (!target) return apiError('Пользователь не найден', 404);

    db.delete(users).where(eq(users.id, id)).run();
    return apiNoContent();
  } catch (err) {
    if (err instanceof AuthError)    return apiError(err.message, 401) as NextResponse;
    if (err instanceof ForbiddenError) return apiError(err.message, 403) as NextResponse;
    console.error('[DELETE /api/admin/users/[id]]', err);
    return apiError('Ошибка сервера', 500) as NextResponse;
  }
}

// ── PATCH /api/admin/users/[id] — изменить роль ────────────────────────────
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
): Promise<NextResponse> {
  try {
    const adminId = await requireAdmin();
    const { id } = await params;

    if (id === adminId) {
      return apiError('Нельзя изменить собственную роль', 400) as NextResponse;
    }

    let body: unknown;
    try { body = await req.json(); } catch {
      return apiError('Неверный JSON', 400) as NextResponse;
    }

    const role = (body as { role?: string })?.role;
    if (role !== 'user' && role !== 'admin') {
      return apiError('Роль должна быть "user" или "admin"', 422) as NextResponse;
    }

    const target = db.select().from(users).where(eq(users.id, id)).get();
    if (!target) return apiError('Пользователь не найден', 404) as NextResponse;

    db.update(users).set({ role }).where(eq(users.id, id)).run();

    return apiOk({ id, role }) as NextResponse;
  } catch (err) {
    if (err instanceof AuthError)    return apiError(err.message, 401) as NextResponse;
    if (err instanceof ForbiddenError) return apiError(err.message, 403) as NextResponse;
    console.error('[PATCH /api/admin/users/[id]]', err);
    return apiError('Ошибка сервера', 500) as NextResponse;
  }
}
