import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth-utils';
import { apiOk, apiNoContent, apiError } from '@/lib/api-response';
import { getEntryById, updateEntry, deleteEntry } from '@/lib/services/health.service';
import { UpdateHealthEntrySchema } from '@/lib/validators/health.schema';

type Params = { params: Promise<{ id: string }> };

// ── GET /api/health/[id] ──────────────────────────────────────────────────
export async function GET(_req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const entry  = getEntryById(userId, id);
    if (!entry) return apiError('Запись не найдена', 404);
    return apiOk(entry);
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 401) {
      return apiError('Необходима авторизация', 401);
    }
    return apiError('Ошибка сервера', 500);
  }
}

// ── PUT /api/health/[id] ──────────────────────────────────────────────────
export async function PUT(req: NextRequest, { params }: Params): Promise<NextResponse> {
  try {
    const userId = await requireUserId();
    const { id } = await params;

    let body: unknown;
    try { body = await req.json(); }
    catch { return apiError('Неверный JSON', 400); }

    const parsed = UpdateHealthEntrySchema.safeParse(body);
    if (!parsed.success) {
      return apiError(parsed.error.issues[0]?.message ?? 'Ошибка валидации', 422);
    }

    const updated = updateEntry(userId, id, parsed.data);
    if (!updated) return apiError('Запись не найдена', 404);
    return apiOk(updated);
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 401) {
      return apiError('Необходима авторизация', 401);
    }
    return apiError('Ошибка сервера', 500);
  }
}

// ── DELETE /api/health/[id] ───────────────────────────────────────────────
export async function DELETE(_req: NextRequest, { params }: Params): Promise<NextResponse | Response> {
  try {
    const userId = await requireUserId();
    const { id } = await params;
    const ok     = deleteEntry(userId, id);
    if (!ok) return apiError('Запись не найдена', 404);
    return apiNoContent();
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 401) {
      return apiError('Необходима авторизация', 401);
    }
    return apiError('Ошибка сервера', 500);
  }
}
