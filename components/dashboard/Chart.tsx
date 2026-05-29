'use client';

import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AreaChart, Area, BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';
import type { HealthEntry } from '@/lib/types';
import { calcHealthScore } from '@/lib/store';

// ── Типы ──────────────────────────────────────────────────────────────────────
type Period = 7 | 14 | 30;
type MetricKey = 'steps' | 'sleep' | 'heartRate' | 'weight';

const PERIODS: { label: string; value: Period }[] = [
  { label: '7 дн',  value: 7  },
  { label: '14 дн', value: 14 },
  { label: '30 дн', value: 30 },
];

const METRICS: {
  key: MetricKey; label: string; unit: string;
  color: string; goal?: number; goalLabel?: string; chartType: 'area' | 'bar';
}[] = [
  { key: 'steps',     label: 'Шаги',   unit: 'шаг',   color: '#6b8dd6', goal: 10000, goalLabel: 'Цель 10 000', chartType: 'bar'  },
  { key: 'sleep',     label: 'Сон',    unit: 'ч',     color: '#93b4e8', goal: 8,     goalLabel: 'Норма 8 ч',   chartType: 'area' },
  { key: 'heartRate', label: 'Пульс',  unit: 'уд/мин',color: '#f87171', chartType: 'area' },
  { key: 'weight',    label: 'Вес',    unit: 'кг',    color: '#a78bfa', chartType: 'area' },
];

// ── Фильтр по периоду ─────────────────────────────────────────────────────────
function filterDays(entries: HealthEntry[], days: Period): HealthEntry[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - days);
  cutoff.setHours(0, 0, 0, 0);
  return entries
    .filter(e => new Date(e.date) >= cutoff)
    .sort((a, b) => a.date.localeCompare(b.date));
}

function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' });
}

function avg(arr: number[]) {
  return arr.length ? Math.round((arr.reduce((s, v) => s + v, 0) / arr.length) * 10) / 10 : 0;
}

// ── Тултип ────────────────────────────────────────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function Tip({ active, payload, label, unit }: any) {
  if (!active || !payload?.length) return null;
  const val = payload[0]?.value as number;
  return (
    <div className="bg-white border border-[#6b8dd6]/15 rounded-xl px-3 py-2 shadow-lg text-xs">
      <p className="text-[#4a5a8a] mb-1 font-medium">{label}</p>
      <p className="text-[#1a1e5e] font-bold text-sm">
        {typeof val === 'number' ? val.toLocaleString('ru-RU') : val}
        <span className="text-[#4a5a8a] font-normal ml-1 text-xs">{unit}</span>
      </p>
    </div>
  );
}

// ── Основной компонент ────────────────────────────────────────────────────────
export function Chart({ entries }: { entries: HealthEntry[] }) {
  const [period,    setPeriod]    = useState<Period>(7);
  const [activeKey, setActiveKey] = useState<MetricKey>('steps');

  const filtered = useMemo(() => filterDays(entries, period), [entries, period]);
  const metric   = METRICS.find(m => m.key === activeKey)!;

  // Данные для графика
  const chartData = useMemo(() => filtered.map(e => ({
    date:      fmtDate(e.date),
    steps:     e.steps,
    sleep:     e.sleepHours,
    heartRate: e.heartRate,
    weight:    e.weight,
  })), [filtered]);

  // Мини-статистика
  const vals = filtered.map(e =>
    activeKey === 'steps'     ? e.steps
    : activeKey === 'sleep'   ? e.sleepHours
    : activeKey === 'heartRate' ? e.heartRate
    : e.weight
  );
  const statAvg = avg(vals);
  const statMax = vals.length ? Math.max(...vals) : 0;
  const statMin = vals.length ? Math.min(...vals) : 0;

  // Цвет для кнопки метрики
  const metricBg = (key: MetricKey) =>
    key === activeKey ? metric.color : 'transparent';

  if (entries.length === 0) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl p-6 shadow-sm border border-[#6b8dd6]/10"
      >
        <h3 className="text-lg font-bold text-[#1a1e5e] mb-1">Активность</h3>
        <div className="h-[260px] flex items-center justify-center">
          <p className="text-[#c5d3f0] text-sm">Нет данных для отображения</p>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="bg-white rounded-3xl p-5 sm:p-6 shadow-sm border border-[#6b8dd6]/10"
    >
      {/* ── Шапка ── */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
        <div>
          <h3 className="text-lg font-bold text-[#1a1e5e]">Активность</h3>
          <p className="text-xs text-[#4a5a8a]">
            {filtered.length} {filtered.length === 1 ? 'запись' : filtered.length < 5 ? 'записи' : 'записей'} за период
          </p>
        </div>

        {/* Переключатель периода */}
        <div className="flex bg-[#f5f8ff] rounded-xl p-0.5 gap-0.5 self-start sm:self-auto">
          {PERIODS.map(p => (
            <button
              key={p.value}
              onClick={() => setPeriod(p.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === p.value
                  ? 'bg-white text-[#1a1e5e] shadow-sm'
                  : 'text-[#4a5a8a] hover:text-[#1a1e5e]'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Переключатель метрик ── */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {METRICS.map(m => (
          <button
            key={m.key}
            onClick={() => setActiveKey(m.key)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold
                       whitespace-nowrap transition-all border flex-shrink-0"
            style={{
              background:   m.key === activeKey ? `${m.color}18` : 'transparent',
              borderColor:  m.key === activeKey ? `${m.color}50` : '#e8eef8',
              color:        m.key === activeKey ? m.color : '#4a5a8a',
            }}
          >
            <div className="w-2 h-2 rounded-full flex-shrink-0" style={{ background: metricBg(m.key) === 'transparent' ? '#c5d3f0' : m.color }} />
            {m.label}
          </button>
        ))}
      </div>

      {/* ── Мини-статистика ── */}
      {filtered.length > 0 && (
        <div className="grid grid-cols-3 gap-2 mb-4">
          {[
            { label: 'Среднее', value: statAvg },
            { label: 'Максимум', value: statMax },
            { label: 'Минимум', value: statMin },
          ].map(s => (
            <div key={s.label} className="bg-[#f5f8ff] rounded-xl px-3 py-2 text-center">
              <p className="text-[10px] text-[#4a5a8a] mb-0.5">{s.label}</p>
              <p className="text-sm font-bold text-[#1a1e5e]">
                {typeof s.value === 'number' ? s.value.toLocaleString('ru-RU') : s.value}
                <span className="text-[10px] font-normal text-[#4a5a8a] ml-0.5">{metric.unit}</span>
              </p>
            </div>
          ))}
        </div>
      )}

      {/* ── График ── */}
      <AnimatePresence mode="wait">
        <motion.div
          key={`${activeKey}-${period}`}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -6 }}
          transition={{ duration: 0.2 }}
        >
          {filtered.length === 0 ? (
            <div className="h-[200px] flex items-center justify-center">
              <p className="text-[#c5d3f0] text-sm">Нет данных за этот период</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={200}>
              {metric.chartType === 'bar' ? (
                <BarChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}
                  barCategoryGap={filtered.length > 14 ? '10%' : '20%'}>
                  <defs>
                    <linearGradient id={`bar-${activeKey}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%"   stopColor={metric.color} stopOpacity={1}   />
                      <stop offset="100%" stopColor={metric.color} stopOpacity={0.7} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff" vertical={false} />
                  <XAxis dataKey="date"
                    tick={{ fill: '#4a5a8a', fontSize: 10 }}
                    tickLine={false} axisLine={false}
                    interval={filtered.length > 14 ? 3 : filtered.length > 7 ? 1 : 0}
                  />
                  <YAxis tick={{ fill: '#4a5a8a', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<Tip unit={metric.unit} />} cursor={{ fill: `${metric.color}10` }} />
                  {metric.goal && (
                    <ReferenceLine y={metric.goal} stroke={metric.color} strokeDasharray="4 4"
                      strokeOpacity={0.5}
                      label={{ value: metric.goalLabel, position: 'insideTopRight', fontSize: 10, fill: metric.color }} />
                  )}
                  <Bar dataKey={activeKey} fill={`url(#bar-${activeKey})`}
                    radius={[4, 4, 0, 0]} name={metric.label}
                    // Подсветка баров выше цели
                    {...(metric.goal ? {
                      // eslint-disable-next-line @typescript-eslint/no-explicit-any
                      fill: undefined, shape: (props: any) => {
                        const { x, y, width, height, value } = props;
                        const aboveGoal = metric.goal && value >= metric.goal;
                        return (
                          <rect x={x} y={y} width={width} height={height}
                            fill={aboveGoal ? `${metric.color}` : `${metric.color}90`}
                            rx={4} ry={4} />
                        );
                      }
                    } : {})}
                  />
                </BarChart>
              ) : (
                <AreaChart data={chartData} margin={{ top: 4, right: 4, bottom: 0, left: -16 }}>
                  <defs>
                    <linearGradient id={`area-${activeKey}`} x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%"  stopColor={metric.color} stopOpacity={0.25} />
                      <stop offset="95%" stopColor={metric.color} stopOpacity={0}    />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f4ff" vertical={false} />
                  <XAxis dataKey="date"
                    tick={{ fill: '#4a5a8a', fontSize: 10 }}
                    tickLine={false} axisLine={false}
                    interval={filtered.length > 14 ? 3 : filtered.length > 7 ? 1 : 0}
                  />
                  <YAxis tick={{ fill: '#4a5a8a', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <Tooltip content={<Tip unit={metric.unit} />} />
                  {metric.goal && (
                    <ReferenceLine y={metric.goal} stroke={metric.color} strokeDasharray="4 4"
                      strokeOpacity={0.5}
                      label={{ value: metric.goalLabel, position: 'insideTopRight', fontSize: 10, fill: metric.color }} />
                  )}
                  <Area type="monotone" dataKey={activeKey}
                    stroke={metric.color} strokeWidth={2.5}
                    fill={`url(#area-${activeKey})`}
                    dot={filtered.length <= 14 ? { r: 3, fill: metric.color, strokeWidth: 0 } : false}
                    activeDot={{ r: 5, fill: metric.color, strokeWidth: 2, stroke: '#fff' }}
                    name={metric.label}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          )}
        </motion.div>
      </AnimatePresence>

      {/* ── Таблица последних 7 записей ── */}
      {entries.length > 0 && (
        <div className="mt-5 border-t border-[#f0f4ff] pt-4 overflow-x-auto">
          <p className="text-xs font-semibold text-[#4a5a8a] mb-3">Последние записи</p>
          <table className="w-full text-xs min-w-[480px]">
            <thead>
              <tr className="border-b border-[#f0f4ff]">
                {['Дата','Шаги','Сон','Пульс','Вес','Индекс'].map(h => (
                  <th key={h} className={`pb-2 px-2 text-[#4a5a8a] font-semibold whitespace-nowrap ${h === 'Дата' ? 'text-left' : 'text-right'}`}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...entries].sort((a, b) => b.date.localeCompare(a.date)).slice(0, 7).map(e => {
                const score = calcHealthScore([e]);
                const scoreColor =
                  score >= 75 ? 'bg-green-100 text-green-700'
                : score >= 50 ? 'bg-amber-100 text-amber-700'
                : 'bg-red-100 text-red-600';
                const stepsOk = e.steps >= 10000;
                const sleepOk = e.sleepHours >= 7;
                return (
                  <tr key={e.id} className="border-b border-[#f0f4ff]/60 hover:bg-[#f5f8ff] transition-colors">
                    <td className="py-2 px-2 font-semibold text-[#1a1e5e] whitespace-nowrap">{fmtDate(e.date)}</td>
                    <td className="py-2 px-2 text-right">
                      <span className={`font-semibold ${stepsOk ? 'text-[#6b8dd6]' : 'text-[#4a5a8a]'}`}>
                        {e.steps.toLocaleString('ru-RU')}
                      </span>
                      {stepsOk && <span className="ml-1 text-green-500">✓</span>}
                    </td>
                    <td className={`py-2 px-2 text-right font-semibold ${sleepOk ? 'text-[#93b4e8]' : 'text-amber-500'}`}>{e.sleepHours}ч</td>
                    <td className="py-2 px-2 text-right text-[#f87171] font-medium">{e.heartRate}</td>
                    <td className="py-2 px-2 text-right text-[#a78bfa] font-medium">{e.weight} кг</td>
                    <td className="py-2 px-2 text-right">
                      <span className={`inline-block px-2 py-0.5 rounded-full font-bold ${scoreColor}`}>{score}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </motion.div>
  );
}
