'use client';

import { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import {
  BarChart, Bar, LineChart, Line, PieChart, Pie,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  Cell,
} from 'recharts';
import { BarChart3, TrendingUp, Users, Activity, Heart, Moon, Footprints, Weight } from '@/components/icons';

interface AnalyticsData {
  chart: { date: string; users: number; entries: number }[];
  topUsers: { id: string; name: string; email: string; role: string; entriesCount: number; lastEntry: string | null }[];
  roles: { name: string; value: number }[];
  avgs: { steps: number; sleep: number; heartRate: number; weight: number };
}

const PIE_COLORS = ['#93b4e8', '#6b8dd6'];

function Card({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  return (
    <div className={`bg-white/5 border border-white/10 rounded-2xl p-5 ${className}`}>
      {children}
    </div>
  );
}

function AvgTile({ icon: Icon, label, value, unit, color }: {
  icon: typeof Heart; label: string; value: number; unit: string; color: string;
}) {
  return (
    <div className="flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl p-4">
      <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
           style={{ background: `${color}25` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-white/40 text-xs mb-0.5">{label}</p>
        <p className="text-white font-bold text-xl">{value} <span className="text-white/40 text-sm font-normal">{unit}</span></p>
      </div>
    </div>
  );
}

const fmt = (date: string) => {
  const d = new Date(date);
  return `${d.getDate()}.${String(d.getMonth() + 1).padStart(2, '0')}`;
};

export default function AdminAnalyticsPage() {
  const [data, setData]       = useState<AnalyticsData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/analytics')
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError('Не удалось загрузить данные'))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4">{error}</div>
  );

  if (!data) return null;

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <BarChart3 className="w-7 h-7 text-amber-400" />
          <h1 className="text-2xl font-bold text-white">Аналитика</h1>
        </div>
        <p className="text-white/40 text-sm">Данные за последние 30 дней</p>
      </motion.div>

      {/* Средние значения метрик */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">Средние показатели здоровья</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <AvgTile icon={Footprints} label="Шаги"      value={data.avgs.steps}     unit="шаг/день" color="#6b8dd6" />
          <AvgTile icon={Moon}       label="Сон"       value={data.avgs.sleep}     unit="ч/ночь"  color="#93b4e8" />
          <AvgTile icon={Heart}      label="Пульс"     value={data.avgs.heartRate} unit="уд/мин"  color="#f87171" />
          <AvgTile icon={Weight}     label="Вес"       value={data.avgs.weight}    unit="кг"      color="#34d399" />
        </div>
      </motion.div>

      {/* Графики роста */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">

        {/* Новые пользователи */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-[#93b4e8]" />
              <h3 className="text-white font-semibold text-sm">Новые пользователи</h3>
            </div>
            {data.chart.length === 0 ? (
              <div className="flex items-center justify-center h-[220px] text-white/30 text-sm">Нет данных</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.chart} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" tickFormatter={fmt} tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} interval={4} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                    labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                    labelFormatter={(v: unknown) => fmt(String(v))}
                    cursor={{ fill: 'rgba(255,255,255,0.05)' }}
                  />
                  <Bar dataKey="users" fill="#93b4e8" radius={[4, 4, 0, 0]} name="Регистраций" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </Card>
        </motion.div>

        {/* Записи здоровья */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <Activity className="w-4 h-4 text-[#6b8dd6]" />
              <h3 className="text-white font-semibold text-sm">Записи здоровья</h3>
            </div>
            {data.chart.length === 0 ? (
              <div className="flex items-center justify-center h-[220px] text-white/30 text-sm">Нет данных</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <LineChart data={data.chart} margin={{ top: 4, right: 4, bottom: 0, left: -20 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                  <XAxis dataKey="date" tickFormatter={fmt} tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} interval={4} />
                  <YAxis tick={{ fill: 'rgba(255,255,255,0.35)', fontSize: 11 }} allowDecimals={false} />
                  <Tooltip
                    contentStyle={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                    labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                    labelFormatter={(v: unknown) => fmt(String(v))}
                  />
                  <Line type="monotone" dataKey="entries" stroke="#6b8dd6" strokeWidth={2} dot={false} name="Записей" />
                </LineChart>
              </ResponsiveContainer>
            )}
          </Card>
        </motion.div>
      </div>

      {/* Пользователи + роли */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">

        {/* Топ пользователей */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="xl:col-span-2">
          <Card>
            <div className="flex items-center gap-2 mb-4">
              <TrendingUp className="w-4 h-4 text-amber-400" />
              <h3 className="text-white font-semibold text-sm">Самые активные пользователи</h3>
            </div>
            <div className="space-y-2">
              {data.topUsers.map((u, i) => (
                <div key={u.id} className="flex items-center gap-3 py-2 border-b border-white/5 last:border-0">
                  <span className="text-white/30 text-xs w-5 text-right flex-shrink-0">{i + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6b8dd6] to-[#93b4e8] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{u.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{u.name}</p>
                    <p className="text-white/40 text-xs truncate">{u.email}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-amber-400 font-bold text-sm">{u.entriesCount}</p>
                    <p className="text-white/30 text-xs">записей</p>
                  </div>
                </div>
              ))}
              {data.topUsers.length === 0 && (
                <p className="text-white/30 text-sm text-center py-6">Нет данных</p>
              )}
            </div>
          </Card>
        </motion.div>

        {/* Распределение ролей */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.25 }}>
          <Card className="flex flex-col">
            <div className="flex items-center gap-2 mb-4">
              <Users className="w-4 h-4 text-[#93b4e8]" />
              <h3 className="text-white font-semibold text-sm">Роли пользователей</h3>
            </div>
            <div className="flex-1 flex flex-col items-center justify-center gap-4">
              <ResponsiveContainer width="100%" height={160}>
                <PieChart>
                  <Pie data={data.roles} cx="50%" cy="50%" innerRadius={50} outerRadius={70} paddingAngle={3} dataKey="value">
                    {data.roles.map((_, i) => (
                      <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{ background: '#1A1A2E', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 12 }}
                    labelStyle={{ color: 'rgba(255,255,255,0.6)' }}
                  />
                </PieChart>
              </ResponsiveContainer>
              <div className="flex flex-col gap-2 w-full">
                {data.roles.map((r, i) => (
                  <div key={r.name} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ background: PIE_COLORS[i] }} />
                      <span className="text-white/60 text-sm">{r.name}</span>
                    </div>
                    <span className="text-white font-bold text-sm">{r.value}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
