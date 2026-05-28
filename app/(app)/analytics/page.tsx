'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, LineChart, Line, Legend,
} from 'recharts';
import { calcHealthScore } from '@/lib/store';
import type { HealthEntry } from '@/lib/types';

interface ChartRow {
  day:   string;
  steps: number;
  sleep: number;
  score: number;
}

function buildChartData(entries: HealthEntry[]): ChartRow[] {
  return entries.slice(-7).map(e => ({
    day:   new Date(e.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' }),
    steps: e.steps,
    sleep: e.sleepHours,
    score: calcHealthScore([e]),
  }));
}

export default function AnalyticsPage() {
  const [data,    setData]    = useState<ChartRow[]>([]);
  const [entries, setEntries] = useState<HealthEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/health')
      .then(r => r.json())
      .then(d => {
        const raw: HealthEntry[] = d.entries ?? [];
        setEntries(raw);
        setData(buildChartData(raw));
      })
      .finally(() => setLoading(false));
  }, []);

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1e5e] mb-2">Аналитика</h1>
        <p className="text-[#4a5a8a]">Детальный анализ ваших показателей за неделю</p>
      </motion.div>

      {loading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[...Array(2)].map((_, i) => (
            <div key={i} className="bg-white rounded-3xl h-72 animate-pulse" />
          ))}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Шаги за неделю */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="bg-white rounded-3xl p-6 shadow-xl"
            >
              <h3 className="text-lg font-bold text-[#1a1e5e] mb-1">Шаги за неделю</h3>
              <p className="text-sm text-[#4a5a8a] mb-6">Ежедневная активность</p>
              <ResponsiveContainer width="100%" height={240}>
                <BarChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" opacity={0.4} vertical={false} />
                  <XAxis dataKey="day" stroke="#4a5a8a" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#4a5a8a" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: '#f5f8ff', border: '1px solid #6b8dd6', borderRadius: 12 }} />
                  <Bar dataKey="steps" fill="#6b8dd6" radius={[6, 6, 0, 0]} name="Шаги" />
                </BarChart>
              </ResponsiveContainer>
            </motion.div>

            {/* Индекс здоровья и сон */}
            <motion.div
              initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.2 }}
              className="bg-white rounded-3xl p-6 shadow-xl"
            >
              <h3 className="text-lg font-bold text-[#1a1e5e] mb-1">Сон и индекс здоровья</h3>
              <p className="text-sm text-[#4a5a8a] mb-6">Динамика за 7 дней</p>
              <ResponsiveContainer width="100%" height={240}>
                <LineChart data={data}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eef2ff" opacity={0.4} vertical={false} />
                  <XAxis dataKey="day" stroke="#4a5a8a" fontSize={12} tickLine={false} axisLine={false} />
                  <YAxis stroke="#4a5a8a" fontSize={12} tickLine={false} axisLine={false} />
                  <Tooltip contentStyle={{ background: '#f5f8ff', border: '1px solid #93b4e8', borderRadius: 12 }} />
                  <Legend wrapperStyle={{ fontSize: 12, color: '#4a5a8a' }} />
                  <Line type="monotone" dataKey="score" stroke="#6b8dd6" strokeWidth={3} dot={{ r: 5 }} name="Индекс" />
                  <Line type="monotone" dataKey="sleep" stroke="#93b4e8" strokeWidth={3} dot={{ r: 5 }} name="Сон (ч)" />
                </LineChart>
              </ResponsiveContainer>
            </motion.div>
          </div>

          {/* Сводная таблица */}
          <motion.div
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="bg-white rounded-3xl p-6 shadow-xl"
          >
            <h3 className="text-lg font-bold text-[#1a1e5e] mb-6">Сводка</h3>
            {entries.length === 0 ? (
              <p className="text-[#4a5a8a] text-sm py-8 text-center">
                Нет данных — добавьте первую запись на главной странице
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-xs sm:text-sm">
                  <thead>
                    <tr className="border-b border-[#c5d3f0]/30">
                      {['Дата', 'Шаги', 'Сон (ч)', 'Пульс', 'Вес', 'Индекс'].map(h => (
                        <th key={h} className="text-left py-3 px-2 sm:px-4 text-[#4a5a8a] font-medium whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {[...entries].reverse().map(e => {
                      const score = calcHealthScore([e]);
                      return (
                        <tr key={e.id} className="border-b border-[#c5d3f0]/15 hover:bg-[#6b8dd6]/5 transition-colors">
                          <td className="py-3 px-2 sm:px-4 font-medium text-[#1a1e5e] whitespace-nowrap">
                            {new Date(e.date).toLocaleDateString('ru-RU', { day: 'numeric', month: 'short' })}
                          </td>
                          <td className="py-3 px-2 sm:px-4 text-[#1a1e5e]">{e.steps.toLocaleString('ru-RU')}</td>
                          <td className="py-3 px-2 sm:px-4 text-[#1a1e5e]">{e.sleepHours}</td>
                          <td className="py-3 px-2 sm:px-4 text-[#1a1e5e]">{e.heartRate}</td>
                          <td className="py-3 px-2 sm:px-4 text-[#1a1e5e]">{e.weight} кг</td>
                          <td className="py-3 px-2 sm:px-4">
                            <span
                              className="px-3 py-1 rounded-full text-xs font-medium"
                              style={{
                                background: score >= 75 ? '#4ade8020' : score >= 60 ? '#fbbf2420' : '#ef444420',
                                color:      score >= 75 ? '#4ade80'   : score >= 60 ? '#fbbf24'   : '#ef4444',
                              }}
                            >
                              {score}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </motion.div>
        </>
      )}
    </div>
  );
}
