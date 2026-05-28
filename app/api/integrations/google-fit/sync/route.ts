import { requireUserId, AuthError } from '@/lib/auth-utils';
import { apiError, apiOk } from '@/lib/api-response';
import { db } from '@/lib/db';
import { integrations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createEntry } from '@/lib/services/health.service';

const FIT_AGGREGATE = 'https://www.googleapis.com/fitness/v1/users/me/dataset:aggregate';

async function refreshToken(userId: string, refreshToken: string) {
  const res = await fetch('https://oauth2.googleapis.com/token', {
    method: 'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
      refresh_token: refreshToken,
      grant_type:    'refresh_token',
    }),
  });
  const data = await res.json() as { access_token?: string; expires_in?: number };
  if (!data.access_token) throw new Error('Не удалось обновить токен');

  const expiry = new Date(Date.now() + (data.expires_in ?? 3600) * 1000).toISOString();
  db.update(integrations)
    .set({ googleAccessToken: data.access_token, googleTokenExpiry: expiry, updatedAt: new Date().toISOString() })
    .where(eq(integrations.userId, userId))
    .run();

  return data.access_token;
}

async function fetchFitData(accessToken: string, days = 30) {
  const endMs   = Date.now();
  const startMs = endMs - days * 24 * 60 * 60 * 1000;

  const body = {
    aggregateBy: [
      { dataTypeName: 'com.google.step_count.delta' },
      { dataTypeName: 'com.google.heart_rate.bpm'   },
      { dataTypeName: 'com.google.weight'            },
      { dataTypeName: 'com.google.sleep.segment'     },
      { dataTypeName: 'com.google.calories.expended' },
    ],
    bucketByTime: { durationMillis: 86400000 }, // 1 день
    startTimeMillis: startMs,
    endTimeMillis:   endMs,
  };

  const res = await fetch(FIT_AGGREGATE, {
    method:  'POST',
    headers: { Authorization: `Bearer ${accessToken}`, 'Content-Type': 'application/json' },
    body:    JSON.stringify(body),
  });

  if (!res.ok) {
    let detail = '';
    try {
      const text = await res.text();
      try {
        const err = JSON.parse(text) as { error?: { message?: string } };
        detail = err.error?.message ?? text;
      } catch {
        detail = text;
      }
    } catch {
      /* ignore */
    }

    if (res.status === 403) {
      throw new Error(
        'Доступ к Google Fit запрещён (403). Проверьте в Google Cloud Console: ' +
        '1) включён Fitness API; 2) в OAuth consent screen добавлены scopes fitness.*.read; ' +
        '3) если приложение в режиме Testing — ваш Gmail в списке Test users. ' +
        'Затем нажмите «Переподключить» в настройках.' +
        (detail ? ` Ответ Google: ${detail}` : ''),
      );
    }

    throw new Error(
      detail ? `Google Fit API ${res.status}: ${detail}` : `Google Fit API: ${res.status}`,
    );
  }

  return res.json() as Promise<{ bucket: FitBucket[] }>;
}

interface FitBucket {
  startTimeMillis: string;
  dataset: {
    dataSourceId: string;
    point: { value: { intVal?: number; fpVal?: number }[] }[];
  }[];
}

function parseBuckets(buckets: FitBucket[]) {
  const days: Record<string, { steps: number; heartRate: number; weight: number; calories: number; sleepMs: number }> = {};

  for (const bucket of buckets) {
    const date = new Date(Number(bucket.startTimeMillis)).toISOString().slice(0, 10);
    if (!days[date]) days[date] = { steps: 0, heartRate: 0, weight: 0, calories: 0, sleepMs: 0 };
    const d = days[date];

    for (const ds of bucket.dataset) {
      for (const pt of ds.point) {
        const v0 = pt.value[0];
        if (!v0) continue;
        const val = v0.intVal ?? v0.fpVal ?? 0;

        if (ds.dataSourceId.includes('step_count'))   d.steps     += Math.round(val);
        if (ds.dataSourceId.includes('heart_rate'))   d.heartRate  = Math.round(val);
        if (ds.dataSourceId.includes('weight'))       d.weight     = Math.round(val * 10) / 10;
        if (ds.dataSourceId.includes('calories'))     d.calories  += Math.round(val);
        if (ds.dataSourceId.includes('sleep'))        d.sleepMs   += (val === 1 || val === 2 || val === 3) ? 3_600_000 : 0;
      }
    }
  }

  return days;
}

export async function POST() {
  try {
    const userId = await requireUserId();

    const [row] = db.select().from(integrations).where(eq(integrations.userId, userId)).all();
    if (!row?.googleAccessToken) return apiError('Google Fit не подключён', 400);

    let token = row.googleAccessToken;

    // Обновить токен если просрочен
    const expiry = row.googleTokenExpiry ? new Date(row.googleTokenExpiry).getTime() : 0;
    if (expiry < Date.now() + 60_000 && row.googleRefreshToken) {
      token = await refreshToken(userId, row.googleRefreshToken);
    }

    const fitData = await fetchFitData(token, 30);
    const days    = parseBuckets(fitData.bucket ?? []);

    let imported = 0;
    let skipped  = 0;

    for (const [date, d] of Object.entries(days)) {
      // Пропускаем дни без данных
      if (!d.steps && !d.heartRate && !d.weight) { skipped++; continue; }

      const sleepHours = Math.round((d.sleepMs / 3_600_000) * 10) / 10;

      try {
        createEntry(userId, {
          date,
          steps:      d.steps || 0,
          sleepHours: sleepHours || 7,
          heartRate:  d.heartRate || 70,
          weight:     d.weight    || 70,
          calories:   d.calories  || undefined,
        });
        imported++;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes('UNIQUE')) skipped++; // уже есть за этот день
      }
    }

    return apiOk({ imported, skipped, message: `Синхронизировано ${imported} записей` });
  } catch (err) {
    if (err instanceof AuthError) return apiError('Необходима авторизация', 401);
    console.error('[google-fit/sync]', err);
    return apiError(err instanceof Error ? err.message : 'Ошибка синхронизации', 500);
  }
}

export async function GET() {
  try {
    const userId = await requireUserId();
    const [row]  = db.select().from(integrations).where(eq(integrations.userId, userId)).all();
    const connected = !!(row?.googleAccessToken);
    return apiOk({ connected });
  } catch (err) {
    if (err instanceof AuthError) return apiError('Необходима авторизация', 401);
    return apiError('Ошибка', 500);
  }
}
