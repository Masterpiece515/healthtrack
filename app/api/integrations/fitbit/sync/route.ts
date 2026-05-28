import { requireUserId, AuthError } from '@/lib/auth-utils';
import { apiError, apiOk } from '@/lib/api-response';
import { db } from '@/lib/db';
import { integrations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createEntry } from '@/lib/services/health.service';

type IntegrationRow = typeof integrations.$inferSelect;

async function refreshToken(userId: string, row: IntegrationRow): Promise<string | null> {
  if (!row.googleRefreshToken) return null;

  const clientId     = process.env.FITBIT_CLIENT_ID!;
  const clientSecret = process.env.FITBIT_CLIENT_SECRET!;
  const credentials  = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');

  const res = await fetch('https://api.fitbit.com/oauth2/token', {
    method:  'POST',
    headers: {
      'Authorization': `Basic ${credentials}`,
      'Content-Type':  'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: row.googleRefreshToken,
    }),
  });

  const tokens = await res.json() as {
    access_token?:  string;
    refresh_token?: string;
    expires_in?:    number;
  };

  if (!tokens.access_token) return null;

  const expiry = new Date(Date.now() + (tokens.expires_in ?? 28800) * 1000).toISOString();

  db.insert(integrations).values({
    userId,
    googleAccessToken:  tokens.access_token,
    googleRefreshToken: tokens.refresh_token ?? row.googleRefreshToken,
    googleTokenExpiry:  expiry,
    updatedAt:          new Date().toISOString(),
  }).onConflictDoUpdate({
    target: integrations.userId,
    set: {
      googleAccessToken:  tokens.access_token,
      googleRefreshToken: tokens.refresh_token ?? row.googleRefreshToken,
      googleTokenExpiry:  expiry,
      updatedAt:          new Date().toISOString(),
    },
  }).run();

  return tokens.access_token;
}

async function getValidToken(userId: string): Promise<string | null> {
  const [row] = db.select().from(integrations).where(eq(integrations.userId, userId)).all();
  if (!row?.googleAccessToken) return null;

  // Buffer of 5 minutes before actual expiry
  const expiry = row.googleTokenExpiry ? new Date(row.googleTokenExpiry).getTime() : 0;
  if (Date.now() + 5 * 60 * 1000 < expiry) return row.googleAccessToken;

  return refreshToken(userId, row);
}

// ── GET /api/integrations/fitbit/sync  (check connection status) ──────────
export async function GET() {
  try {
    const userId = await requireUserId();
    const [row]  = db.select().from(integrations).where(eq(integrations.userId, userId)).all();
    return apiOk({ connected: !!(row?.googleAccessToken) });
  } catch (err) {
    if (err instanceof AuthError) return apiError('Необходима авторизация', 401);
    return apiError('Ошибка', 500);
  }
}

// ── POST /api/integrations/fitbit/sync  (pull data from Fitbit) ───────────
export async function POST() {
  try {
    const userId = await requireUserId();

    const token = await getValidToken(userId);
    if (!token) return apiError('Fitbit не подключён', 400);

    const today     = new Date();
    const startDate = new Date(today);
    startDate.setDate(startDate.getDate() - 29);

    const todayStr     = today.toISOString().slice(0, 10);
    const startDateStr = startDate.toISOString().slice(0, 10);

    const hdr = { Authorization: `Bearer ${token}` };

    // Fetch all resources in parallel
    const [stepsRes, caloriesRes, heartRes, weightRes, sleepRes] = await Promise.all([
      fetch(`https://api.fitbit.com/1/user/-/activities/steps/date/${startDateStr}/${todayStr}.json`,    { headers: hdr }),
      fetch(`https://api.fitbit.com/1/user/-/activities/calories/date/${startDateStr}/${todayStr}.json`, { headers: hdr }),
      fetch(`https://api.fitbit.com/1/user/-/activities/heart/date/${startDateStr}/${todayStr}.json`,    { headers: hdr }),
      fetch(`https://api.fitbit.com/1/user/-/body/weight/date/${startDateStr}/${todayStr}.json`,         { headers: hdr }),
      fetch(`https://api.fitbit.com/1.2/user/-/sleep/date/${startDateStr}/${todayStr}.json`,             { headers: hdr }),
    ]);

    // Check for auth errors on first response
    if (stepsRes.status === 401) return apiError('Токен Fitbit истёк. Переподключите Fitbit.', 401);

    type KV   = { dateTime: string; value: string };
    type HRKv = { dateTime: string; value: { restingHeartRate?: number } };
    type Sleep = { dateOfSleep: string; minutesAsleep: number; isMainSleep: boolean };

    const [stepsJson, calJson, hrJson, wtJson, slJson] = await Promise.all([
      stepsRes.json()    as Promise<{ 'activities-steps':    KV[] }>,
      caloriesRes.json() as Promise<{ 'activities-calories': KV[] }>,
      heartRes.json()    as Promise<{ 'activities-heart':    HRKv[] }>,
      weightRes.json()   as Promise<{ 'body-weight':         KV[] }>,
      sleepRes.json()    as Promise<{ sleep:                 Sleep[] }>,
    ]);

    // Build lookup maps
    const stepsMap    = new Map((stepsJson['activities-steps']    ?? []).map(d => [d.dateTime, parseInt(d.value, 10)]));
    const calMap      = new Map((calJson['activities-calories']   ?? []).map(d => [d.dateTime, parseInt(d.value, 10)]));
    const heartMap    = new Map((hrJson['activities-heart']       ?? []).map(d => [d.dateTime, d.value?.restingHeartRate ?? 0]));
    const weightMap   = new Map((wtJson['body-weight']            ?? []).map(d => [d.dateTime, parseFloat(d.value)]));

    // Sleep: sum main-sleep minutes per date
    const sleepMap = new Map<string, number>();
    for (const s of slJson.sleep ?? []) {
      if (!s.isMainSleep) continue;
      sleepMap.set(s.dateOfSleep, Math.round((s.minutesAsleep / 60) * 10) / 10);
    }

    // Iterate over all dates that have at least steps or heart rate
    const dates = [...new Set([...stepsMap.keys(), ...heartMap.keys()])].sort();

    let imported = 0;
    let skipped  = 0;
    let lastWeight = 70;

    for (const date of dates) {
      const steps     = stepsMap.get(date)  ?? 0;
      const heartRate = heartMap.get(date)  ?? 0;
      const weight    = weightMap.get(date) ?? lastWeight;
      const calories  = calMap.get(date);
      const sleepHrs  = sleepMap.get(date)  ?? 7;

      if (weight > 0) lastWeight = weight;

      // Skip days with no meaningful data
      if (steps === 0 && heartRate === 0) continue;

      try {
        createEntry(userId, {
          date,
          steps:      Math.max(0, steps),
          sleepHours: sleepHrs,
          heartRate:  Math.max(40, Math.min(220, heartRate || 70)),
          weight:     lastWeight,
          calories:   calories ?? undefined,
        });
        imported++;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes('UNIQUE')) skipped++;
      }
    }

    return apiOk({ imported, skipped, message: `Синхронизировано ${imported} записей из Fitbit` });
  } catch (err) {
    if (err instanceof AuthError) return apiError('Необходима авторизация', 401);
    console.error('[fitbit/sync]', err);
    return apiError(err instanceof Error ? err.message : 'Ошибка синхронизации', 500);
  }
}
