import { NextRequest, NextResponse } from 'next/server';
import { requireUserId } from '@/lib/auth-utils';
import { apiOk, apiError } from '@/lib/api-response';
import {
  findUserById, getUserSettings,
  changePassword, updateProfile, deleteAccount,
} from '@/lib/services/users.service';
import {
  ChangePasswordSchema,
  UpdateProfileSchema,
} from '@/lib/validators/auth.schema';

// ── GET /api/settings ─────────────────────────────────────────────────────
export async function GET(): Promise<NextResponse> {
  try {
    const userId  = await requireUserId();
    const user     = findUserById(userId);
    if (!user) return apiError('Пользователь не найден', 404);
    const settings = getUserSettings(userId);
    return apiOk({
      user:     { id: user.id, name: user.name, email: user.email, createdAt: user.createdAt },
      settings: { timezone: settings.timezone, units: settings.units },
    });
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 401) {
      return apiError('Необходима авторизация', 401);
    }
    return apiError('Ошибка сервера', 500);
  }
}

// ── PUT /api/settings ─────────────────────────────────────────────────────
export async function PUT(req: NextRequest): Promise<NextResponse> {
  try {
    const userId = await requireUserId();

    let body: unknown;
    try { body = await req.json(); }
    catch { return apiError('Неверный JSON', 400); }

    const b = body as Record<string, unknown>;

    // Смена пароля
    if (b.action === 'change_password') {
      const parsed = ChangePasswordSchema.safeParse(b);
      if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Ошибка', 422);
      try {
        await changePassword(userId, parsed.data.currentPassword, parsed.data.newPassword);
        return apiOk({ ok: true });
      } catch (e: unknown) {
        if (e instanceof Error && e.message === 'WRONG_PASSWORD') {
          return apiError('Неверный текущий пароль', 422);
        }
        if (e instanceof Error && e.message === 'NO_PASSWORD') {
          return apiError('Аккаунты Google не поддерживают смену пароля', 422);
        }
        throw e;
      }
    }

    // Обновление профиля
    if (b.action === 'update_profile') {
      const parsed = UpdateProfileSchema.safeParse(b);
      if (!parsed.success) return apiError(parsed.error.issues[0]?.message ?? 'Ошибка', 422);
      try {
        await updateProfile(userId, parsed.data);
        return apiOk({ ok: true });
      } catch (e: unknown) {
        if (e instanceof Error && e.message === 'EMAIL_EXISTS') {
          return apiError('Этот email уже используется', 422);
        }
        throw e;
      }
    }

    // Удаление аккаунта
    if (b.action === 'delete_account') {
      deleteAccount(userId);
      return apiOk({ ok: true });
    }

    return apiError('Неизвестное действие', 400);
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 401) {
      return apiError('Необходима авторизация', 401);
    }
    console.error('[PUT /api/settings]', err);
    return apiError('Ошибка сервера', 500);
  }
}
