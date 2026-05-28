'use client';

import { motion } from 'framer-motion';
import { Sparkles, ArrowRight, Lightbulb } from '@/components/icons';
import { recommendations } from '@/lib/mock-data';
import type { Recommendation } from '@/lib/mock-data';

// Стили в зависимости от приоритета
const priorityStyles: Record<Recommendation['priority'], {
  border: string;
  dot: string;
  icon: string;
}> = {
  high:   { border: 'border-red-500/30',  dot: 'bg-red-500',  icon: 'text-red-500'  },
  medium: { border: 'border-blue-500/30', dot: 'bg-blue-500', icon: 'text-blue-500' },
  low:    { border: 'border-gray-500/30', dot: 'bg-gray-400', icon: 'text-gray-400' },
};

export function Recommendations() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay: 0.6 }}
      className="bg-gradient-to-br from-[#1a1e5e] to-[#1a1e5e] rounded-3xl p-8
                 shadow-2xl relative overflow-hidden"
    >
      {/* Анимированный фоновый градиент */}
      <motion.div
        animate={{ opacity: [0.3, 0.5, 0.3], scale: [1, 1.2, 1] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        className="absolute top-0 right-0 w-96 h-96 bg-gradient-to-br
                   from-[#6b8dd6]/20 to-[#93b4e8]/20 rounded-full blur-3xl"
      />

      {/* Заголовок блока */}
      <div className="relative z-10 flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
            className="w-12 h-12 bg-gradient-to-br from-[#6b8dd6] to-[#93b4e8]
                       rounded-xl flex items-center justify-center shadow-lg"
          >
            <Sparkles className="w-6 h-6 text-white" />
          </motion.div>
          <div>
            <h3 className="text-xl font-bold text-white">AI Рекомендации</h3>
            <p className="text-sm text-white/60">
              Персонализированные на основе ваших данных
            </p>
          </div>
        </div>

        {/* Live-метка */}
        <motion.div
          animate={{ scale: [1, 1.08, 1] }}
          transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
          className="px-3 py-1 bg-white/10 backdrop-blur-sm rounded-full border border-white/20"
        >
          <span className="text-xs text-white font-medium">Live</span>
        </motion.div>
      </div>

      {/* Список рекомендаций */}
      <div className="relative z-10 space-y-3">
        {recommendations.map((item, index) => {
          const styles = priorityStyles[item.priority];
          return (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: 0.2 + index * 0.1 }}
              className={`bg-white/5 backdrop-blur-sm rounded-xl p-4 border ${styles.border}
                          cursor-pointer group`}
            >
              <div className="flex items-start gap-3">
                {/* Пульсирующая точка */}
                <motion.div
                  animate={{ scale: [1, 1.3, 1] }}
                  transition={{ duration: 2, repeat: Infinity, delay: index * 0.3 }}
                  className={`w-2 h-2 rounded-full ${styles.dot} mt-1.5 flex-shrink-0`}
                />

                <div className="flex-1 min-w-0">
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex-1">
                      <h4 className="text-white font-semibold mb-1">{item.title}</h4>
                      <p className="text-sm text-white/70 leading-relaxed">
                        {item.description}
                      </p>
                    </div>
                    <Lightbulb className={`w-5 h-5 ${styles.icon} flex-shrink-0`} />
                  </div>

                  {item.actionable && (
                    <motion.button
                      whileHover={{ x: 5 }}
                      className="mt-3 flex items-center gap-2 text-xs text-[#6b8dd6]
                                 hover:text-[#93b4e8] transition-colors"
                    >
                      <span>Применить рекомендацию</span>
                      <ArrowRight className="w-3 h-3" />
                    </motion.button>
                  )}
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Подвал блока */}
      <motion.div
        initial={{ opacity: 0 }}
        whileInView={{ opacity: 1 }}
        viewport={{ once: true }}
        transition={{ delay: 0.8 }}
        className="relative z-10 mt-6 pt-6 border-t border-white/10"
      >
        <p className="text-xs text-white/50 text-center">
          Обновлено только что • На основе анализа 30 дней данных
        </p>
      </motion.div>
    </motion.div>
  );
}
