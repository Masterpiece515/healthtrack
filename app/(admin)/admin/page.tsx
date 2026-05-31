'use client';

import { useEffect, useState } from 'react';
import { Users, Activity, UserCheck, UserPlus, ShieldCheck, TrendingUp, BarChart3, ArrowRight } from '@/components/icons';
import { motion } from 'framer-motion';
import Link from 'next/link';

interface Stats {
  totalUsers: number; totalEntries: number; newToday: number;
  newThisWeek: number; activeUsers: number; adminCount: number;
}
interface TopUser {
  id: string; name: string; email: string; entriesCount: number; lastEntry: string | null;
}
interface AnalyticsPreview { topUsers: TopUser[] }

function StatCard({ title, value, icon: Icon, color, delay = 0, href }: {
  title: string; value: number | undefined; icon: React.ElementType;
  color: string; delay?: number; href?: string;
}) {
  const inner = (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className={`bg-white/5 border border-white/10 rounded-2xl p-5 flex items-center gap-4 ${href ? 'hover:bg-white/8 hover:border-white/20 transition-all cursor-pointer' : ''}`}
    >
      <div className={`w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0 ${color}`}>
        <Icon className="w-6 h-6 text-white" />
      </div>
      <div>
        <p className="text-white/50 text-sm">{title}</p>
        <p className="text-3xl font-bold text-white mt-0.5">
          {value === undefined ? '—' : value.toLocaleString('ru')}
        </p>
      </div>
    </motion.div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

export default function AdminDashboardPage() {
  const [stats, setStats]       = useState<Stats | null>(null);
  const [preview, setPreview]   = useState<AnalyticsPreview | null>(null);
  const [error, setError]       = useState<string | null>(null);

  useEffect(() => {
    fetch('/api/admin/stats')
      .then(r => r.json()).then(d => { if (d.error) setError(d.error); else setStats(d); });
    fetch('/api/admin/analytics')
      .then(r => r.json()).then(d => { if (!d.error) setPreview(d); });
  }, []);

  return (
    <div className="space-y-7">
      {/* Заголовок */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center justify-between">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <ShieldCheck className="w-7 h-7 text-amber-400" />
              <h1 className="text-2xl font-bold text-white">Панель администратора</h1>
            </div>
            <p className="text-white/40 text-sm">Обзор системы и ключевые метрики</p>
          </div>
          <Link
            href="/admin/analytics"
            className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/30 rounded-xl text-amber-300 hover:bg-amber-500/20 transition-colors text-sm font-medium"
          >
            <BarChart3 className="w-4 h-4" />
            <span className="hidden sm:inline">Подробная</span> аналитика
          </Link>
        </div>
      </motion.div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4">{error}</div>
      )}

      {/* Карточки */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StatCard title="Всего пользователей"       value={stats?.totalUsers}   icon={Users}      color="bg-blue-500/30"    delay={0.05} href="/admin/users" />
        <StatCard title="Записей о здоровье"         value={stats?.totalEntries} icon={Activity}   color="bg-emerald-500/30" delay={0.1} />
        <StatCard title="Активных за 7 дней"         value={stats?.activeUsers}  icon={TrendingUp}  color="bg-purple-500/30"  delay={0.15} />
        <StatCard title="Новых сегодня"              value={stats?.newToday}     icon={UserPlus}   color="bg-orange-500/30"  delay={0.2} />
        <StatCard title="Новых за неделю"            value={stats?.newThisWeek}  icon={UserCheck}  color="bg-teal-500/30"    delay={0.25} />
        <StatCard title="Администраторов"            value={stats?.adminCount}   icon={ShieldCheck} color="bg-amber-500/30"   delay={0.3} />
      </div>

      {/* Быстрые действия */}
      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}>
        <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider mb-3">Быстрые действия</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <Link href="/admin/users">
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/8 hover:border-white/20 transition-all cursor-pointer group">
              <div className="flex items-center gap-3">
                <Users className="w-5 h-5 text-[#93b4e8]" />
                <div>
                  <p className="text-white font-medium text-sm">Управление пользователями</p>
                  <p className="text-white/40 text-xs">Роли, удаление, поиск</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white/70 transition-colors" />
            </div>
          </Link>
          <Link href="/admin/analytics">
            <div className="flex items-center justify-between p-4 bg-white/5 border border-white/10 rounded-2xl hover:bg-white/8 hover:border-white/20 transition-all cursor-pointer group">
              <div className="flex items-center gap-3">
                <BarChart3 className="w-5 h-5 text-[#6b8dd6]" />
                <div>
                  <p className="text-white font-medium text-sm">Аналитика системы</p>
                  <p className="text-white/40 text-xs">Графики, тренды, показатели</p>
                </div>
              </div>
              <ArrowRight className="w-4 h-4 text-white/30 group-hover:text-white/70 transition-colors" />
            </div>
          </Link>
        </div>
      </motion.div>

      {/* Самые активные пользователи */}
      {preview && preview.topUsers.length > 0 && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-white/60 text-xs font-semibold uppercase tracking-wider">Самые активные пользователи</h2>
            <Link href="/admin/analytics" className="text-amber-400 text-xs hover:text-amber-300 transition-colors">
              Все →
            </Link>
          </div>
          <div className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden">
            {preview.topUsers.slice(0, 5).map((u, i) => (
              <Link key={u.id} href={`/admin/users/${u.id}`}>
                <div className="flex items-center gap-3 px-5 py-3.5 border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <span className="text-white/30 text-xs w-4">{i + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-[#6b8dd6] to-[#93b4e8] flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-xs font-bold">{u.name.charAt(0).toUpperCase()}</span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-white text-sm font-medium truncate">{u.name}</p>
                    <p className="text-white/40 text-xs truncate">{u.email}</p>
                  </div>
                  <div className="text-right">
                    <span className="text-amber-400 font-bold text-sm">{u.entriesCount}</span>
                    <span className="text-white/30 text-xs ml-1">записей</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </motion.div>
      )}

      {/* Подсказка */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}>
        <div className="bg-amber-500/5 border border-amber-500/20 rounded-2xl p-5">
          <p className="text-amber-300/80 text-sm leading-relaxed">
            <span className="font-semibold text-amber-300">Совет:</span>{' '}
            Нажмите на пользователя в таблице, чтобы увидеть его данные о здоровье и цели.
            В разделе <span className="text-white/70 font-medium">Аналитика</span> доступны подробные графики за 30 дней.
          </p>
        </div>
      </motion.div>
    </div>
  );
}
