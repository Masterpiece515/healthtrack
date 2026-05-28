import { db } from '@/lib/db';
import { healthEntries, streaks } from '@/lib/db/schema';
import { eq, desc, and } from 'drizzle-orm';
import { randomUUID } from 'crypto';
import { calcHealthScore } from '@/lib/store';
import type { CreateHealthEntryInput, UpdateHealthEntryInput } from '@/lib/validators/health.schema';

type NullableRow = typeof healthEntries.$inferSelect;

export type NormalizedEntry = Omit<NullableRow, 'calories' | 'notes'> & {
  calories?: number;
  notes?: string;
};

export function normalizeEntry(r: NullableRow): NormalizedEntry {
  return { ...r, notes: r.notes ?? undefined, calories: r.calories ?? undefined };
}

// ── Получить все записи пользователя ──────────────────────────────────────
export function getUserEntries(userId: string): NormalizedEntry[] {
  return db
    .select()
    .from(healthEntries)
    .where(eq(healthEntries.userId, userId))
    .orderBy(healthEntries.date)
    .all()
    .map(normalizeEntry);
}

// ── Получить последние N записей ──────────────────────────────────────────
export function getRecentEntries(userId: string, limit = 7): NormalizedEntry[] {
  return db
    .select()
    .from(healthEntries)
    .where(eq(healthEntries.userId, userId))
    .orderBy(desc(healthEntries.date))
    .limit(limit)
    .all()
    .reverse()
    .map(normalizeEntry);
}

// ── Получить запись по ID ─────────────────────────────────────────────────
export function getEntryById(userId: string, id: string): NormalizedEntry | null {
  const rows = db
    .select()
    .from(healthEntries)
    .where(and(eq(healthEntries.id, id), eq(healthEntries.userId, userId)))
    .all();
  return rows[0] ? normalizeEntry(rows[0]) : null;
}

// ── Создать запись ─────────────────────────────────────────────────────────
export function createEntry(userId: string, input: CreateHealthEntryInput): NormalizedEntry {
  const entry = {
    id:         randomUUID(),
    userId,
    date:       input.date,
    steps:      input.steps,
    sleepHours: input.sleepHours,
    heartRate:  input.heartRate,
    weight:     input.weight,
    calories:   input.calories ?? null,
    notes:      input.notes?.trim() ?? null,
    createdAt:  new Date().toISOString(),
  };

  db.insert(healthEntries).values(entry).run();
  updateStreak(userId, input.date);

  return normalizeEntry(entry);
}

// ── Обновить запись ────────────────────────────────────────────────────────
export function updateEntry(
  userId: string,
  id: string,
  input: UpdateHealthEntryInput
): NormalizedEntry | null {
  const existing = getEntryById(userId, id);
  if (!existing) return null;

  const updates: Partial<typeof healthEntries.$inferInsert> = {};
  if (input.date       != null) updates.date       = input.date;
  if (input.steps      != null) updates.steps      = input.steps;
  if (input.sleepHours != null) updates.sleepHours = input.sleepHours;
  if (input.heartRate  != null) updates.heartRate  = input.heartRate;
  if (input.weight     != null) updates.weight     = input.weight;
  if ('calories' in input)      updates.calories   = input.calories ?? null;
  if ('notes' in input)         updates.notes      = input.notes?.trim() ?? null;

  db.update(healthEntries)
    .set(updates)
    .where(and(eq(healthEntries.id, id), eq(healthEntries.userId, userId)))
    .run();

  return getEntryById(userId, id);
}

// ── Удалить запись ─────────────────────────────────────────────────────────
export function deleteEntry(userId: string, id: string): boolean {
  const existing = getEntryById(userId, id);
  if (!existing) return false;

  db.delete(healthEntries)
    .where(and(eq(healthEntries.id, id), eq(healthEntries.userId, userId)))
    .run();

  return true;
}

// ── Сводка (summary) ──────────────────────────────────────────────────────
export function buildSummary(entries: NormalizedEntry[]) {
  const last7 = entries.slice(-7);
  const avg = (arr: number[]) =>
    arr.length ? arr.reduce((s, n) => s + n, 0) / arr.length : 0;

  return {
    avgSteps:     Math.round(avg(last7.map(e => e.steps))),
    avgSleep:     Math.round(avg(last7.map(e => e.sleepHours)) * 10) / 10,
    avgHeartRate: Math.round(avg(last7.map(e => e.heartRate))),
    latestWeight: last7.at(-1)?.weight ?? 0,
    healthScore:  calcHealthScore(
      last7.map(e => ({ ...e, calories: e.calories ?? undefined, notes: e.notes ?? undefined }))
    ),
  };
}

// ── Обновить стрик ─────────────────────────────────────────────────────────
function updateStreak(userId: string, entryDate: string): void {
  const existing = db
    .select()
    .from(streaks)
    .where(eq(streaks.userId, userId))
    .all();

  const now = new Date().toISOString();

  if (!existing.length) {
    db.insert(streaks).values({
      userId,
      currentStreak: 1,
      longestStreak: 1,
      lastEntryDate: entryDate,
      updatedAt: now,
    }).run();
    return;
  }

  const streak = existing[0];
  const last = streak.lastEntryDate;

  if (!last) {
    db.update(streaks).set({ currentStreak: 1, longestStreak: 1, lastEntryDate: entryDate, updatedAt: now }).where(eq(streaks.userId, userId)).run();
    return;
  }

  const lastDate = new Date(last);
  const newDate  = new Date(entryDate);
  const diffDays = Math.round((newDate.getTime() - lastDate.getTime()) / 86_400_000);

  let current = streak.currentStreak;

  if (diffDays === 1) {
    // Следующий день — стрик продолжается
    current = current + 1;
  } else if (diffDays === 0) {
    // Тот же день — ничего не меняем
    return;
  } else {
    // Пропущен день — стрик сброшен
    current = 1;
  }

  const longest = Math.max(current, streak.longestStreak);
  db.update(streaks)
    .set({ currentStreak: current, longestStreak: longest, lastEntryDate: entryDate, updatedAt: now })
    .where(eq(streaks.userId, userId))
    .run();
}

// ── Получить стрик пользователя ────────────────────────────────────────────
export function getUserStreak(userId: string) {
  const rows = db.select().from(streaks).where(eq(streaks.userId, userId)).all();
  if (!rows.length) return { currentStreak: 0, longestStreak: 0 };
  return { currentStreak: rows[0].currentStreak, longestStreak: rows[0].longestStreak };
}
