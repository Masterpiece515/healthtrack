'use client';

import { motion } from 'framer-motion';
import { TrendingUp, TrendingDown, Minus } from '@/components/icons';

interface HealthScoreProps {
  score: number;
  trend?: number;
  delay?: number;
  avgSteps?: number;
  avgSleep?: number;
  avgHeartRate?: number;
}

function getScoreStyle(score: number) {
  if (score >= 75) return { color: '#22c55e', label: 'Отлично' };
  if (score >= 50) return { color: '#f59e0b', label: 'Хорошо' };
  return { color: '#ef4444', label: 'Требует внимания' };
}

export function HealthScore({ score, trend, delay = 0, avgSteps, avgSleep, avgHeartRate }: HealthScoreProps) {
  const stepsScore = avgSteps     != null ? Math.min(Math.round((avgSteps / 10000) * 40), 40) : null;
  const sleepScore = avgSleep     != null ? Math.min(Math.round((avgSleep / 8) * 35), 35)     : null;
  const hrScore    = avgHeartRate != null
    ? (avgHeartRate >= 60 && avgHeartRate <= 80 ? 25 : Math.max(0, Math.round(25 - Math.abs(avgHeartRate - 70) * 0.5)))
    : null;

  const { color, label } = getScoreStyle(score);
  /** Квадратный viewBox — круг без граней при масштабировании (без смеси % и px). */
  const vb = 240;
  const cx = vb / 2;
  const cy = vb / 2;
  const radius = 88;
  const strokeWidth = 14;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} transition={{ duration: 0.6, delay }}>
      <div className="relative w-full aspect-square max-w-[280px] mx-auto overflow-visible">
        <motion.div
          animate={{ scale: [1, 1.04, 1], opacity: [0.2, 0.35, 0.2] }}
          transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute inset-[8%] rounded-full blur-2xl"
          style={{ backgroundColor: color }}
        />
        <svg
          className="relative z-10 block h-full w-full -rotate-90"
          viewBox={`0 0 ${vb} ${vb}`}
          preserveAspectRatio="xMidYMid meet"
          shapeRendering="geometricPrecision"
        >
          <circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke="#eef2ff"
            strokeWidth={strokeWidth}
          />
          <motion.circle
            cx={cx}
            cy={cy}
            r={radius}
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 2, ease: 'easeOut', delay }}
          />
        </svg>
        <div className="absolute inset-0 flex flex-col items-center justify-center">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.6, delay: delay + 0.5 }} className="text-center">
            <p className="text-xs text-[#4a5a8a] mb-1 font-medium">Индекс здоровья</p>
            <motion.p initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ duration: 0.8, delay: delay + 0.3, type: 'spring' }}
              className="text-5xl font-bold mb-1" style={{ color }}>
              {score}
            </motion.p>
            <p className="text-xs text-[#4a5a8a] mb-2">из 100</p>
            {trend != null && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: delay + 0.8 }}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium"
                style={{ backgroundColor: `${color}18`, color }}>
                {trend > 0 ? <TrendingUp className="w-3 h-3" /> : trend < 0 ? <TrendingDown className="w-3 h-3" /> : <Minus className="w-3 h-3" />}
                {trend !== 0 ? `${Math.abs(trend)}%` : 'Без изменений'}
              </motion.div>
            )}
          </motion.div>
        </div>
      </div>

      <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: delay + 1 }} className="text-center mt-4">
        <p className="text-base font-semibold text-[#1a1e5e]">{label}</p>
        <p className="text-xs text-[#4a5a8a] mt-0.5">На основе показателей за 7 дней</p>
      </motion.div>

      {(stepsScore != null || sleepScore != null || hrScore != null) && (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: delay + 1.2 }} className="mt-4 space-y-2">
          {[
            { label: 'Шаги',  got: stepsScore, max: 40, hint: 'цель 10 000/день' },
            { label: 'Сон',   got: sleepScore, max: 35, hint: 'цель 8 ч/ночь'   },
            { label: 'Пульс', got: hrScore,    max: 25, hint: 'норма 60–80'      },
          ].map(({ label: l, got, max, hint }) => got == null ? null : (
            <div key={l}>
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-[#4a5a8a]">{l} <span className="text-[#c5d3f0]">({hint})</span></span>
                <span className="font-medium text-[#1a1e5e]">{got}/{max}</span>
              </div>
              <div className="w-full h-1.5 bg-[#eef2ff] rounded-full overflow-hidden">
                <motion.div initial={{ width: 0 }} animate={{ width: `${(got / max) * 100}%` }}
                  transition={{ duration: 1, delay: delay + 1.3, ease: 'easeOut' }}
                  className="h-full rounded-full" style={{ backgroundColor: '#6b8dd6' }} />
              </div>
            </div>
          ))}
        </motion.div>
      )}
    </motion.div>
  );
}
