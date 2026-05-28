import { NextResponse } from 'next/server';
import OpenAI from 'openai';
import { db } from '@/lib/db';
import { recommendations as recTable } from '@/lib/db/schema';
import { eq } from 'drizzle-orm';
import { requireUserId } from '@/lib/auth-utils';
import { apiOk, apiError } from '@/lib/api-response';
import { getRecentEntries } from '@/lib/services/health.service';
import { seedIfEmpty } from '@/lib/db/seed';
import { randomUUID } from 'crypto';
import type { AIRecommendation, RecommendationsResponse } from '@/lib/types';

const FALLBACK: AIRecommendation[] = [
  { id: 's1', title: 'Улучшите качество сна',   description: 'Ложитесь в одно время — это нормализует циркадный ритм и улучшает восстановление организма.', priority: 'high',   actionable: true,  category: 'sleep',     source: 'static' },
  { id: 's2', title: 'Увеличьте физическую активность', description: 'Старайтесь делать не менее 8000–10000 шагов в день. Добавьте короткие прогулки в обеденный перерыв.', priority: 'medium', actionable: true,  category: 'activity',  source: 'static' },
  { id: 's3', title: 'Следите за гидратацией',  description: 'Выпивайте не менее 1.5–2 л воды в день. Недостаток воды снижает концентрацию и повышает пульс.', priority: 'high',   actionable: true,  category: 'hydration', source: 'static' },
  { id: 's4', title: 'Контролируйте пульс',     description: 'Нормальный пульс в покое — 60–80 уд/мин. При отклонениях проконсультируйтесь с врачом.',        priority: 'medium', actionable: false, category: 'general',   source: 'static' },
];

function parseRecs(content: string): AIRecommendation[] {
  const clean = content
    .replace(/```json\s*/gi, '')
    .replace(/```\s*/g, '')
    .trim();

  // Пробуем найти JSON-массив в любом месте ответа
  const match = clean.match(/\[[\s\S]*\]/);
  if (!match) {
    // Fallback: пробуем обернуть если модель вернула объект вместо массива
    const objMatch = clean.match(/\{[\s\S]*\}/);
    if (objMatch) {
      const parsed = JSON.parse(`[${objMatch[0]}]`) as Record<string, unknown>[];
      return parseItems(parsed);
    }
    throw new Error('No JSON array found');
  }

  const parsed = JSON.parse(match[0]) as Record<string, unknown>[];
  return parseItems(parsed);
}

function parseItems(parsed: Record<string, unknown>[]): AIRecommendation[] {
  return parsed.slice(0, 5).map((item, i) => ({
    id:          `ai-${i + 1}`,
    title:       String(item.title       ?? '').slice(0, 100),
    description: String(item.description ?? '').slice(0, 400),
    priority:    (['high','medium','low'].includes(String(item.priority)) ? item.priority : 'medium') as AIRecommendation['priority'],
    actionable:  item.actionable !== false,
    category:    (['sleep','activity','nutrition','hydration','general'].includes(String(item.category)) ? item.category : 'general') as AIRecommendation['category'],
    source:      'ai' as const,
  }));
}

function buildPrompt(entries: ReturnType<typeof getRecentEntries>): string {
  if (entries.length === 0) {
    return 'Пользователь только зарегистрировался и ещё не внёс данные. Дай 4 вводные рекомендации по здоровью для начинающих. Пиши по-русски.';
  }

  const avg = (arr: number[]) => arr.length ? arr.reduce((s, n) => s + n, 0) / arr.length : 0;

  const avgSteps     = Math.round(avg(entries.map(e => e.steps)));
  const avgSleep     = Math.round(avg(entries.map(e => e.sleepHours)) * 10) / 10;
  const avgHeartRate = Math.round(avg(entries.map(e => e.heartRate)));
  const avgCalories  = Math.round(avg(entries.filter(e => e.calories).map(e => e.calories!)));
  const latestWeight = entries.at(-1)?.weight ?? 0;

  const stepsPercent  = Math.round((avgSteps / 10000) * 100);
  const sleepPercent  = Math.round((avgSleep / 8) * 100);
  const hrStatus      = avgHeartRate >= 60 && avgHeartRate <= 80 ? 'норма' : avgHeartRate < 60 ? 'ниже нормы (брадикардия?)' : 'выше нормы (тахикардия?)';

  const trend = entries.length >= 4 ? (() => {
    const half = Math.floor(entries.length / 2);
    const first = entries.slice(0, half);
    const second = entries.slice(half);
    const firstAvgSteps = avg(first.map(e => e.steps));
    const secondAvgSteps = avg(second.map(e => e.steps));
    return secondAvgSteps > firstAvgSteps ? 'растёт' : secondAvgSteps < firstAvgSteps ? 'снижается' : 'стабильная';
  })() : 'недостаточно данных';

  const dailyData = entries.map(e =>
    `  ${e.date}: шаги=${e.steps.toLocaleString()}, сон=${e.sleepHours}ч, пульс=${e.heartRate}уд/мин, вес=${e.weight}кг${e.calories ? `, калории=${e.calories}` : ''}${e.notes ? `, заметка="${e.notes}"` : ''}`
  ).join('\n');

  return `Ты — персональный AI-тренер по здоровью. Проанализируй данные пользователя и дай КОНКРЕТНЫЕ рекомендации.

ДАННЫЕ ЗА ПОСЛЕДНИЕ ${entries.length} ДНЕЙ:
${dailyData}

АНАЛИЗ:
- Среднее шагов: ${avgSteps.toLocaleString()} (${stepsPercent}% от нормы 10 000)
- Средний сон: ${avgSleep}ч (${sleepPercent}% от нормы 8ч)
- Средний пульс: ${avgHeartRate} уд/мин — ${hrStatus}
- Вес: ${latestWeight}кг
${avgCalories ? `- Среднее калорий: ${avgCalories} ккал/день` : ''}
- Динамика активности: ${trend}

ЗАДАЧА: Дай ровно 4 персонализированных рекомендации учитывая КОНКРЕТНЫЕ цифры пользователя.
Не давай общие советы — ссылайся на реальные показатели (например: "Ваши ${avgSteps} шагов в день...").
Каждая рекомендация должна быть про разную область. Пиши по-русски, живо и мотивирующе.

Ответь ТОЛЬКО JSON-массивом без пояснений:
[
  {
    "title": "Короткий заголовок (до 7 слов)",
    "description": "2-3 предложения с конкретным советом, ссылаясь на данные пользователя",
    "priority": "high|medium|low",
    "actionable": true|false,
    "category": "sleep|activity|nutrition|hydration|general"
  }
]`;
}

export async function GET(): Promise<NextResponse<RecommendationsResponse>> {
  try {
    await seedIfEmpty();
    const userId = await requireUserId();

    const entries = getRecentEntries(userId, 7);

    if (!process.env.GROQ_API_KEY) {
      return apiOk({ recommendations: FALLBACK, generatedAt: new Date().toISOString(), model: 'static-fallback' });
    }

    const prompt = buildPrompt(entries);

    try {
      const groq = new OpenAI({
        apiKey:  process.env.GROQ_API_KEY,
        baseURL: 'https://api.groq.com/openai/v1',
      });

      const completion = await groq.chat.completions.create({
        model:       process.env.GROQ_MODEL ?? 'llama-3.3-70b-versatile',
        messages:    [{ role: 'user', content: prompt }],
        temperature: 0.85,
        max_tokens:  1200,
      });

      const raw = completion.choices[0]?.message?.content ?? '';
      const recs = parseRecs(raw);

      db.delete(recTable).where(eq(recTable.userId, userId)).run();
      for (const r of recs) {
        db.insert(recTable).values({
          id: randomUUID(), userId,
          title: r.title, description: r.description,
          priority: r.priority, actionable: r.actionable,
          category: r.category, source: 'ai',
          generatedAt: new Date().toISOString(),
        }).run();
      }

      const modelName = (completion.model ?? '').replace('llama-3.3-70b-versatile', 'Llama 3.3 70B');
      return apiOk({ recommendations: recs, generatedAt: new Date().toISOString(), model: modelName });

    } catch (aiErr) {
      console.error('[/api/recommendations] Groq error:', aiErr);
      const cached = db.select().from(recTable).where(eq(recTable.userId, userId)).all();
      const recs = cached.length
        ? cached.map(r => ({
            ...r,
            actionable: Boolean(r.actionable),
            source:     r.source   as 'ai' | 'static',
            priority:   r.priority as AIRecommendation['priority'],
            category:   r.category as AIRecommendation['category'],
          }))
        : FALLBACK;
      return apiOk({ recommendations: recs, generatedAt: new Date().toISOString(), model: 'fallback' });
    }
  } catch (err: unknown) {
    if (err && typeof err === 'object' && 'status' in err && (err as { status: number }).status === 401) {
      return apiError('Необходима авторизация', 401) as unknown as NextResponse<RecommendationsResponse>;
    }
    console.error('[GET /api/recommendations]', err);
    return apiError('Ошибка сервера', 500) as unknown as NextResponse<RecommendationsResponse>;
  }
}
