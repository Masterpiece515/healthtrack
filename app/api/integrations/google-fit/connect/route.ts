import { NextResponse } from 'next/server';
import { requireUserId, AuthError } from '@/lib/auth-utils';
import { apiError } from '@/lib/api-response';

const SCOPES = [
  'https://www.googleapis.com/auth/fitness.activity.read',
  'https://www.googleapis.com/auth/fitness.sleep.read',
  'https://www.googleapis.com/auth/fitness.body.read',
  'https://www.googleapis.com/auth/fitness.heart_rate.read',
].join(' ');

export async function GET() {
  try {
    await requireUserId();

    const clientId    = process.env.GOOGLE_CLIENT_ID;
    const redirectUri = process.env.GOOGLE_REDIRECT_URI ?? `${process.env.AUTH_URL}/api/integrations/google-fit/callback`;

    if (!clientId) return apiError('GOOGLE_CLIENT_ID не настроен', 500);

    const url = new URL('https://accounts.google.com/o/oauth2/v2/auth');
    url.searchParams.set('client_id',     clientId);
    url.searchParams.set('redirect_uri',  redirectUri);
    url.searchParams.set('response_type', 'code');
    url.searchParams.set('scope',         SCOPES);
    url.searchParams.set('access_type',   'offline');
    url.searchParams.set('prompt',        'consent');

    return NextResponse.redirect(url.toString());
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.redirect('/login');
    return apiError('Ошибка', 500);
  }
}
