'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  ArrowLeft, User, Mail, Calendar, ShieldCheck, Activity,
  Footprints, Moon, Heart, Weight, Target,
} from '@/components/icons';
import Link from 'next/link';

interface HealthEntry {
  id: string; date: string; steps: number;
  sleepHours: number; heartRate: number; weight: number; calories: number | null;
}
interface Goal { id: string; metric: string; target: number; unit: string }
interface UserDetail {
  user: { id: string; name: string; email: string; role: string; createdAt: string };
  entries: HealthEntry[];
  goals: Goal[];
  avgs: { steps: number; sleep: number; heartRate: number; weight: number };
}

function StatBadge({ icon: Icon, label, value, unit, color }: {
  icon: typeof Heart; label: string; value: number; unit: string; color: string;
}) {
  return (
    <div className="bg-white/5 border border-white/10 rounded-xl p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0" style={{ background: `${color}25` }}>
        <Icon className="w-5 h-5" style={{ color }} />
      </div>
      <div>
        <p className="text-white/40 text-xs">{label}</p>
        <p className="text-white font-bold">{value} <span className="text-white/40 text-sm font-normal">{unit}</span></p>
      </div>
    </div>
  );
}

export default function AdminUserDetailPage() {
  const { id } = useParams<{ id: string }>();
  const router = useRouter();
  const [data, setData]       = useState<UserDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/admin/users/${id}`)
      .then(r => r.json())
      .then(d => { if (d.error) setError(d.error); else setData(d); })
      .catch(() => setError('Ошибка загрузки'))
      .finally(() => setLoading(false));
  }, [id]);

  if (loading) return (
    <div className="flex justify-center items-center h-64">
      <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="space-y-4">
      <button onClick={() => router.back()} className="flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> Назад
      </button>
      <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4">{error}</div>
    </div>
  );

  if (!data) return null;
  const { user, entries, goals, avgs } = data;

  return (
    <div className="space-y-6">
      {/* Назад */}
      <Link href="/admin/users" className="inline-flex items-center gap-2 text-white/50 hover:text-white text-sm transition-colors">
        <ArrowLeft className="w-4 h-4" /> К списку пользователей
      </Link>

      {/* Профиль */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="bg-white/5 border border-white/10 rounded-2xl p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center gap-5">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#6b8dd6] to-[#93b4e8] flex items-center justify-center flex-shrink-0 shadow-lg">
              <span className="text-white text-2xl font-bold">{user.name.charAt(0).toUpperCase()}</span>
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-xl font-bold text-white">{user.name}</h1>
                {user.role === 'admin' && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-amber-500/20 text-amber-300 border border-amber-500/30">
                    <ShieldCheck className="w-3 h-3" /> Админ
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-4 text-sm text-white/50">
                <span className="flex items-center gap-1.5"><Mail className="w-4 h-4" />{user.email}</span>
                <span className="flex items-center gap-1.5"><Calendar className="w-4 h-4" />
                  Зарегистрирован {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                </span>
                <span className="flex items-center gap-1.5"><Activity className="w-4 h-4" />{entries.length} записей</span>
              </div>
            </div>
            <Link
              href={`/admin/users`}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-white/70 hover:text-white hover:bg-white/10 transition-colors text-sm"
            >
              <User className="w-4 h-4" /> Изменить роль
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Средние значения */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.05 }}>
        <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">Средние показатели</h2>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          <StatBadge icon={Footprints} label="Шаги"  value={avgs.steps}     unit="шаг" color="#6b8dd6" />
          <StatBadge icon={Moon}       label="Сон"   value={avgs.sleep}     unit="ч"   color="#93b4e8" />
          <StatBadge icon={Heart}      label="Пульс" value={avgs.heartRate} unit="уд"  color="#f87171" />
          <StatBadge icon={Weight}     label="Вес"   value={avgs.weight}    unit="кг"  color="#34d399" />
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-3 gap-5">
        {/* Записи здоровья */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }} className="xl:col-span-2">
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
              <Activity className="w-4 h-4 text-amber-400" />
              <h2 className="text-white font-semibold text-sm">Последние записи здоровья</h2>
            </div>
            {entries.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-10">Нет записей</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-white/5">
                      {['Дата','Шаги','Сон','Пульс','Вес','Калории'].map(h => (
                        <th key={h} className="text-left text-white/40 font-medium px-4 py-3 whitespace-nowrap">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {entries.map(e => (
                      <tr key={e.id} className="border-b border-white/5 hover:bg-white/5 transition-colors">
                        <td className="px-4 py-3 text-white/70">{new Date(e.date).toLocaleDateString('ru-RU')}</td>
                        <td className="px-4 py-3 text-white">{e.steps.toLocaleString('ru')}</td>
                        <td className="px-4 py-3 text-white">{e.sleepHours} ч</td>
                        <td className="px-4 py-3 text-white">{e.heartRate}</td>
                        <td className="px-4 py-3 text-white">{e.weight} кг</td>
                        <td className="px-4 py-3 text-white/60">{e.calories ?? '—'}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </motion.div>

        {/* Цели */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.15 }}>
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-white/5 flex items-center gap-2">
              <Target className="w-4 h-4 text-amber-400" />
              <h2 className="text-white font-semibold text-sm">Цели</h2>
            </div>
            {goals.length === 0 ? (
              <p className="text-white/30 text-sm text-center py-10">Нет целей</p>
            ) : (
              <div className="p-4 space-y-3">
                {goals.map(g => (
                  <div key={g.id} className="flex items-center justify-between py-2 border-b border-white/5 last:border-0">
                    <span className="text-white/60 text-sm capitalize">{g.metric}</span>
                    <span className="text-white font-semibold text-sm">{g.target} {g.unit}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
