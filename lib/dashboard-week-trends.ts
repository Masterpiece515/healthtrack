import type { HealthEntry } from '@/lib/types';
import { calcHealthScore } from '@/lib/store';

function mean(nums: number[]): number {
  if (!nums.length) return 0;
  return nums.reduce((a, b) => a + b, 0) / nums.length;
}

/** Процент изменения; `undefined`, если сравнивать нельзя (нет прошлой недели, деление на 0). */
function pctChange(current: number, previous: number): number | undefined {
  if (previous === 0 && current === 0) return undefined;
  if (previous === 0) return undefined;
  const raw = ((current - previous) / previous) * 100;
  if (!Number.isFinite(raw)) return undefined;
  return Math.round(raw);
}

export type WeekTrends = {
  steps: number | undefined;
  sleep: number | undefined;
  heartRate: number | undefined;
  weight: number | undefined;
  healthScore: number | undefined;
};

/** Сравнение последних 7 записей с предыдущими 7 (по порядку в журнале). */
export function computeWeekTrends(entries: HealthEntry[]): WeekTrends {
  const empty: WeekTrends = {
    steps: undefined,
    sleep: undefined,
    heartRate: undefined,
    weight: undefined,
    healthScore: undefined,
  };

  if (entries.length === 0) return empty;

  const last7 = entries.slice(-7);
  const prev7 = entries.length > 7 ? entries.slice(-14, -7) : [];
  if (prev7.length === 0) return empty;

  const stepsTrend = pctChange(
    mean(last7.map((e) => e.steps)),
    mean(prev7.map((e) => e.steps)),
  );
  const sleepTrend = pctChange(
    mean(last7.map((e) => e.sleepHours)),
    mean(prev7.map((e) => e.sleepHours)),
  );
  const hrTrend = pctChange(
    mean(last7.map((e) => e.heartRate)),
    mean(prev7.map((e) => e.heartRate)),
  );
  const weightTrend = pctChange(
    mean(last7.map((e) => e.weight)),
    mean(prev7.map((e) => e.weight)),
  );

  const curScore = calcHealthScore(last7);
  const prevScore = calcHealthScore(prev7);
  const healthScoreTrend = pctChange(curScore, prevScore);

  return {
    steps: stepsTrend,
    sleep: sleepTrend,
    heartRate: hrTrend,
    weight: weightTrend,
    healthScore: healthScoreTrend,
  };
}
