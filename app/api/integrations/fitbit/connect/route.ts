import { NextResponse } from 'next/server';
import { requireUserId, AuthError } from '@/lib/auth-utils';
import { apiError } from '@/lib/api-response';

// Google Health API (преемник Fitbit Web API) использует стандартный Google OAuth 2.0
const SCOPES = [
  'https://www.googleapis.com/auth/googlehealth.activity_and_fitness.readonly',
  'https://www.googleapis.com/auth/googlehealth.sleep.readonly',
  'https://www.googleapis.com/auth/googlehealth.health_metrics_and_measurements.readonly',
].join(' ');

export async function GET() {
  try {
    await requireUserId();

    const clientId = process.env.GOOGLE_CLIENT_ID;
    if (!clientId) return apiError('GOOGLE_CLIENT_ID не задан', 500);

    const base       = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? 'http://localhost:3000';
    const redirectUri = `${base}/api/integrations/fitbit/callback`;

    const params = new URLSearchParams({
      client_id:     clientId,
      redirect_uri:  redirectUri,
      response_type: 'code',
      scope:         SCOPES,
      access_type:   'offline',
      prompt:        'consent',  // всегда запрашивать refresh_token
    });

    return NextResponse.redirect(`https://accounts.google.com/o/oauth2/v2/auth?${params}`);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.redirect('/login');
    return apiError('Ошибка', 500);
  }
}
