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

    const clientId     = process.env.FITBIT_CLIENT_ID!;
    const clientSecret = process.env.FITBIT_CLIENT_SECRET!;
    const base         = process.env.AUTH_URL ?? process.env.NEXTAUTH_URL ?? req.nextUrl.origin;
    const redirectUri  = `${base}/api/integrations/fitbit/callback`;

    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

    const tokenRes = await fetch('https://api.fitbit.com/oauth2/token', {
      method: 'POST',
      headers: {
        'Authorization':  `Basic ${credentials}`,
        'Content-Type':   'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        grant_type:   'authorization_code',
        code,
        redirect_uri: redirectUri,
      }),
    });

    const tokens = await tokenRes.json() as {
      access_token?:  string;
      refresh_token?: string;
      expires_in?:    number;
      errors?:        unknown[];
    };

    if (!tokens.access_token) {
      console.error('[fitbit/callback] token error:', tokens);
      return NextResponse.redirect(new URL('/settings?integration=error', req.nextUrl.origin));
    }

    const expiry = new Date(Date.now() + (tokens.expires_in ?? 28800) * 1000).toISOString();

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
    if (err instanceof AuthError) {
      return NextResponse.redirect(new URL('/login', req.nextUrl.origin));
    }
    console.error('[fitbit/callback]', err);
    return NextResponse.redirect(new URL('/settings?integration=error', req.nextUrl.origin));
  }
}
