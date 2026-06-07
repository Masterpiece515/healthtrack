'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useMemo } from 'react';
import { motion } from 'framer-motion';
import Link from 'next/link';
import {
  BarChart, Bar, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from 'recharts';
import {
  ArrowLeft, Footprints, Moon, Heart, Weight, TrendingUp, Activity,
} from '@/components/icons';
import { calcHealthScore } from '@/lib/store';
import type { HealthEntry } from '@/lib/types';

// ── Типы ─────────────────────────────────────────────────────────────────────
type Period = 7 | 30 | 365;

const PERIODS: { label: string; value: Period }[] = [
  { label: '7 дней',  value: 7   },
  { label: 'Месяц',   value: 30  },
  { label: 'Год',     value: 365 },
];

// ── Фильтрация по периоду ─────────────────────────────────────────────────────
function filterByPeriod(entries: HealthEntry[], days: Period): HealthEntry[] {
  if (entries.length === 0) return [];

  const sorted = [...entries].sort((a, b) => b.date.localeCompare(a.date));

  // Отсчёт от даты последней записи, а не от сегодня
  const lastDate = new Date(sorted[0].date + 'T12:00:00');
  const cutoff = new Date(lastDate);
  cutoff.setDate(cutoff.getDate() - days + 1);
  cutoff.setHours(0, 0, 0, 0);

  const inRange = sorted.filter(e => new Date(e.date + 'T12:00:00') >= cutoff);

  // Если диапазон пустой — возвращаем последние N записей
  return inRange.length > 0
    ? inRange
    : sorted.slice(0, days);
}

// ── Форматирование дат ────────────────────────────────────────────────────────
function fmtDay(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}
function fmtFull(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' });
}

// ── Хелперы ───────────────────────────────────────────────────────────────────
function avg(arr: number[]): number {
  if (!arr.length) return 0;
  return Math.round((arr.reduce((s, v) => s + v, 0) / arr.length) * 10) / 10;
}

// ── CustomTooltip ──────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Tip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#6b8dd6]/20 rounded-xl p-3 shadow-lg text-xs">
      <p className="text-[#4a5a8a] mb-1.5 font-medium">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((p: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2 h-2 rounded-full" style={{ background: p.color }} />
          <span className="text-[#1a1e5e] font-semibold">{p.name}: {(p.value as number).toLocaleString('ru-RU')}</span>
        </div>
      ))}
    </div>
  );
}

// ── StatTile ──────────────────────────────────────────────────────────────────
function StatTile({
  icon: Icon, label, value, unit, color, delay,
}: {
  icon: React.ElementType; label: string; value: string | number; unit?: string; color: string; delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} transition={{ delay }}
      className="bg-white rounded-2xl p-4 sm:p-5 border border-[#c5d3f0]/20 shadow-sm"
    >
      <div className="flex items-start justify-between mb-3">
        <p className="text-xs text-[#4a5a8a] font-medium">{label}</p>
        <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
             style={{ background: `${color}20` }}>
          <Icon className="w-4 h-4" style={{ color }} />
        </div>
      </div>
      <p className="text-2xl font-bold text-[#1a1e5e]">
        {value}
        {unit && <span className="text-sm font-normal text-[#4a5a8a] ml-1">{unit}</span>}
      </p>
    </motion.div>
  );
}

// ── Главная страница ──────────────────────────────────────────────────────────
export default function DetailsPage() {
  const [entries, setEntries] = useState<HealthEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [period,  setPeriod]  = useState<Period>(7);

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(d => setEntries(d.entries ?? []))
      .finally(() => setLoading(false));
  }, []);

  // ── Данные для выбранного периода ──────────────────────────────────────────
  const filtered = useMemo(() => filterByPeriod(entries, period), [entries, period]);

  const sorted = useMemo(
    () => [...filtered].sort((a, b) => a.date.localeCompare(b.date)),
    [filtered],
  );

  const summaryStats = useMemo(() => {
    if (!filtered.length) return null;
    return {
      avgSteps:     avg(filtered.map(e => e.steps)),
      avgSleep:     avg(filtered.map(e => e.sleepHours)),
      avgHeartRate: avg(filtered.map(e => e.heartRate)),
      latestWeight: filtered[filtered.length - 1]?.weight ?? 0,
      avgScore:     avg(filtered.map(e => calcHealthScore([e]))),
      total:        filtered.length,
    };
  }, [filtered]);

  // ── Данные для графиков ────────────────────────────────────────────────────
  const stepsData  = sorted.map(e => ({ date: fmtDay(e.date), steps: e.steps }));
  const sleepData  = sorted.map(e => ({ date: fmtDay(e.date), сон: e.sleepHours }));
  const weightData = sorted.map(e => ({ date: fmtDay(e.date), вес: e.weight }));
  const scoreData  = sorted.map(e => ({ date: fmtDay(e.date), индекс: calcHealthScore([e]) }));

  // ── Скелетон ──────────────────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="space-y-6 animate-pulse">
        <div className="h-10 w-60 bg-white rounded-xl" />
        <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
          {[...Array(5)].map((_,i) => <div key={i} className="bg-white rounded-2xl h-24" />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(4)].map((_,i) => <div key={i} className="bg-white rounded-3xl h-60" />)}
        </div>
      </div>
    );
  }

  const axisProps = {
    stroke: '#4a5a8a', fontSize: 11, tickLine: false, axisLine: false,
  } as const;

  return (
    <div className="space-y-6">
      {/* ── Заголовок ── */}
      <motion.div initial={{ opacity: 0, y: -12 }} animate={{ opacity: 1, y: 0 }}>
        <Link href="/dashboard"
          className="inline-flex items-center gap-1.5 text-sm text-[#6b8dd6] hover:text-[#1a1e5e] mb-3 transition-colors">
          <ArrowLeft className="w-4 h-4" />
          На главную
        </Link>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1e5e]">Детальная аналитика</h1>
            <p className="text-[#4a5a8a] text-sm mt-0.5">
              {filtered.length > 0
                ? `${filtered.length} запис${filtered.length === 1 ? 'ь' : filtered.length < 5 ? 'и' : 'ей'} за выбранный период`
                : 'Нет данных за выбранный период'}
            </p>
          </div>

          {/* Переключатель периода */}
          <div className="flex bg-white border border-[#c5d3f0]/30 rounded-xl p-1 gap-1 shadow-sm">
            {PERIODS.map(p => (
              <button
                key={p.value}
                onClick={() => setPeriod(p.value)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all ${
                  period === p.value
                    ? 'bg-[#6b8dd6] text-white shadow-sm'
                    : 'text-[#4a5a8a] hover:text-[#1a1e5e]'
                }`}
              >
                {p.label}
              </button>
            ))}
          </div>
        </div>
      </motion.div>

      {filtered.length === 0 ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex flex-col items-center justify-center py-24 text-center">
          <div className="w-16 h-16 bg-[#eef2ff] rounded-2xl flex items-center justify-center mb-4">
            <Activity className="w-8 h-8 text-[#6b8dd6]" />
          </div>
          <p className="text-lg font-semibold text-[#1a1e5e] mb-1">Нет данных</p>
          <p className="text-sm text-[#4a5a8a]">Добавьте записи на главной странице</p>
        </motion.div>
      ) : (
        <>
          {/* ── Сводка ── */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 sm:gap-4">
            <StatTile icon={Footprints} label="Ср. шаги"    value={summaryStats!.avgSteps.toLocaleString('ru-RU')} color="#6b8dd6" delay={0.05} />
            <StatTile icon={Moon}       label="Ср. сон"     value={summaryStats!.avgSleep}    unit="ч"      color="#93b4e8" delay={0.1}  />
            <StatTile icon={Heart}      label="Ср. пульс"   value={summaryStats!.avgHeartRate} unit="уд/мин" color="#f87171" delay={0.15} />
            <StatTile icon={Weight}     label="Последний вес" value={summaryStats!.latestWeight} unit="кг"   color="#a78bfa" delay={0.2}  />
            <StatTile icon={TrendingUp} label="Ср. индекс"  value={summaryStats!.avgScore}    unit="/100"   color="#34d399" delay={0.25} />
          </div>

          {/* ── Графики ── */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">

            {/* Шаги */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
              className="bg-white rounded-3xl p-5 border border-[#c5d3f0]/20 shadow-sm">
              <h3 className="text-sm font-bold text-[#1a1e5e] mb-1">Шаги</h3>
              <p className="text-xs text-[#4a5a8a] mb-4">Ежедневная активность</p>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={stepsData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" vertical={false} />
                  <XAxis dataKey="date" {...axisProps} interval="preserveStartEnd" />
                  <YAxis {...axisProps} />
                  <Tooltip content={<Tip />} />
                  <Bar dataKey="steps" fill="#6b8dd6" radius={[5,5,0,0]} name="Шаги" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Сон */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}
              className="bg-white rounded-3xl p-5 border border-[#c5d3f0]/20 shadow-sm">
              <h3 className="text-sm font-bold text-[#1a1e5e] mb-1">Сон</h3>
              <p className="text-xs text-[#4a5a8a] mb-4">Часы сна по ночам</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={sleepData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                  <defs>
                    <linearGradient id="sleepGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#93b4e8" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#93b4e8" stopOpacity={0}   />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" vertical={false} />
                  <XAxis dataKey="date" {...axisProps} interval="preserveStartEnd" />
                  <YAxis {...axisProps} domain={[0, 12]} />
                  <Tooltip content={<Tip />} />
                  <Area type="monotone" dataKey="сон" stroke="#93b4e8" fill="url(#sleepGrad)" strokeWidth={2.5} dot={{ r: 4, fill: '#93b4e8' }} name="Сон (ч)" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Вес */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
              className="bg-white rounded-3xl p-5 border border-[#c5d3f0]/20 shadow-sm">
              <h3 className="text-sm font-bold text-[#1a1e5e] mb-1">Вес</h3>
              <p className="text-xs text-[#4a5a8a] mb-4">Динамика веса</p>
              <ResponsiveContainer width="100%" height={200}>
                <LineChart data={weightData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" vertical={false} />
                  <XAxis dataKey="date" {...axisProps} interval="preserveStartEnd" />
                  <YAxis {...axisProps} />
                  <Tooltip content={<Tip />} />
                  <Line type="monotone" dataKey="вес" stroke="#a78bfa" strokeWidth={2.5}
                    dot={{ r: 4, fill: '#a78bfa' }} activeDot={{ r: 6 }} name="Вес (кг)" />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Индекс здоровья */}
            <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}
              className="bg-white rounded-3xl p-5 border border-[#c5d3f0]/20 shadow-sm">
              <h3 className="text-sm font-bold text-[#1a1e5e] mb-1">Индекс здоровья</h3>
              <p className="text-xs text-[#4a5a8a] mb-4">Ежедневный показатель 0–100</p>
              <ResponsiveContainer width="100%" height={200}>
                <AreaChart data={scoreData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                  <defs>
                    <linearGradient id="scoreGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor="#34d399" stopOpacity={0.35} />
                      <stop offset="95%" stopColor="#34d399" stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" vertical={false} />
                  <XAxis dataKey="date" {...axisProps} interval="preserveStartEnd" />
                  <YAxis {...axisProps} domain={[0, 100]} />
                  <Tooltip content={<Tip />} />
                  <Area type="monotone" dataKey="индекс" stroke="#34d399" fill="url(#scoreGrad)"
                    strokeWidth={2.5} dot={{ r: 4, fill: '#34d399' }} name="Индекс" />
                </AreaChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* ── Таблица ── */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
            className="bg-white rounded-3xl p-5 sm:p-6 border border-[#c5d3f0]/20 shadow-sm">
            <h3 className="text-base font-bold text-[#1a1e5e] mb-4">Все записи за период</h3>
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[600px]">
                <thead>
                  <tr className="border-b border-[#eef2ff]">
                    {['Дата','Шаги','Сон','Пульс','Вес','Калории','Индекс'].map(h => (
                      <th key={h} className={`py-3 px-3 text-[#4a5a8a] font-semibold whitespace-nowrap text-xs ${h === 'Дата' ? 'text-left' : 'text-right'}`}>
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {[...sorted].reverse().map(e => {
                    const score = calcHealthScore([e]);
                    const scoreColor =
                      score >= 75 ? 'bg-green-100 text-green-700'
                    : score >= 50 ? 'bg-amber-100 text-amber-700'
                    : 'bg-red-100 text-red-600';
                    const stepsOk = e.steps >= 8000;
                    const sleepOk = e.sleepHours >= 7;
                    return (
                      <tr key={e.id} className="border-b border-[#eef2ff]/50 hover:bg-[#f5f8ff] transition-colors">
                        <td className="py-3 px-3 font-semibold text-[#1a1e5e] whitespace-nowrap">{fmtFull(e.date)}</td>
                        <td className={`py-3 px-3 text-right font-semibold ${stepsOk ? 'text-[#6b8dd6]' : 'text-[#4a5a8a]'}`}>
                          {e.steps.toLocaleString('ru-RU')}
                          {stepsOk && <span className="ml-1 text-green-500 text-xs">✓</span>}
                        </td>
                        <td className={`py-3 px-3 text-right font-semibold ${sleepOk ? 'text-[#93b4e8]' : 'text-amber-500'}`}>
                          {e.sleepHours} ч
                        </td>
                        <td className="py-3 px-3 text-right text-[#4a5a8a]">{e.heartRate} уд/мин</td>
                        <td className="py-3 px-3 text-right text-[#4a5a8a]">{e.weight} кг</td>
                        <td className="py-3 px-3 text-right text-[#4a5a8a]">{e.calories ?? '—'}</td>
                        <td className="py-3 px-3 text-right">
                          <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-bold ${scoreColor}`}>
                            {score}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </motion.div>
        </>
      )}
    </div>
  );
}
