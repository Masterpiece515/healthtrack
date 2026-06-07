'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Activity, Award, Flame, TrendingUp, Check, X } from '@/components/icons';
import { useToast } from '@/lib/toast-context';

interface Goal {
  id: string; metric: string; target: number; unit: string;
  current: number; percent: number; daysCount?: number;
}
interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalEntries:  number;
}

const METRIC_META: Record<string, { label: string; color: string; icon: string; tip: string }> = {
  steps:    { label: 'Шаги',    color: '#6b8dd6', icon: '🚶', tip: 'среднее за 7 дней' },
  sleep:    { label: 'Сон',     color: '#93b4e8', icon: '🌙', tip: 'среднее за 7 дней' },
  weight:   { label: 'Вес',     color: '#a78bfa', icon: '⚖️', tip: 'последняя запись'  },
  calories: { label: 'Калории', color: '#f97316', icon: '🔥', tip: 'среднее за 7 дней' },
};

// ── Круговой прогресс SVG ────────────────────────────────────────────────────
function Ring({ pct, color, size = 96 }: { pct: number; color: string; size?: number }) {
  const stroke = 9;
  const r = (size - stroke) / 2;
  const circ = 2 * Math.PI * r;
  const filled = Math.min(pct / 100, 1) * circ;
  return (
    <svg width={size} height={size} className="block" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke="#f0f4ff" strokeWidth={stroke} />
      <motion.circle cx={size / 2} cy={size / 2} r={r} fill="none"
        stroke={pct >= 100 ? '#4ade80' : color} strokeWidth={stroke}
        strokeLinecap="round"
        initial={{ strokeDasharray: `0 ${circ}` }}
        animate={{ strokeDasharray: `${filled} ${circ}` }}
        transition={{ duration: 1.1, ease: 'easeOut' }} />
    </svg>
  );
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const { toast } = useToast();

  const [goals,   setGoals]   = useState<Goal[]>([]);
  const [streak,  setStreak]  = useState<StreakData>({ currentStreak: 0, longestStreak: 0, totalEntries: 0 });
  const [loading, setLoading] = useState(true);
  const [editId,  setEditId]  = useState<string | null>(null);
  const [editVal, setEditVal] = useState('');
  const [saving,  setSaving]  = useState(false);

  const fetchData = useCallback(async () => {
    try {
      const [goalsRes, streakRes] = await Promise.all([
        fetch('/api/goals'),
        fetch('/api/streak'),
      ]);
      const goalsData  = await goalsRes.json();
      const streakData = await streakRes.json();
      setGoals(goalsData.goals ?? []);
      setStreak(streakData);
    } catch {
      toast('Ошибка загрузки данных', 'error');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const saveEdit = async (g: Goal) => {
    const target = Number(editVal);
    if (!target || target <= 0) { toast('Введите корректное значение', 'error'); return; }
    setSaving(true);
    try {
      const res = await fetch('/api/goals', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ metric: g.metric, target, unit: g.unit }),
      });
      if (!res.ok) { toast('Ошибка сохранения', 'error'); return; }
      toast('Цель обновлена', 'success');
      await fetchData();
      setEditId(null);
    } finally {
      setSaving(false);
    }
  };

  const userName  = (session?.user as { name?: string })?.name ?? 'Пользователь';
  const userEmail = (session?.user as { email?: string })?.email ?? '';
  const userInitial = userName.charAt(0).toUpperCase();

  // Процент активности: (дней с записями / 30) * 100
  const activityRate = Math.min(Math.round((streak.totalEntries / 30) * 100), 100);

  const profileStats = [
    { label: 'Записей',        value: String(streak.totalEntries),  icon: Activity,   color: '#4ade80' },
    { label: 'Серия дней',     value: `${streak.currentStreak}🔥`,  icon: Flame,      color: '#f97316' },
    { label: 'Рекорд серии',   value: String(streak.longestStreak), icon: Award,      color: '#6b8dd6' },
    { label: 'Ср. активность', value: `${activityRate}%`,           icon: TrendingUp, color: '#93b4e8' },
  ];

  return (
    <div className="space-y-8">
      <motion.div initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1e5e] mb-1">Профиль</h1>
        <p className="text-[#4a5a8a]">Ваши данные и личные цели</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Карточка пользователя */}
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="bg-[#1a1e5e] rounded-3xl p-5 sm:p-8 text-center shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-40 h-40 bg-[#6b8dd6]/10 rounded-full blur-2xl" />
          <div className="relative z-10">
            <div className="w-24 h-24 bg-gradient-to-br from-[#6b8dd6] to-[#93b4e8] rounded-full flex items-center justify-center mx-auto mb-4 shadow-xl">
              {session?.user ? (
                <span className="text-white text-3xl font-bold">{userInitial}</span>
              ) : (
                <User className="w-12 h-12 text-white" />
              )}
            </div>
            <h2 className="text-2xl font-bold text-white mb-1">{userName}</h2>
            {userEmail && (
              <div className="flex items-center justify-center gap-2 text-white/50 text-sm mb-6">
                <Mail className="w-3.5 h-3.5" /><span>{userEmail}</span>
              </div>
            )}
            {/* Стрик-бейдж */}
            {streak.currentStreak > 0 && (
              <div className="bg-white/10 rounded-2xl p-3 mb-3">
                <p className="text-white/50 text-xs mb-1">Текущая серия</p>
                <p className="text-3xl font-bold text-[#f97316]">{streak.currentStreak} 🔥</p>
                <p className="text-white/40 text-xs mt-1">дней подряд</p>
              </div>
            )}
          </div>
        </motion.div>

        {/* Статистика */}
        <div className="lg:col-span-2 grid grid-cols-2 gap-3 sm:gap-4">
          {profileStats.map((s, i) => {
            const Icon = s.icon;
            return (
              <motion.div key={s.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.08 }}
                className="bg-white rounded-2xl p-4 sm:p-6 shadow-lg">
                <div className="flex items-start justify-between mb-4">
                  <p className="text-sm text-[#4a5a8a] font-medium">{s.label}</p>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: `${s.color}20` }}>
                    <Icon className="w-5 h-5" style={{ color: s.color }} />
                  </div>
                </div>
                <p className="text-2xl sm:text-3xl font-bold text-[#1a1e5e]">{s.value}</p>
              </motion.div>
            );
          })}
        </div>
      </div>

      {/* Цели */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}
        className="bg-white rounded-3xl p-6 md:p-8 shadow-xl">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="text-xl font-bold text-[#1a1e5e]">Мои цели</h3>
            <p className="text-xs text-[#4a5a8a] mt-0.5">Нажмите на карточку чтобы изменить цель</p>
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-48 bg-[#c5d3f0]/15 rounded-2xl animate-pulse" />
            ))}
          </div>
        ) : goals.length === 0 ? (
          <div className="flex flex-col items-center gap-4 py-10">
            <div className="text-5xl">🎯</div>
            <p className="text-[#1a1e5e] font-semibold text-base">Цели ещё не установлены</p>
            <p className="text-[#4a5a8a] text-sm text-center max-w-xs">
              Установите стандартные цели и отслеживайте свой прогресс каждый день
            </p>
            <button
              onClick={async () => {
                setLoading(true);
                const defaults = [
                  { metric: 'steps',    target: 10000, unit: 'шагов' },
                  { metric: 'sleep',    target: 8,     unit: 'ч'     },
                  { metric: 'weight',   target: 70,    unit: 'кг'    },
                  { metric: 'calories', target: 2000,  unit: 'ккал'  },
                ];
                await Promise.all(defaults.map(d =>
                  fetch('/api/goals', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(d),
                  })
                ));
                await fetchData();
              }}
              className="px-6 py-2.5 bg-[#6b8dd6] text-white text-sm font-semibold rounded-xl
                         hover:bg-[#5a7cc5] transition-colors shadow-md"
            >
              Установить цели
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {goals.map((g, i) => {
              const meta   = METRIC_META[g.metric] ?? { label: g.metric, color: '#6b8dd6', icon: '🎯', tip: '' };
              const isEdit = editId === g.id;
              const done   = g.percent >= 100;
              const ringColor = done ? '#4ade80' : meta.color;

              return (
                <motion.div key={g.id}
                  initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.07 }}
                  onClick={() => { if (!isEdit) { setEditId(g.id); setEditVal(String(g.target)); } }}
                  className={`relative rounded-2xl p-4 cursor-pointer transition-all border select-none
                    ${isEdit
                      ? 'border-[#6b8dd6] bg-[#6b8dd6]/5 shadow-lg'
                      : 'border-[#c5d3f0]/30 bg-[#f9fafe] hover:bg-[#f0f4ff] hover:border-[#6b8dd6]/40 hover:shadow-md'
                    }`}
                >
                  {/* Иконка + имя */}
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-lg">{meta.icon}</span>
                    {done && (
                      <span className="text-[10px] font-bold text-green-600 bg-green-100 px-1.5 py-0.5 rounded-full">
                        ✓ Цель
                      </span>
                    )}
                  </div>
                  <p className="text-xs font-semibold text-[#4a5a8a] mb-3">{meta.label}</p>

                  {/* Кольцо прогресса */}
                  <AnimatePresence mode="wait">
                    {isEdit ? (
                      <motion.div key="edit" initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="flex flex-col items-center gap-2 py-2"
                        onClick={e => e.stopPropagation()}>
                        <p className="text-[10px] text-[#4a5a8a]">Новая цель</p>
                        <input
                          type="number"
                          value={editVal}
                          onChange={e => setEditVal(e.target.value)}
                          autoFocus
                          className="w-full text-center px-2 py-1.5 text-sm font-bold text-[#1a1e5e]
                                     border border-[#6b8dd6] rounded-xl focus:outline-none bg-white"
                        />
                        <span className="text-[10px] text-[#4a5a8a]">{g.unit}</span>
                        <div className="flex gap-2 mt-1">
                          <button onClick={() => saveEdit(g)} disabled={saving}
                            className="flex items-center gap-1 px-3 py-1 rounded-xl bg-[#6b8dd6] text-white text-xs font-semibold hover:bg-[#5a7cc5] transition-colors disabled:opacity-50">
                            <Check className="w-3 h-3" /> Сохранить
                          </button>
                          <button onClick={() => setEditId(null)}
                            className="p-1.5 rounded-xl bg-[#c5d3f0]/30 text-[#4a5a8a] hover:bg-[#c5d3f0]/60 transition-colors">
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      </motion.div>
                    ) : (
                      <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex flex-col items-center">
                        <div className="relative">
                          <Ring pct={g.percent} color={ringColor} size={88} />
                          <div className="absolute inset-0 flex flex-col items-center justify-center">
                            <span className="text-base font-bold" style={{ color: ringColor }}>
                              {g.percent}%
                            </span>
                          </div>
                        </div>
                        <div className="mt-2 text-center">
                          <p className="text-sm font-bold text-[#1a1e5e]">
                            {typeof g.current === 'number'
                              ? g.current % 1 === 0 ? g.current.toLocaleString('ru-RU') : g.current
                              : g.current}
                            <span className="text-[10px] font-normal text-[#4a5a8a] ml-0.5">{g.unit}</span>
                          </p>
                          <p className="text-[10px] text-[#4a5a8a] mt-0.5">
                            из {g.target.toLocaleString('ru-RU')} {g.unit}
                          </p>
                          {(g.daysCount ?? 0) > 0 && (
                            <p className="text-[9px] text-[#c5d3f0] mt-1">{meta.tip}</p>
                          )}
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
