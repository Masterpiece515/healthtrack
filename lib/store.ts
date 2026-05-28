/**
 * In-memory хранилище данных здоровья.
 *
 * Это singleton-модуль: Next.js инициализирует его один раз на процесс,
 * поэтому данные живут пока работает dev-сервер.
 * В production следует заменить на настоящую БД (PostgreSQL, MongoDB и т.д.).
 */

import type { HealthEntry, AIRecommendation } from './types';

// ── Начальные тестовые данные ──────────────────────────────────────────────
const today = new Date();
const day = (offset: number) => {
  const d = new Date(today);
  d.setDate(d.getDate() - offset);
  return d.toISOString().split('T')[0];
};

const seedEntries: HealthEntry[] = [
  { id: '1', date: day(6), steps: 8200,  sleepHours: 7.2, heartRate: 74, weight: 75.5, calories: 480, createdAt: new Date(today.getTime() - 6*86400000).toISOString() },
  { id: '2', date: day(5), steps: 9500,  sleepHours: 6.8, heartRate: 76, weight: 75.3, calories: 520, createdAt: new Date(today.getTime() - 5*86400000).toISOString() },
  { id: '3', date: day(4), steps: 7100,  sleepHours: 8.0, heartRate: 72, weight: 75.2, calories: 430, createdAt: new Date(today.getTime() - 4*86400000).toISOString() },
  { id: '4', date: day(3), steps: 11300, sleepHours: 7.5, heartRate: 78, weight: 75.1, calories: 610, createdAt: new Date(today.getTime() - 3*86400000).toISOString() },
  { id: '5', date: day(2), steps: 6800,  sleepHours: 6.0, heartRate: 80, weight: 75.2, calories: 390, createdAt: new Date(today.getTime() - 2*86400000).toISOString() },
  { id: '6', date: day(1), steps: 13200, sleepHours: 8.5, heartRate: 70, weight: 75.0, calories: 680, createdAt: new Date(today.getTime() - 1*86400000).toISOString() },
  { id: '7', date: day(0), steps: 10120, sleepHours: 7.5, heartRate: 72, weight: 75.0, calories: 565, createdAt: new Date().toISOString() },
];

// ── Вспомогательные функции ────────────────────────────────────────────────

/** Вычисляет индекс здоровья (0–100) на основе последних записей */
export function calcHealthScore(entries: HealthEntry[]): number {
  if (entries.length === 0) return 0;

  const last7 = entries.slice(-7);
  const avgSteps      = avg(last7.map(e => e.steps));
  const avgSleep      = avg(last7.map(e => e.sleepHours));
  const avgHeartRate  = avg(last7.map(e => e.heartRate));

  // Шаги: цель 10 000 — макс 40 баллов
  const stepsScore = Math.min((avgSteps / 10000) * 40, 40);
  // Сон: цель 8 ч — макс 35 баллов
  const sleepScore = Math.min((avgSleep / 8) * 35, 35);
  // Пульс: норма 60–80 уд/мин — макс 25 баллов
  const hrScore = avgHeartRate >= 60 && avgHeartRate <= 80
    ? 25
    : Math.max(0, 25 - Math.abs(avgHeartRate - 70) * 0.5);

  return Math.round(stepsScore + sleepScore + hrScore);
}

function avg(nums: number[]): number {
  return nums.length ? nums.reduce((s, n) => s + n, 0) / nums.length : 0;
}

// ── Хранилище (singleton) ──────────────────────────────────────────────────

// Глобальный объект — обход пересоздания модуля при HMR в dev
declare global {
  var __healthStore: HealthEntry[] | undefined;
  var __aiRecommendations: AIRecommendation[] | undefined;
}

if (!global.__healthStore) {
  global.__healthStore = [...seedEntries];
}
if (!global.__aiRecommendations) {
  global.__aiRecommendations = [];
}

export const store = {
  // ── Записи ──────────────────────────────────────────────────────────────
  getEntries(): HealthEntry[] {
    return [...(global.__healthStore ?? [])].sort(
      (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
    );
  },

  addEntry(entry: HealthEntry): void {
    global.__healthStore = [...(global.__healthStore ?? []), entry];
  },

  getSummary() {
    const entries = this.getEntries();
    const last7   = entries.slice(-7);
    return {
      avgSteps:      Math.round(avg(last7.map(e => e.steps))),
      avgSleep:      Math.round(avg(last7.map(e => e.sleepHours)) * 10) / 10,
      avgHeartRate:  Math.round(avg(last7.map(e => e.heartRate))),
      latestWeight:  last7.at(-1)?.weight ?? 0,
      healthScore:   calcHealthScore(entries),
    };
  },

  // ── AI-рекомендации ──────────────────────────────────────────────────────
  getRecommendations(): AIRecommendation[] {
    return global.__aiRecommendations ?? [];
  },

  setRecommendations(recs: AIRecommendation[]): void {
    global.__aiRecommendations = recs;
  },
};
