'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ArrowRight, CheckCircle, RefreshCw, Loader2, WifiOff } from '@/components/icons';
import type { AIRecommendation } from '@/lib/types';

const categoryLabels: Record<string, string> = {
  sleep:      'Сон',
  activity:   'Активность',
  nutrition:  'Питание',
  hydration:  'Гидратация',
  general:    'Общее',
};

const priorityLabel: Record<string, string> = {
  high:   'Важно',
  medium: 'Средний',
  low:    'Низкий',
};

const priorityColor: Record<string, string> = {
  high:   'bg-red-500/15 text-red-500',
  medium: 'bg-blue-500/15 text-blue-500',
  low:    'bg-gray-500/15 text-gray-500',
};

const categoryIcon: Record<string, string> = {
  sleep:     '😴',
  activity:  '🏃',
  nutrition: '🥗',
  hydration: '💧',
  general:   '💡',
};

export default function RecommendationsPage() {
  const [recs, setRecs]           = useState<AIRecommendation[]>([]);
  const [loading, setLoading]     = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [generatedAt, setGeneratedAt] = useState('');
  const [model, setModel]         = useState('');
  const [error, setError]         = useState('');

  const load = useCallback(async (force = false) => {
    if (force) setRefreshing(true);
    else setLoading(true);
    setError('');

    try {
      const res = await fetch('/api/recommendations', { cache: 'no-store' });
      if (!res.ok) throw new Error('Ошибка сервера');
      const data = await res.json();
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

  return (
    <div className="space-y-8">
      {/* Заголовок */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4"
      >
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 bg-gradient-to-br from-[#6b8dd6] to-[#93b4e8]
                            rounded-xl flex items-center justify-center">
              <Sparkles className="w-5 h-5 text-white" />
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-[#1a1e5e]">AI Рекомендации</h1>
          </div>
          <p className="text-[#4a5a8a]">Персонализированные советы на основе ваших данных</p>
          {generatedAt && !loading && (
            <p className="text-xs text-[#4a5a8a]/60 mt-1 flex items-center gap-2 flex-wrap">
              Обновлено: {new Date(generatedAt).toLocaleString('ru-RU')}
              {model && model !== 'static-fallback' && model !== 'fallback' ? (
                <span className="px-2 py-0.5 bg-[#6b8dd6]/15 text-[#6b8dd6] rounded-full text-xs font-medium">
                  Groq · {model}
                </span>
              ) : (
                <span className="px-2 py-0.5 bg-yellow-500/15 text-yellow-600 rounded-full text-xs font-medium">
                  Статические данные — добавьте GROQ_API_KEY
                </span>
              )}
            </p>
          )}
        </div>

        <motion.button
          onClick={() => load(true)}
          disabled={loading || refreshing}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          className="flex items-center gap-2 px-4 py-2.5 bg-[#6b8dd6]/15
                     hover:bg-[#6b8dd6]/25 text-[#6b8dd6] rounded-xl text-sm
                     font-medium transition-colors disabled:opacity-50 flex-shrink-0"
        >
          {refreshing
            ? <Loader2 className="w-4 h-4 animate-spin" />
            : <RefreshCw className="w-4 h-4" />
          }
          {refreshing ? 'Загрузка...' : 'Обновить'}
        </motion.button>
      </motion.div>

      {/* Ошибка */}
      <AnimatePresence>
        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/20
                       rounded-2xl text-red-500 text-sm"
          >
            <WifiOff className="w-5 h-5 flex-shrink-0" />
            {error}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Скелетон загрузки */}
      {loading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 shadow-lg animate-pulse">
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 bg-[#6b8dd6]/20 rounded-xl flex-shrink-0" />
                <div className="flex-1 space-y-3">
                  <div className="h-5 bg-[#6b8dd6]/20 rounded-lg w-2/3" />
                  <div className="h-4 bg-[#6b8dd6]/10 rounded-lg w-full" />
                  <div className="h-4 bg-[#6b8dd6]/10 rounded-lg w-4/5" />
                </div>
              </div>
            </div>
          ))}
          <p className="text-center text-[#4a5a8a] text-sm pt-2 flex items-center justify-center gap-2">
            <Loader2 className="w-4 h-4 animate-spin" />
            AI анализирует ваши данные...
          </p>
        </div>
      ) : (
        <>
          {/* Карточки рекомендаций */}
          <div className="space-y-4">
            {recs.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ duration: 0.4, delay: index * 0.1 }}
                className="bg-white rounded-2xl p-6 shadow-lg border border-transparent
                           hover:border-[#6b8dd6]/30 transition-all cursor-pointer"
              >
                <div className="flex items-start gap-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#6b8dd6]/20 to-[#93b4e8]/20
                                  rounded-xl flex items-center justify-center flex-shrink-0 text-2xl">
                    {categoryIcon[item.category] ?? '💡'}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-2">
                      <h3 className="text-base sm:text-lg font-semibold text-[#1a1e5e]">{item.title}</h3>
                      <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
                        <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${priorityColor[item.priority]}`}>
                          {priorityLabel[item.priority]}
                        </span>
                        <span className="px-2.5 py-1 rounded-full text-xs font-medium
                                         bg-[#6b8dd6]/15 text-[#6b8dd6]">
                          {categoryLabels[item.category] ?? item.category}
                        </span>
                      </div>
                    </div>

                    <p className="text-[#4a5a8a] leading-relaxed mb-4">{item.description}</p>

                    {item.actionable ? (
                      <motion.button
                        whileHover={{ x: 4 }}
                        className="flex items-center gap-2 px-4 py-2 bg-[#6b8dd6]/10
                                   hover:bg-[#6b8dd6]/20 text-[#6b8dd6] rounded-lg text-sm
                                   font-medium transition-colors"
                      >
                        <span>Применить</span>
                        <ArrowRight className="w-4 h-4" />
                      </motion.button>
                    ) : (
                      <div className="flex items-center gap-2 text-[#4ade80] text-sm">
                        <CheckCircle className="w-4 h-4" />
                        <span>Выполняется</span>
                      </div>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Инфо-блок */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="bg-gradient-to-br from-[#eef2ff] to-[#f5f8ff]
                       rounded-2xl p-6 border border-[#1a1e5e]/20"
          >
            <p className="text-sm text-[#4a5a8a] text-center">
              💡 Рекомендации генерируются с помощью Groq AI (Llama 3.3 70B) на основе ваших показателей за последние 7 дней.
              Нажмите «Обновить» чтобы получить новый анализ.
            </p>
          </motion.div>
        </>
      )}
    </div>
  );
}
