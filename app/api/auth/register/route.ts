import { NextRequest, NextResponse } from 'next/server';
import { apiCreated, apiError } from '@/lib/api-response';
import { createUser } from '@/lib/services/users.service';
import { createDefaultGoals } from '@/lib/services/goals.service';
import { RegisterSchema } from '@/lib/validators/auth.schema';

export async function POST(req: NextRequest): Promise<NextResponse> {
  let body: unknown;
  try { body = await req.json(); }
  catch { return apiError('Неверный JSON', 400); }

  const parsed = RegisterSchema.safeParse(body);
  if (!parsed.success) {
    return apiError(parsed.error.issues[0]?.message ?? 'Ошибка валидации', 422);
  }

  try {
    const user = await createUser(parsed.data);
    createDefaultGoals(user.id);
    return apiCreated({ ok: true, userId: user.id });
  } catch (e: unknown) {
    if (e instanceof Error && e.message === 'EMAIL_EXISTS') {
      return apiError('Пользователь с таким email уже существует', 409);
    }
    console.error('[POST /api/auth/register]', e);
    return apiError('Ошибка сервера', 500);
  }
}
