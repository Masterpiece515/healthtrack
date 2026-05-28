import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth-utils';
import { apiOk, apiCreated, apiError } from '@/lib/api-response';
import { getUserEntries, createEntry, buildSummary } from '@/lib/services/health.service';
import { CreateHealthEntrySchema } from '@/lib/validators/health.schema';
import { seedIfEmpty } from '@/lib/db/seed';
import { db } from '@/lib/db';
import { integrations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import type { HealthListResponse, AddEntryResponse, ApiError } from '@/lib/types';

// ── GET /api/health ───────────────────────────────────────────────────────
export async function GET(): Promise<NextResponse<HealthListResponse | ApiError>> {
  try {
    await seedIfEmpty();
    const userId  = await requireUserId();
    const entries = getUserEntries(userId);
    const integration = db.select().from(integrations).where(eq(integrations.userId, userId)).get();
    const hasGoogleFit = !!(integration?.googleAccessToken);
    return apiOk({ entries, summary: buildSummary(entries), hasGoogleFit });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 401) {
      return apiError('Необходима авторизация', 401) as NextResponse<ApiError>;
    }
    console.error('[GET /api/health]', err);
    return apiError('Ошибка сервера', 500) as NextResponse<ApiError>;
  }
}

// ── POST /api/health ──────────────────────────────────────────────────────
export async function POST(
  req: NextRequest
): Promise<NextResponse<AddEntryResponse | ApiError>> {
  try {
    const userId = await requireUserId();

    let body: unknown;
    try {
      body = await req.json();
    } catch {
      return apiError('Неверный формат JSON', 400) as NextResponse<ApiError>;
    }

    const parsed = CreateHealthEntrySchema.safeParse(body);
    if (!parsed.success) {
      const msg = parsed.error.issues[0]?.message ?? 'Ошибка валидации';
      return apiError(msg, 422) as NextResponse<ApiError>;
    }

    const entry = createEntry(userId, parsed.data);
    const all   = getUserEntries(userId);
    const { healthScore } = buildSummary(all);

    return apiCreated({
      entry: { ...entry, calories: entry.calories ?? undefined, notes: entry.notes ?? undefined },
      healthScore,
    }) as NextResponse<AddEntryResponse>;
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 401) {
      return apiError('Необходима авторизация', 401) as NextResponse<ApiError>;
    }
    console.error('[POST /api/health]', err);
    return apiError('Ошибка сервера', 500) as NextResponse<ApiError>;
  }
}
