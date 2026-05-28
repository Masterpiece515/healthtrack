'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import { User, Mail, Activity, Award, Flame, TrendingUp, Pencil, Check, X } from '@/components/icons';
import { useToast } from '@/lib/toast-context';

interface Goal {
  id: string; metric: string; target: number; unit: string; current: number; percent: number;
}
interface StreakData {
  currentStreak: number;
  longestStreak: number;
  totalEntries:  number;
}

const METRIC_LABELS: Record<string, string> = {
  steps: 'Шаги в день', sleep: 'Сон в сутки', weight: 'Целевой вес', calories: 'Калории',
};
const METRIC_COLORS: Record<string, string> = {
  steps: '#6b8dd6', sleep: '#93b4e8', weight: '#4a5a8a', calories: '#eef2ff',
};

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
        <div className="mb-6">
          <h3 className="text-xl font-bold text-[#1a1e5e]">Мои цели</h3>
          <p className="text-sm text-[#4a5a8a] mt-0.5">Наведите на цель чтобы изменить</p>
        </div>

        {loading ? (
          <div className="space-y-4">
            {[...Array(4)].map((_, i) => <div key={i} className="h-16 bg-[#c5d3f0]/20 rounded-xl animate-pulse" />)}
          </div>
        ) : goals.length === 0 ? (
          <p className="text-[#4a5a8a] text-sm py-8 text-center">Цели не установлены</p>
        ) : (
          <div className="space-y-6">
            {goals.map((g) => {
              const color  = METRIC_COLORS[g.metric] ?? '#6b8dd6';
              const isEdit = editId === g.id;
              return (
                <motion.div key={g.id} layout className="group">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-semibold text-[#1a1e5e]">
                      {METRIC_LABELS[g.metric] ?? g.metric}
                    </span>
                    <AnimatePresence mode="wait">
                      {isEdit ? (
                        <motion.div key="edit" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="flex items-center gap-1.5">
                          <input type="number" value={editVal} onChange={e => setEditVal(e.target.value)} autoFocus
                            className="w-24 sm:w-28 px-2.5 py-1.5 text-sm text-[#1a1e5e] bg-white border border-[#6b8dd6] rounded-lg focus:outline-none" />
                          <span className="text-xs text-[#4a5a8a]">{g.unit}</span>
                          <button onClick={() => saveEdit(g)} disabled={saving}
                            className="p-1.5 rounded-lg bg-[#6b8dd6]/20 text-[#6b8dd6] hover:bg-[#6b8dd6]/40 transition-colors">
                            <Check className="w-3.5 h-3.5" />
                          </button>
                          <button onClick={() => setEditId(null)}
                            className="p-1.5 rounded-lg bg-[#c5d3f0]/20 text-[#4a5a8a] hover:bg-[#c5d3f0]/40 transition-colors">
                            <X className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      ) : (
                        <motion.div key="view" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="flex items-center gap-2">
                          <span className="text-sm text-[#4a5a8a]">{g.current} / {g.target} {g.unit}</span>
                          <button onClick={() => { setEditId(g.id); setEditVal(String(g.target)); }}
                            className="p-1.5 rounded-lg opacity-100 md:opacity-0 md:group-hover:opacity-100 hover:bg-[#6b8dd6]/10 text-[#4a5a8a] hover:text-[#6b8dd6] transition-all">
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                  <div className="h-2.5 bg-[#c5d3f0]/25 rounded-full overflow-hidden">
                    <motion.div initial={{ width: 0 }} animate={{ width: `${Math.min(g.percent, 100)}%` }}
                      transition={{ duration: 1, ease: 'easeOut' }}
                      className="h-full rounded-full" style={{ backgroundColor: color }} />
                  </div>
                  <p className="text-xs mt-1 font-medium" style={{ color: g.percent >= 100 ? '#4ade80' : color }}>
                    {g.percent}%{g.percent >= 100 ? ' ✓ Цель достигнута' : ''}
                  </p>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>
    </div>
  );
}
