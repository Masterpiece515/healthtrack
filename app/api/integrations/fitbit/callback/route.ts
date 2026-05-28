import { NextRequest, NextResponse } from 'next/server';
import { requireUserId, AuthError } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { integrations } from '@/lib/db/schema';

export async function GET(req: NextRequest) {
  // Используем AUTH_URL из env, чтобы не получить 0.0.0.0:PORT на Railway
  const base = (process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? '').replace(/\/$/, '')
    || req.nextUrl.origin;

  try {
    const userId = await requireUserId();
    const code   = req.nextUrl.searchParams.get('code');
    const error  = req.nextUrl.searchParams.get('error');

    if (error || !code) {
      return NextResponse.redirect(`${base}/settings?integration=error`);
    }

    const clientId     = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const redirectUri  = `${base}/api/integrations/fitbit/callback`;

    const tokenRes = await fetch('https://oauth2.googleapis.com/token', {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        code,
        client_id:     clientId,
        client_secret: clientSecret,
        redirect_uri:  redirectUri,
        grant_type:    'authorization_code',
      }),
    });

    const tokens = await tokenRes.json() as {
      access_token?:  string;
      refresh_token?: string;
      expires_in?:    number;
      error?:         string;
    };

    if (!tokens.access_token) {
      console.error('[health/callback] token error:', tokens);
      return NextResponse.redirect(`${base}/settings?integration=error`);
    }

    const expiry = new Date(Date.now() + (tokens.expires_in ?? 3600) * 1000).toISOString();

    db.insert(integrations).values({
      userId,
      googleAccessToken:  tokens.access_token,
      googleRefreshToken: tokens.refresh_token ?? null,
      googleTokenExpiry:  expiry,
      updatedAt:          new Date().toISOString(),
    }).onConflictDoUpdate({
      target: integrations.userId,
      set: {
        googleAccessToken:  tokens.access_token,
        googleRefreshToken: tokens.refresh_token ?? null,
        googleTokenExpiry:  expiry,
        updatedAt:          new Date().toISOString(),
      },
    }).run();

    return NextResponse.redirect(`${base}/settings?integration=success`);
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.redirect(`${base}/login`);
    console.error('[health/callback]', err);
    return NextResponse.redirect(`${base}/settings?integration=error`);
  }
}
