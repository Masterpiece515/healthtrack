import { requireUserId, AuthError } from '@/lib/auth-utils';
import { apiError, apiOk } from '@/lib/api-response';
import { db, persistDb } from '@/lib/db';
import { integrations } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createEntry } from '@/lib/services/health.service';

type IntRow = typeof integrations.$inferSelect;
type Obj    = Record<string, unknown>;

// ── Токены ────────────────────────────────────────────────────────────────
async function refreshToken(userId: string, row: IntRow): Promise<string | null> {
  if (!row.googleRefreshToken) return null;

  const res = await fetch('https://oauth2.googleapis.com/token', {
    method:  'POST',
    headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
    body: new URLSearchParams({
      grant_type:    'refresh_token',
      refresh_token: row.googleRefreshToken,
      client_id:     process.env.GOOGLE_CLIENT_ID!,
      client_secret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
  });

  const t = await res.json() as { access_token?: string; expires_in?: number };
  if (!t.access_token) return null;

  const expiry = new Date(Date.now() + (t.expires_in ?? 3600) * 1000).toISOString();
  db.insert(integrations).values({
    userId,
    googleAccessToken:  t.access_token,
    googleRefreshToken: row.googleRefreshToken,
    googleTokenExpiry:  expiry,
    updatedAt:          new Date().toISOString(),
  }).onConflictDoUpdate({
    target: integrations.userId,
    set: { googleAccessToken: t.access_token, googleTokenExpiry: expiry, updatedAt: new Date().toISOString() },
  }).run();
  persistDb();

  return t.access_token;
}

async function getValidToken(userId: string): Promise<string | null> {
  const [row] = db.select().from(integrations).where(eq(integrations.userId, userId)).all();
  if (!row?.googleAccessToken) return null;

  const expiry = row.googleTokenExpiry ? new Date(row.googleTokenExpiry).getTime() : 0;
  if (Date.now() + 5 * 60 * 1000 < expiry) return row.googleAccessToken;

  return refreshToken(userId, row);
}

// ── Google Health API helpers ──────────────────────────────────────────────
const BASE = 'https://health.googleapis.com/v4/users/me/dataTypes';

interface CivilDate { date: { year: number; month: number; day: number }; time: Record<string, number> }
interface RollupPoint { civilStartTime: { date: { year: number; month: number; day: number } }; [k: string]: unknown }

function toCivil(d: Date, end = false): CivilDate {
  return {
    date: { year: d.getFullYear(), month: d.getMonth() + 1, day: d.getDate() },
    time: end ? { hours: 23, minutes: 59, seconds: 59 } : {},
  };
}

function toDateStr(pt: RollupPoint): string {
  const { year, month, day } = pt.civilStartTime.date;
  return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
}

async function rollup(token: string, dataType: string, start: Date, end: Date): Promise<RollupPoint[]> {
  try {
    const res = await fetch(`${BASE}/${dataType}/dataPoints:dailyRollUp`, {
      method:  'POST',
      headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
      body:    JSON.stringify({ range: { start: toCivil(start), end: toCivil(end, true) }, windowSizeDays: 1 }),
    });
    if (!res.ok) { console.warn(`[health/sync] ${dataType} rollup failed:`, res.status); return []; }
    const j = await res.json() as { rollupDataPoints?: RollupPoint[] };
    return j.rollupDataPoints ?? [];
  } catch (e) {
    console.warn(`[health/sync] ${dataType} rollup error:`, e);
    return [];
  }
}

// Безопасное извлечение числа из неизвестной структуры ответа
function num(v: unknown): number  { return v == null ? 0 : parseFloat(String(v)) || 0; }

function getSteps(p: Obj): number {
  const s = p.steps as Obj;
  return Math.round(num(s?.countSum));
}

function getCalories(p: Obj): number | undefined {
  // API может использовать разные имена в зависимости от версии
  const v = (p.totalCalories as Obj)?.kcalSum
    ?? (p.calories as Obj)?.kcalSum
    ?? (p.activeEnergyBurned as Obj)?.kcalSum;
  const n = Math.round(num(v));
  return n > 0 ? n : undefined;
}

function getHeartRate(p: Obj): number {
  const hr = p.heartRate as Obj;
  const v  = hr?.averageBeatsPerMinute ?? hr?.beatsPerMinuteAverage ?? hr?.beatsPerMinute;
  return Math.round(num(v));
}

function getWeight(p: Obj): number | undefined {
  const w = p.weight as Obj;
  const g = w?.weightGramsAverage ?? w?.weightGrams ?? w?.lastWeightGrams;
  if (!g) return undefined;
  return Math.round(num(g) / 100) / 10; // grams → kg
}

function getSleep(p: Obj): number {
  const s   = p.sleep as Obj;
  const min = s?.minutesAsleepSum ?? s?.totalMinutesAsleep ?? (s?.durationSecSum ? num(s.durationSecSum) / 60 : 0);
  return Math.round(num(min) / 60 * 10) / 10; // minutes → hours
}

// ── Обработчики ───────────────────────────────────────────────────────────
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

export async function POST() {
  try {
    const userId = await requireUserId();

    const token = await getValidToken(userId);
    if (!token) return apiError('Google Health не подключён', 400);

    const end   = new Date();
    const start = new Date(end);
    start.setDate(start.getDate() - 29);

    // Запрашиваем все данные параллельно
    const [stepsData, calData, hrData, weightData, sleepData] = await Promise.all([
      rollup(token, 'steps',          start, end),
      rollup(token, 'total-calories', start, end),
      rollup(token, 'heart-rate',     start, end),
      rollup(token, 'weight',         start, end),
      rollup(token, 'sleep',          start, end),
    ]);

    // Первый запрос вернул 401 — токен истёк
    if (stepsData.length === 0 && calData.length === 0 && hrData.length === 0) {
      // может быть нет данных, а не ошибка — продолжаем
    }

    // Индексируем по дате
    const idx = <T>(pts: RollupPoint[], fn: (p: Obj) => T) =>
      new Map(pts.map(p => [toDateStr(p), fn(p as Obj)]));

    const stepsMap  = idx(stepsData,  getSteps);
    const calMap    = idx(calData,    getCalories);
    const hrMap     = idx(hrData,     getHeartRate);
    const weightMap = idx(weightData, getWeight);
    const sleepMap  = idx(sleepData,  getSleep);

    // Все даты из шагов и пульса
    const dates = [...new Set([...stepsMap.keys(), ...hrMap.keys()])].sort();

    let imported   = 0;
    let skipped    = 0;
    let lastWeight = 70;

    for (const date of dates) {
      const steps     = stepsMap.get(date)  ?? 0;
      const heartRate = hrMap.get(date)     ?? 0;
      const weight    = weightMap.get(date);
      const calories  = calMap.get(date);
      const sleepHrs  = sleepMap.get(date)  ?? 7;

      if (weight && weight > 0) lastWeight = weight;

      if (steps === 0 && heartRate === 0) continue;

      try {
        createEntry(userId, {
          date,
          steps:      Math.max(0, steps),
          sleepHours: sleepHrs > 0 ? sleepHrs : 7,
          heartRate:  heartRate > 0 ? Math.min(220, heartRate) : 70,
          weight:     lastWeight,
          calories:   calories ?? undefined,
        });
        imported++;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        if (msg.includes('UNIQUE')) skipped++;
      }
    }

    return apiOk({ imported, skipped, message: `Синхронизировано ${imported} записей из Google Health` });
  } catch (err) {
    if (err instanceof AuthError) return apiError('Необходима авторизация', 401);
    console.error('[health/sync]', err);
    return apiError(err instanceof Error ? err.message : 'Ошибка синхронизации', 500);
  }
}
