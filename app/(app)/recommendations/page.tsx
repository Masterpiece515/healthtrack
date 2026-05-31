'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Sparkles, CheckCircle2, RefreshCw, Loader2, WifiOff,
  Moon, Footprints, Weight, Heart, Lightbulb, Activity, ClipboardList,
} from '@/components/icons';
import type { AIRecommendation } from '@/lib/types';
import Link from 'next/link';

// ── Метаданные категорий ──────────────────────────────────────────────────────
const CATEGORY_META: Record<string, {
  label: string; icon: React.ElementType; color: string; bg: string;
}> = {
  sleep:     { label: 'Сон',        icon: Moon,       color: '#6366f1', bg: '#eef2ff' },
  activity:  { label: 'Активность', icon: Footprints,  color: '#6b8dd6', bg: '#eff6ff' },
  nutrition: { label: 'Питание',    icon: Weight,      color: '#10b981', bg: '#ecfdf5' },
  hydration: { label: 'Гидратация', icon: Heart,       color: '#0ea5e9', bg: '#f0f9ff' },
  general:   { label: 'Общее',      icon: Lightbulb,   color: '#f59e0b', bg: '#fffbeb' },
};

// ── Метаданные приоритетов ────────────────────────────────────────────────────
const PRIORITY_META: Record<string, {
  label: string; color: string; bg: string; border: string;
}> = {
  high:   { label: 'Важно',   color: '#ef4444', bg: '#fef2f2', border: '#fca5a5' },
  medium: { label: 'Средний', color: '#6b8dd6', bg: '#eff6ff', border: '#93c5fd' },
  low:    { label: 'Низкий',  color: '#6b7280', bg: '#f9fafb', border: '#d1d5db' },
};

// ── Карточка рекомендации ─────────────────────────────────────────────────────
function RecCard({ item, index }: { item: AIRecommendation; index: number }) {
  const [done, setDone] = useState(false);

  const cat  = CATEGORY_META[item.category]  ?? CATEGORY_META.general;
  const pri  = PRIORITY_META[item.priority]  ?? PRIORITY_META.low;
  const Icon = cat.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: done ? 0.55 : 1, y: 0 }}
      transition={{ duration: 0.35, delay: index * 0.08 }}
      className={`bg-white rounded-2xl p-5 sm:p-6 border transition-all ${
        done
          ? 'border-green-200 bg-green-50/30'
          : 'border-[#e8eef8] hover:border-[#6b8dd6]/40 hover:shadow-md'
      }`}
      style={{ borderLeftWidth: 4, borderLeftColor: done ? '#4ade80' : pri.color }}
    >
      <div className="flex items-start gap-4">

        {/* Иконка категории */}
        <div className="w-11 h-11 rounded-xl flex items-center justify-center flex-shrink-0"
             style={{ background: done ? '#dcfce7' : cat.bg }}>
          <Icon className="w-5 h-5" style={{ color: done ? '#16a34a' : cat.color }} />
        </div>

        <div className="flex-1 min-w-0">
          {/* Заголовок + бейджи */}
          <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-2 mb-2">
            <h3 className={`font-semibold text-base leading-snug ${done ? 'line-through text-[#9ca3af]' : 'text-[#1a1e5e]'}`}>
              {item.title}
            </h3>
            <div className="flex items-center gap-1.5 flex-shrink-0 flex-wrap">
              <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold"
                    style={{ background: pri.bg, color: pri.color, border: `1px solid ${pri.border}` }}>
                {pri.label}
              </span>
              <span className="px-2.5 py-0.5 rounded-full text-xs font-medium"
                    style={{ background: cat.bg, color: cat.color }}>
                {cat.label}
              </span>
            </div>
          </div>

          {/* Описание */}
          <p className={`text-sm leading-relaxed mb-4 ${done ? 'text-[#9ca3af]' : 'text-[#4a5a8a]'}`}>
            {item.description}
          </p>

          {/* Кнопка «Выполнено» */}
          <button
            onClick={() => setDone(v => !v)}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold
                        border transition-all ${
              done
                ? 'bg-green-50 border-green-200 text-green-600 hover:bg-green-100'
                : 'bg-white border-[#e8eef8] text-[#4a5a8a] hover:border-[#6b8dd6]/40 hover:text-[#6b8dd6]'
            }`}
          >
            <CheckCircle2 className={`w-3.5 h-3.5 ${done ? 'text-green-500' : 'text-[#c5d3f0]'}`} />
            {done ? 'Выполнено' : 'Отметить выполненным'}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ── Страница ──────────────────────────────────────────────────────────────────
export default function RecommendationsPage() {
  const [recs,        setRecs]        = useState<AIRecommendation[]>([]);
  const [loading,     setLoading]     = useState(true);
  const [refreshing,  setRefreshing]  = useState(false);
  const [generatedAt, setGeneratedAt] = useState('');
  const [model,       setModel]       = useState('');
  const [error,       setError]       = useState('');
  const [noData,      setNoData]      = useState(false);

  const load = useCallback(async (force = false) => {
    if (force) setRefreshing(true); else setLoading(true);
    setError('');
    try {
      const res  = await fetch('/api/recommendations', { cache: 'no-store' });
      if (!res.ok) throw new Error();
      const data = await res.json();
      setNoData(data.noData ?? false);
      setRecs(data.recommendations ?? []);
      setGeneratedAt(data.generatedAt ?? '');
      setModel(data.model ?? '');
    } catch {
      setError('Не удалось загрузить рекомендации. Проверьте подключение.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Счётчик по приоритетам
  const highCount = recs.filter(r => r.priority === 'high').length;

  return (
    <div className="space-y-6">

      {/* ── Заголовок ── */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 bg-gradient-to-br from-[#6b8dd6] to-[#93b4e8]
                              rounded-xl flex items-center justify-center shadow-sm">
                <Sparkles className="w-5 h-5 text-white" />
              </div>
              <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1e5e]">AI Рекомендации</h1>
            </div>
            <p className="text-[#4a5a8a] text-sm">Персонализированные советы на основе ваших данных</p>
            {generatedAt && !loading && (
              <div className="flex items-center gap-2 flex-wrap mt-1.5">
                <p className="text-xs text-[#4a5a8a]/60">
                  Обновлено: {new Date(generatedAt).toLocaleString('ru-RU')}
                </p>
                {model && model !== 'static-fallback' && model !== 'fallback' ? (
                  <span className="px-2 py-0.5 bg-[#6b8dd6]/10 text-[#6b8dd6] rounded-full text-xs font-medium">
                    Groq AI
                  </span>
                ) : (
                  <span className="px-2 py-0.5 bg-amber-500/10 text-amber-600 rounded-full text-xs font-medium">
                    Статические советы
                  </span>
                )}
              </div>
            )}
          </div>

          <motion.button
            onClick={() => load(true)}
            disabled={loading || refreshing}
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#6b8dd6] hover:bg-[#5a7cc5]
                       text-white rounded-xl text-sm font-medium shadow-sm
                       transition-colors disabled:opacity-50 flex-shrink-0 self-start"
          >
            {refreshing
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <RefreshCw className="w-4 h-4" />}
            {refreshing ? 'Загрузка...' : 'Обновить'}
          </motion.button>
        </div>

        {/* Плашка важных рекомендаций */}
        {highCount > 0 && !loading && (
          <motion.div initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
            className="mt-4 flex items-center gap-3 px-4 py-3 bg-red-50 border border-red-200
                       rounded-xl text-sm text-red-600">
            <Activity className="w-4 h-4 flex-shrink-0" />
            <span>
              <span className="font-semibold">{highCount} важн{highCount === 1 ? 'ая' : 'ых'} рекомендаци{highCount === 1 ? 'я' : 'й'}</span>
              {' '}— обратите внимание в первую очередь
            </span>
          </motion.div>
        )}
      </motion.div>

      {/* ── Ошибка ── */}
      <AnimatePresence>
        {error && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="flex items-center gap-3 p-4 bg-red-50 border border-red-200
                       rounded-2xl text-red-500 text-sm">
            <WifiOff className="w-5 h-5 flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Нет данных ── */}
      {!loading && noData && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center text-center py-16 px-4"
        >
          <div className="w-20 h-20 bg-[#eef2ff] rounded-3xl flex items-center justify-center mb-6">
            <ClipboardList className="w-9 h-9 text-[#6b8dd6]" />
          </div>
          <h2 className="text-xl font-bold text-[#1a1e5e] mb-3">
            Ещё нет данных для анализа
          </h2>
          <p className="text-[#4a5a8a] text-sm leading-relaxed max-w-xs mb-8">
            Внеси хотя бы одну запись&nbsp;— шаги, сон, пульс или вес&nbsp;— и AI сразу сформирует
            персональные советы именно для тебя.
          </p>
          <div className="flex flex-col sm:flex-row gap-3">
            <Link href="/dashboard">
              <motion.div
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-5 py-3 bg-[#6b8dd6] hover:bg-[#5a7cc5]
                           text-white rounded-xl text-sm font-semibold shadow-sm transition-colors cursor-pointer"
              >
                <Activity className="w-4 h-4" />
                Внести данные
              </motion.div>
            </Link>
          </div>

          {/* Подсказка что именно вносить */}
          <div className="mt-10 grid grid-cols-2 sm:grid-cols-4 gap-3 w-full max-w-md">
            {[
              { icon: Footprints, label: 'Шаги',  color: '#6b8dd6', bg: '#eff6ff' },
              { icon: Moon,       label: 'Сон',   color: '#6366f1', bg: '#eef2ff' },
              { icon: Heart,      label: 'Пульс', color: '#0ea5e9', bg: '#f0f9ff' },
              { icon: Weight,     label: 'Вес',   color: '#10b981', bg: '#ecfdf5' },
            ].map(({ icon: Icon, label, color, bg }) => (
              <div key={label}
                   className="flex flex-col items-center gap-2 p-4 rounded-2xl border border-[#e8eef8]">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                     style={{ background: bg }}>
                  <Icon className="w-5 h-5" style={{ color }} />
                </div>
                <span className="text-xs text-[#4a5a8a] font-medium">{label}</span>
              </div>
            ))}
          </div>
        </motion.div>
      )}

      {/* ── Скелетон ── */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-[#e8eef8] animate-pulse"
                 style={{ borderLeftWidth: 4, borderLeftColor: '#e8eef8' }}>
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 bg-[#f0f4ff] rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-2.5">
                  <div className="h-4 bg-[#f0f4ff] rounded w-1/2" />
                  <div className="h-3 bg-[#f5f8ff] rounded w-full" />
                  <div className="h-3 bg-[#f5f8ff] rounded w-3/4" />
                </div>
              </div>
            </div>
          ))}
          <p className="text-center text-[#4a5a8a] text-sm flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            AI анализирует ваши данные…
          </p>
        </div>
      ) : !noData && (
        <div className="space-y-3">
          {recs.map((item, i) => (
            <RecCard key={item.id} item={item} index={i} />
          ))}

          {/* Подвал */}
          {recs.length > 0 && (
            <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.5 }}
              className="text-center text-xs text-[#4a5a8a]/60 pt-2">
              Рекомендации сгенерированы Groq AI на основе показателей за 7 дней.
              Нажмите «Обновить» для нового анализа.
            </motion.p>
          )}
        </div>
      )}
    </div>
  );
}
