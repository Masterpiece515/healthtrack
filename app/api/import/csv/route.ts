import { NextRequest, NextResponse } from 'next/server';
import Papa from 'papaparse';
import { requireUserId, AuthError } from '@/lib/auth-utils';
import { apiError } from '@/lib/api-response';
import { createEntry } from '@/lib/services/health.service';

// Поддерживаемые форматы колонок
const COL = {
  date:       ['date', 'дата', 'day', 'start_time', 'com.samsung.health.step_daily_trend.day_time'],
  steps:      ['steps', 'шаги', 'step_count', 'count', 'com.samsung.health.step_daily_trend.count'],
  sleep:      ['sleephours', 'sleep_hours', 'sleep', 'сон', 'duration', 'sleep_duration'],
  heartRate:  ['heartrate', 'heart_rate', 'hr', 'пульс', 'bpm', 'com.samsung.health.heart_rate.heart_rate'],
  weight:     ['weight', 'вес', 'weight_kg', 'com.samsung.health.body.weight'],
  calories:   ['calories', 'калории', 'calorie', 'active_calories', 'total_calories'],
  notes:      ['notes', 'заметки', 'note', 'comment'],
};

function findCol(headers: string[], variants: string[]): string | null {
  const lower = headers.map(h => h.toLowerCase().trim());
  return headers[lower.findIndex(h => variants.some(v => h.includes(v)))] ?? null;
}

function parseDate(raw: string): string | null {
  if (!raw) return null;
  // Пробуем ISO, DD.MM.YYYY, MM/DD/YYYY
  const iso = raw.slice(0, 10);
  if (/^\d{4}-\d{2}-\d{2}$/.test(iso)) return iso;
  const ddmm = raw.match(/^(\d{2})\.(\d{2})\.(\d{4})/);
  if (ddmm) return `${ddmm[3]}-${ddmm[2]}-${ddmm[1]}`;
  const mmdd = raw.match(/^(\d{2})\/(\d{2})\/(\d{4})/);
  if (mmdd) return `${mmdd[3]}-${mmdd[1]}-${mmdd[2]}`;
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const userId = await requireUserId();

    const formData = await req.formData();
    const file = formData.get('file') as File | null;
    if (!file) return apiError('Файл не найден', 400);

    const text = await file.text();

    const parsed = Papa.parse<Record<string, string>>(text, {
      header:         true,
      skipEmptyLines: true,
      transformHeader: h => h.trim(),
    });

    if (!parsed.data.length) return apiError('CSV пустой или неверный формат', 400);

    const headers = Object.keys(parsed.data[0]);

    const colDate      = findCol(headers, COL.date);
    const colSteps     = findCol(headers, COL.steps);
    const colSleep     = findCol(headers, COL.sleep);
    const colHeartRate = findCol(headers, COL.heartRate);
    const colWeight    = findCol(headers, COL.weight);
    const colCalories  = findCol(headers, COL.calories);
    const colNotes     = findCol(headers, COL.notes);

    if (!colDate) return apiError('Не найдена колонка с датой. Убедитесь что в CSV есть колонка date/дата', 422);

    let imported = 0;
    let skipped  = 0;
    const errors: string[] = [];

    for (const row of parsed.data) {
      const date = parseDate(row[colDate!] ?? '');
      if (!date) { skipped++; continue; }

      const steps     = colSteps     ? Math.round(parseFloat(row[colSteps]     ?? '0')) : 0;
      const sleep     = colSleep     ? parseFloat(row[colSleep]     ?? '0')    : 0;
      const heartRate = colHeartRate ? Math.round(parseFloat(row[colHeartRate] ?? '60')) : 60;
      const weight    = colWeight    ? parseFloat(row[colWeight]    ?? '70')   : 70;
      const calories  = colCalories  ? Math.round(parseFloat(row[colCalories]  ?? '0')) : undefined;
      const notes     = colNotes     ? String(row[colNotes] ?? '').trim() || undefined : undefined;

      // Базовая валидация
      if (steps < 0 || steps > 100_000)   { skipped++; continue; }
      if (sleep < 0 || sleep > 24)         { skipped++; continue; }
      if (heartRate < 30 || heartRate > 250) { skipped++; continue; }
      if (weight < 20 || weight > 300)     { skipped++; continue; }

      try {
        createEntry(userId, { date, steps, sleepHours: sleep, heartRate, weight, calories, notes });
        imported++;
      } catch (e: unknown) {
        const msg = e instanceof Error ? e.message : String(e);
        // Пропускаем дубли (UNIQUE constraint)
        if (msg.includes('UNIQUE')) skipped++;
        else errors.push(`${date}: ${msg}`);
      }
    }

    return NextResponse.json({ imported, skipped, errors: errors.slice(0, 10) });
  } catch (err) {
    if (err instanceof AuthError) return apiError('Необходима авторизация', 401);
    console.error('[POST /api/import/csv]', err);
    return apiError('Ошибка сервера', 500);
  }
}
