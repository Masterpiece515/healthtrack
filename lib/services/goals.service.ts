import { db } from '@/lib/db';
import { goals, healthEntries } from '@/lib/db/schema';
import { eq, and, desc } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import type { UpsertGoalInput } from '@/lib/validators/goals.schema';

// ── Получить цели с прогрессом ─────────────────────────────────────────────
export function getUserGoals(userId: string) {
  const rows = db.select().from(goals).where(eq(goals.userId, userId)).all();

  const lastEntry = db
    .select()
    .from(healthEntries)
    .where(eq(healthEntries.userId, userId))
    .orderBy(desc(healthEntries.date))
    .limit(1)
    .all()
    .at(0);

  const currentValues: Record<string, number> = {
    steps:    lastEntry?.steps      ?? 0,
    sleep:    lastEntry?.sleepHours ?? 0,
    weight:   lastEntry?.weight     ?? 0,
    calories: lastEntry?.calories   ?? 0,
  };

  return rows.map(g => ({
    ...g,
    current: currentValues[g.metric] ?? 0,
    percent: g.metric === 'weight'
      ? Math.max(0, Math.round((1 - Math.abs(currentValues[g.metric] - g.target) / g.target) * 100))
      : Math.min(Math.round((currentValues[g.metric] / g.target) * 100), 150),
  }));
}

// ── Создать или обновить цель ──────────────────────────────────────────────
export function upsertGoal(userId: string, input: UpsertGoalInput) {
  const existing = db
    .select()
    .from(goals)
    .where(and(eq(goals.userId, userId), eq(goals.metric, input.metric)))
    .all();

  const now = new Date().toISOString();

  if (existing.length) {
    db.update(goals)
      .set({ target: input.target, unit: input.unit, updatedAt: now })
      .where(and(eq(goals.userId, userId), eq(goals.metric, input.metric)))
      .run();
  } else {
    db.insert(goals).values({
      id: randomUUID(),
      userId,
      metric:    input.metric,
      target:    input.target,
      unit:      input.unit,
      updatedAt: now,
    }).run();
  }
}

// ── Создать дефолтные цели для нового пользователя ───────────────────────
export function createDefaultGoals(userId: string) {
  const defaults = [
    { metric: 'steps',    target: 10000, unit: 'шагов' },
    { metric: 'sleep',    target: 8,     unit: 'ч'     },
    { metric: 'weight',   target: 74,    unit: 'кг'    },
    { metric: 'calories', target: 2000,  unit: 'ккал'  },
  ];
  const now = new Date().toISOString();
  for (const g of defaults) {
    db.insert(goals).values({ id: randomUUID(), userId, ...g, updatedAt: now }).run();
  }
}
