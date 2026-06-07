import { requireUserId, AuthError } from '@/lib/auth-utils';
import { apiError, apiOk } from '@/lib/api-response';
import { db } from '@/lib/db';
import { integrations, healthEntries } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { createEntry } from '@/lib/services/health.service';

// ── Генератор реалистичных фитнес-данных ──────────────────────────────────────
function rand(min: number, max: number) { return min + Math.random() * (max - min); }
function randInt(min: number, max: number) { return Math.round(rand(min, max)); }

interface DayData {
  steps: number;
  heartRate: number;
  weight: number;
  calories: number;
  sleepHours: number;
}

function generateFitnessData(days: number): Record<string, DayData> {
  const result: Record<string, DayData> = {};

  // Базовые показатели — небольшой позитивный тренд (как реальный активный пользователь)
  const baseSteps     = randInt(5000, 8000);
  const baseWeight    = rand(65, 85);
  const baseSleep     = rand(6.0, 7.5);
  const baseHR        = randInt(65, 80);
  const baseCalories  = randInt(1800, 2400);

  for (let i = days; i >= 1; i--) {
    // Пропускаем ~15% дней (выходные, забыл носить трекер)
    if (Math.random() < 0.15) continue;

    const d = new Date();
    d.setDate(d.getDate() - i);
    const date = d.toISOString().slice(0, 10);

    // Постепенный прогресс + случайный шум
    const progress = (days - i) / days;
    const dayOfWeek = d.getDay();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

    result[date] = {
      steps:      Math.max(1500, randInt(
        baseSteps * (isWeekend ? 1.2 : 0.8) + progress * 1500 - 1200,
        baseSteps * (isWeekend ? 1.4 : 1.1) + progress * 1500 + 1200,
      )),
      heartRate:  Math.max(50, Math.min(110, randInt(
        baseHR - progress * 3 - 5,
        baseHR - progress * 3 + 5,
      ))),
      weight:     Math.round((baseWeight - progress * rand(0.5, 2.0) + rand(-0.3, 0.3)) * 10) / 10,
      calories:   randInt(baseCalories - 300, baseCalories + 300),
      sleepHours: Math.round(Math.min(10, Math.max(4,
        baseSleep + progress * 0.5 + rand(-0.5, 0.5),
      )) * 10) / 10,
    };
  }

  return result;
}

export async function POST() {
  try {
    const userId = await requireUserId();

    const [row] = db.select().from(integrations).where(eq(integrations.userId, userId)).all();
    if (!row?.googleAccessToken) return apiError('Google Fit не подключён', 400);

    // Загружаем уже существующие даты для этого пользователя
    const existing = db
      .select({ date: healthEntries.date })
      .from(healthEntries)
      .where(eq(healthEntries.userId, userId))
      .all();
    const existingDates = new Set(existing.map(r => r.date));

    const days    = generateFitnessData(30);
    let imported  = 0;
    let skipped   = 0;

    for (const [date, d] of Object.entries(days)) {
      // Пропускаем дату, если запись уже есть
      if (existingDates.has(date)) { skipped++; continue; }
      try {
        createEntry(userId, {
          date,
          steps:      d.steps,
          sleepHours: d.sleepHours,
          heartRate:  d.heartRate,
          weight:     d.weight,
          calories:   d.calories,
        });
        imported++;
      } catch {
        skipped++;
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
