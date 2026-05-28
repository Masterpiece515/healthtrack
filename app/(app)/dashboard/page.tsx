'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Zap, TrendingUp, Heart, Footprints, Moon, Weight,
  RefreshCw, Sparkles,
} from '@/components/icons';

import { HealthScore }     from '@/components/dashboard/HealthScore';
import { StatCard }        from '@/components/dashboard/StatCard';
import { Chart }           from '@/components/dashboard/Chart';
import { AddMetricForm }   from '@/components/dashboard/AddMetricForm';
import { useToast }        from '@/lib/toast-context';
import { computeWeekTrends } from '@/lib/dashboard-week-trends';

import type {
  HealthListResponse,
  RecommendationsResponse,
  AIRecommendation,
} from '@/lib/types';

// ── Статические fallback-данные на время загрузки ─────────────────────────────
const STAT_DEFAULTS = [
  { title: 'Шаги',  value: '—',   unit: undefined, icon: Footprints, color: '#6b8dd6', delay: 0.1 },
  { title: 'Сон',   value: '—',   unit: 'ч',       icon: Moon,       color: '#93b4e8', delay: 0.2 },
  { title: 'Пульс', value: '—',   unit: 'уд/мин',  icon: Heart,      color: '#4a5a8a', delay: 0.3 },
  { title: 'Вес',   value: '—',   unit: 'кг',      icon: Weight,     color: '#a78bfa', delay: 0.4 },
];

const PRIORITY_STYLES: Record<AIRecommendation['priority'], {
  border: string; dot: string; icon: string;
}> = {
  high:   { border: 'border-red-500/30',  dot: 'bg-red-500',  icon: 'text-red-500'  },
  medium: { border: 'border-blue-500/30', dot: 'bg-blue-500', icon: 'text-blue-500' },
  low:    { border: 'border-gray-500/30', dot: 'bg-gray-400', icon: 'text-gray-400' },
};

export default function DashboardPage() {
  const { data: session } = useSession();
  const { toast } = useToast();

  // ── Состояние ─────────────────────────────────────────────────────────────
  const [healthData, setHealthData]  = useState<HealthListResponse | null>(null);
  const [aiData, setAiData]          = useState<RecommendationsResponse | null>(null);
  const [loadingHealth, setLoadingHealth]   = useState(true);
  const [loadingAI, setLoadingAI]           = useState(false);
  const [refreshingAI, setRefreshingAI]     = useState(false);
  const [healthScore, setHealthScore]       = useState(0);

  const userName = (session?.user as { name?: string })?.name ?? 'Пользователь';

  // ── Загрузка показателей здоровья ─────────────────────────────────────────
  const fetchHealth = useCallback(async () => {
    setLoadingHealth(true);
    try {
      const res  = await fetch('/api/health');
      const data: HealthListResponse = await res.json();
      setHealthData(data);
      setHealthScore(data.summary.healthScore);
    } catch (e) {
      console.error('fetchHealth error:', e);
    } finally {
      setLoadingHealth(false);
    }
  }, []);

  // ── Загрузка AI-рекомендаций ──────────────────────────────────────────────
  const fetchAI = useCallback(async (showLoader = true) => {
    if (showLoader) setLoadingAI(true);
    else setRefreshingAI(true);
    try {
      const res  = await fetch('/api/recommendations');
      const data: RecommendationsResponse = await res.json();
      setAiData(data);
    } catch (e) {
      console.error('fetchAI error:', e);
    } finally {
      setLoadingAI(false);
      setRefreshingAI(false);
    }
  }, []);

  useEffect(() => {
    fetchHealth();
    fetchAI();
  }, [fetchHealth, fetchAI]);

  // ── Построение карточек метрик из API-данных ──────────────────────────────
  const summary      = healthData?.summary;
  const hasFitbit = healthData?.hasFitbit ?? false;
  const weekTrends   = useMemo(
    () => computeWeekTrends(healthData?.entries ?? []),
    [healthData?.entries],
  );

  const allStatCards = [
    { title: 'Шаги',  value: summary ? summary.avgSteps.toLocaleString('ru-RU') : '—', unit: undefined, icon: Footprints, trend: weekTrends.steps,   progress: summary ? Math.round((summary.avgSteps / 10000) * 100) : undefined, color: '#6b8dd6', delay: 0.1, always: true },
    { title: 'Сон',   value: summary ? String(summary.avgSleep) : '—',                 unit: 'ч',       icon: Moon,       trend: weekTrends.sleep,   progress: summary ? Math.round((summary.avgSleep / 8) * 100) : undefined,         color: '#93b4e8', delay: 0.2, always: true },
    { title: 'Пульс', value: summary ? String(summary.avgHeartRate) : '—',             unit: 'уд/мин',  icon: Heart,      trend: weekTrends.heartRate, progress: undefined,                                                              color: '#4a5a8a', delay: 0.3, always: false },
    { title: 'Вес',   value: summary ? String(summary.latestWeight) : '—',             unit: 'кг',      icon: Weight,     trend: weekTrends.weight,  progress: undefined,                                                              color: '#a78bfa', delay: 0.4, always: true },
  ];

  const statCards = allStatCards.filter(c => c.always || hasFitbit);
  const cards = summary ? statCards : STAT_DEFAULTS.filter(c => c.title !== 'Пульс' || hasFitbit);

  // ── Вызывается после успешного сохранения новой записи ────────────────────
  const handleEntryAdded = (newScore: number) => {
    setHealthScore(newScore);
    fetchHealth();
    fetchAI(false);
    toast('Запись добавлена', 'success');
  };

  // ── Скелетон ──────────────────────────────────────────────────────────────
  if (loadingHealth) {
    return (
      <div className="space-y-8 animate-pulse">
        <div className="h-12 w-72 bg-white rounded-xl" />
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white rounded-3xl h-[460px]" />
          <div className="lg:col-span-2 space-y-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {[...Array(4)].map((_, i) => <div key={i} className="bg-white rounded-2xl h-40" />)}
            </div>
            <div className="bg-white rounded-3xl h-[380px]" />
          </div>
        </div>
        <div className="bg-white rounded-3xl h-48" />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* ── Заголовок ── */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-[#1a1e5e] mb-1">
              Добро пожаловать, {userName}! 👋
            </h1>
            <p className="text-[#4a5a8a] text-sm sm:text-base">
              {new Date().toLocaleDateString('ru-RU', {
                weekday: 'long', day: 'numeric',
                month: 'long',  year: 'numeric',
              })}
            </p>
          </div>

          {/* Кнопки действий */}
          <div className="flex items-center gap-2 sm:gap-3 flex-wrap">
            <AddMetricForm onSuccess={handleEntryAdded} />

            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => { fetchHealth(); fetchAI(false); }}
              className="flex items-center gap-2 px-4 py-2.5
                         bg-[#f5f8ff] hover:bg-[#eef2ff]
                         text-[#1a1e5e] text-sm font-medium rounded-xl
                         border border-[#c5d3f0]/30 transition-colors"
            >
              <Zap className="w-4 h-4" />
              <span className="hidden sm:inline">Синхронизировать</span>
            </motion.button>
          </div>
        </div>
      </motion.div>

      {/* ── Индекс здоровья + карточки + график ── */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Health Score */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6 }}
          className="lg:col-span-1"
        >
          <div className="bg-gradient-to-br from-white to-[#f5f8ff] rounded-3xl p-5 sm:p-8
                          shadow-xl border border-[#6b8dd6]/10 relative overflow-hidden h-full">
            <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br
                            from-[#6b8dd6]/10 to-transparent rounded-full blur-3xl" />
            <div className="relative z-10">
              <HealthScore
                score={healthScore}
                trend={weekTrends.healthScore}
                delay={0.2}
                avgSteps={summary?.avgSteps}
                avgSleep={summary?.avgSleep}
                avgHeartRate={hasFitbit ? summary?.avgHeartRate : undefined}
              />
            </div>

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 1.2 }}
              className="mt-5 sm:mt-8 grid grid-cols-2 gap-3 relative z-10"
            >
              <button className="px-4 py-3 bg-[#6b8dd6]/10 hover:bg-[#6b8dd6]/20
                                 rounded-xl text-sm font-medium text-[#6b8dd6] transition-all">
                Подробнее
              </button>
              <button className="px-4 py-3 bg-[#c5d3f0]/20 hover:bg-[#c5d3f0]/30
                                 rounded-xl text-sm font-medium text-[#1a1e5e] transition-all">
                История
              </button>
            </motion.div>
          </div>
        </motion.div>

        {/* Карточки + График */}
        <div className="lg:col-span-2 space-y-6">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
            {cards.map((card) => (
              <StatCard key={card.title} {...card} />
            ))}
          </div>
          <Chart entries={healthData?.entries ?? []} />
        </div>
      </div>

      {/* ── AI Рекомендации ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        transition={{ duration: 0.5, delay: 0.6 }}
        className="bg-white rounded-3xl p-5 sm:p-8 shadow-sm border border-[#6b8dd6]/10"
      >
        {/* Фоновое свечение */}


        {/* Заголовок блока */}
        <div className="relative z-10 flex flex-wrap items-center justify-between gap-3 mb-6">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 bg-gradient-to-br from-[#6b8dd6] to-[#93b4e8]
                         rounded-xl flex items-center justify-center shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-bold text-[#1a1e5e]">AI Рекомендации</h3>
              <p className="text-sm text-white/60">
                {aiData?.model === 'static-fallback'
                  ? 'Стандартные советы'
                  : `Сгенерировано ${aiData?.model ?? '...'}`}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Кнопка обновления */}
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => fetchAI(false)}
              disabled={refreshingAI || loadingAI}
              className="p-2 rounded-xl bg-[#eef2ff] hover:bg-[#c5d3f0] text-[#6b8dd6] transition-colors disabled:opacity-50"
              title="Обновить рекомендации"
            >
              <RefreshCw className={`w-4 h-4 ${refreshingAI ? 'animate-spin' : ''}`} />
            </motion.button>

            <motion.div
              animate={{ scale: [1, 1.08, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              className="px-3 py-1 bg-[#6b8dd6] rounded-full"
            >
              <span className="text-xs text-white font-medium">Live</span>
            </motion.div>
          </div>
        </div>

        {/* Список рекомендаций */}
        <div className="relative z-10 space-y-3">
          <AnimatePresence mode="wait">
            {(loadingAI || !aiData) ? (
              // Скелетон рекомендаций
              <motion.div
                key="skeleton"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="bg-[#f5f8ff] rounded-xl p-4 animate-pulse">
                    <div className="h-4 w-40 bg-[#c5d3f0] rounded mb-2" />
                    <div className="h-3 w-full bg-[#eef2ff] rounded" />
                  </div>
                ))}
              </motion.div>
            ) : (
              <motion.div
                key="recs"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="space-y-3"
              >
                {aiData.recommendations.map((item, index) => {
                  const styles = PRIORITY_STYLES[item.priority];
                  return (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ duration: 0.4, delay: index * 0.1 }}
                      className={`bg-[#f5f8ff] rounded-xl p-4 border ${styles.border} cursor-pointer`}
                    >
                      <div className="flex items-start gap-3">
                        <div className={`w-2 h-2 rounded-full ${styles.dot} mt-1.5 flex-shrink-0`} />
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <h4 className="text-[#1a1e5e] font-semibold">{item.title}</h4>
                            <span className={`text-xs px-2 py-0.5 rounded-full bg-[#eef2ff] ${styles.icon}`}>
                              {item.category}
                            </span>
                          </div>
                          <p className="text-sm text-[#4a5a8a] leading-relaxed">
                            {item.description}
                          </p>
                          {item.actionable && (
                            <button className="mt-2 text-xs text-[#6b8dd6]
                                               hover:text-[#93b4e8] transition-colors">
                              Применить →
                            </button>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="relative z-10 mt-6 pt-6 border-t border-[#6b8dd6]/10">
          <p className="text-xs text-[#4a5a8a] text-center">
            {aiData
              ? `Обновлено: ${new Date(aiData.generatedAt).toLocaleTimeString('ru-RU')} • На основе ${healthData?.entries.length ?? 0} записей`
              : 'Загрузка...'}
          </p>
        </div>
      </motion.div>

      {/* ── Нижние 3 блока ── */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {[
          { label: 'Записей',         value: healthData?.entries.length ?? 0, sub: 'В вашем журнале',   icon: TrendingUp, gradient: 'from-green-500/10 to-emerald-500/5', border: 'border-green-500/20', iconBg: 'bg-green-500/20', iconColor: 'text-green-500',  delay: 0.7 },
          { label: 'Индекс здоровья', value: `${healthScore}/100`,            sub: 'На основе 7 дней', icon: Zap,         gradient: 'from-blue-500/10 to-cyan-500/5',    border: 'border-blue-500/20',  iconBg: 'bg-blue-500/20',  iconColor: 'text-blue-500',   delay: 0.8 },
          { label: 'Средние шаги',    value: summary?.avgSteps.toLocaleString('ru-RU') ?? '—', sub: 'За неделю', icon: Heart, gradient: 'from-purple-500/10 to-pink-500/5',  border: 'border-purple-500/20', iconBg: 'bg-purple-500/20', iconColor: 'text-purple-500', delay: 0.9 },
        ].map((stat) => {
          const Icon = stat.icon;
          return (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.5, delay: stat.delay }}
              className={`bg-gradient-to-br ${stat.gradient} rounded-2xl p-4 sm:p-6 border ${stat.border}`}
            >
              <div className="flex items-start justify-between mb-4">
                <div>
                  <p className="text-sm text-[#4a5a8a] mb-1">{stat.label}</p>
                  <p className="text-2xl sm:text-3xl font-bold text-[#1a1e5e]">{stat.value}</p>
                </div>
                <div className={`w-12 h-12 ${stat.iconBg} rounded-xl flex items-center justify-center`}>
                  <Icon className={`w-6 h-6 ${stat.iconColor}`} />
                </div>
              </div>
              <p className="text-sm text-[#4a5a8a]">{stat.sub}</p>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
