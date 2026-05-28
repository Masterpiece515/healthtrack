import { NextRequest, NextResponse } from 'next/server';
import { requireUserId, AuthError } from '@/lib/auth-utils';
import { db } from '@/lib/db';
import { integrations } from '@/lib/db/schema';

export async function GET(req: NextRequest) {
  try {
    const userId = await requireUserId();
    const code   = req.nextUrl.searchParams.get('code');
    const error  = req.nextUrl.searchParams.get('error');

    if (error || !code) {
      return NextResponse.redirect(new URL('/settings?integration=error', req.nextUrl.origin));
    }

    const clientId     = process.env.GOOGLE_CLIENT_ID!;
    const clientSecret = process.env.GOOGLE_CLIENT_SECRET!;
    const base         = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? req.nextUrl.origin;
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
      return NextResponse.redirect(new URL('/settings?integration=error', req.nextUrl.origin));
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

    return NextResponse.redirect(new URL('/settings?integration=success', req.nextUrl.origin));
  } catch (err) {
    if (err instanceof AuthError) return NextResponse.redirect(new URL('/login', req.nextUrl.origin));
    console.error('[health/callback]', err);
    return NextResponse.redirect(new URL('/settings?integration=error', req.nextUrl.origin));
  }
}
