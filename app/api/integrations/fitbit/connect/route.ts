import { NextResponse } from 'next/server';
import { requireUserId, AuthError } from '@/lib/auth-utils';
import { apiError } from '@/lib/api-response';

export async function GET() {
  try {
    await requireUserId();

    const clientId = process.env.FITBIT_CLIENT_ID;
    if (!clientId) return apiError('Fitbit не настроен: задайте FITBIT_CLIENT_ID', 500);

    const base       = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
    const redirectUri = `${base}/api/integrations/fitbit/callback`;

    const params = new URLSearchParams({
      response_type: 'code',
      client_id:     clientId,
      redirect_uri:  redirectUri,
      scope:         'activity heartrate sleep weight',
    });

    return NextResponse.redirect(`https://www.fitbit.com/oauth2/authorize?${params}`);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.redirect('/login');
    return apiError('Ошибка', 500);
  }
}
