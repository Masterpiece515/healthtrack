'use client';

import { motion } from 'framer-motion';
import {
  ComposedChart, Area, Line, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from 'recharts';
import type { HealthEntry } from '@/lib/types';
import { calcHealthScore } from '@/lib/store';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function CustomTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-[#6b8dd6]/20 rounded-xl p-3 shadow-lg">
      <p className="text-xs text-[#4a5a8a] mb-2">{label}</p>
      {/* eslint-disable-next-line @typescript-eslint/no-explicit-any */}
      {payload.map((entry: any, i: number) => (
        <div key={i} className="flex items-center gap-2">
          <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: entry.color }} />
          <span className="text-sm text-[#1a1e5e] font-medium">
            {entry.name}: {(entry.value as number).toLocaleString('ru-RU')}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Chart({ entries }: { entries: HealthEntry[] }) {
  const chartData = entries.map((e) => ({
    time:      e.date.slice(5),
    steps:     e.steps,
    heartRate: e.heartRate,
    calories:  e.calories ?? 0,
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.5 }}
      className="bg-white rounded-3xl p-6 shadow-sm border border-[#6b8dd6]/10"
    >
      <div className="flex items-center justify-between mb-5">
        <div>
          <h3 className="text-lg font-bold text-[#1a1e5e]">Активность за неделю</h3>
          <p className="text-sm text-[#4a5a8a]">{entries.length} записей из журнала</p>
        </div>
        <div className="hidden md:flex items-center gap-4">
          {[
            { color: '#6b8dd6', label: 'Шаги'    },
            { color: '#93b4e8', label: 'Пульс'   },
            { color: '#c5d3f0', label: 'Калории' },
          ].map(({ color, label }) => (
            <div key={label} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: color }} />
              <span className="text-xs text-[#4a5a8a]">{label}</span>
            </div>
          ))}
        </div>
      </div>

      {chartData.length === 0 ? (
        <div className="h-[280px] flex items-center justify-center">
          <p className="text-[#c5d3f0] text-sm">Нет данных для отображения</p>
        </div>
      ) : (
        <>
          <ResponsiveContainer width="100%" height={240}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 10, bottom: 5, left: 0 }}>
              <defs>
                <linearGradient id="stepsGradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%"  stopColor="#6b8dd6" stopOpacity={0.3} />
                  <stop offset="95%" stopColor="#6b8dd6" stopOpacity={0}   />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" vertical={false} />
              <XAxis dataKey="time" stroke="#4a5a8a" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis yAxisId="left"  stroke="#4a5a8a" fontSize={11} tickLine={false} axisLine={false} />
              <YAxis yAxisId="right" orientation="right" stroke="#4a5a8a" fontSize={11} tickLine={false} axisLine={false} />
              <Tooltip content={<CustomTooltip />} />
              <Area yAxisId="left"  type="monotone" dataKey="steps"     fill="url(#stepsGradient)" stroke="#6b8dd6" strokeWidth={2.5} name="Шаги" />
              <Line yAxisId="right" type="monotone" dataKey="heartRate" stroke="#93b4e8" strokeWidth={2.5} dot={false} name="Пульс" />
              <Bar  yAxisId="left"  dataKey="calories" fill="#c5d3f0" opacity={0.5} radius={[4, 4, 0, 0]} name="Калории" />
            </ComposedChart>
          </ResponsiveContainer>

          {/* ── Таблица активностей ── */}
          <div className="mt-4 border-t border-[#eef2ff] pt-4 overflow-x-auto">
            <table className="w-full text-xs min-w-[480px]">
              <thead>
                <tr className="border-b border-[#eef2ff]">
                  {['Дата','Шаги','Сон','Пульс','Вес','Калории','Индекс'].map(h => (
                    <th key={h} className={`py-2 px-2 text-[#4a5a8a] font-semibold whitespace-nowrap ${h === 'Дата' ? 'text-left' : 'text-right'}`}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {[...entries].sort((a,b) => b.date.localeCompare(a.date)).slice(0, 7).map(e => {
                  const score = calcHealthScore([e]);
                  const scoreColor = score >= 75 ? 'bg-green-100 text-green-700'
                                   : score >= 50 ? 'bg-yellow-100 text-yellow-700'
                                   : 'bg-red-100 text-red-600';
                  return (
                    <tr key={e.id} className="border-b border-[#eef2ff]/60 hover:bg-[#f5f8ff] transition-colors">
                      <td className="py-2 px-2 font-medium text-[#1a1e5e] whitespace-nowrap">
                        {new Date(e.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                      </td>
                      <td className="py-2 px-2 text-right font-semibold text-[#6b8dd6]">
                        {e.steps.toLocaleString('ru-RU')}
                      </td>
                      <td className="py-2 px-2 text-right text-[#93b4e8] font-semibold">{e.sleepHours} ч</td>
                      <td className="py-2 px-2 text-right text-[#4a5a8a]">{e.heartRate} уд</td>
                      <td className="py-2 px-2 text-right text-[#4a5a8a]">{e.weight} кг</td>
                      <td className="py-2 px-2 text-right text-[#4a5a8a]">{e.calories ?? '—'}</td>
                      <td className="py-2 px-2 text-right">
                        <span className={`px-2 py-0.5 rounded-full text-xs font-bold ${scoreColor}`}>{score}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </motion.div>
  );
}
