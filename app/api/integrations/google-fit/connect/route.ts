import { NextResponse } from 'next/server';
import { requireUserId, AuthError } from '@/lib/auth-utils';
import { apiError } from '@/lib/api-response';
import { db } from '@/lib/db';
import { integrations } from '@/lib/db/schema';

export async function GET() {
  try {
    const userId = await requireUserId();
    const base   = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000';

    // Google Fit REST API закрыт (июнь 2025). Используем демо-подключение:
    // сохраняем специальный маркер и перенаправляем на страницу успеха.
    db.insert(integrations).values({
      userId,
      googleAccessToken:  'demo_connected',
      googleRefreshToken: 'demo_refresh',
      googleTokenExpiry:  new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      updatedAt:          new Date().toISOString(),
    }).onConflictDoUpdate({
      target: integrations.userId,
      set: {
        googleAccessToken:  'demo_connected',
        googleRefreshToken: 'demo_refresh',
        googleTokenExpiry:  new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
        updatedAt:          new Date().toISOString(),
      },
    }).run();

    return NextResponse.redirect(new URL('/settings?integration=success', base));
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.redirect('/login');
    return apiError('Ошибка', 500);
  }
}
