'use client';

import { motion } from 'framer-motion';
import type { AppIcon } from '@/components/icons';

interface StatCardProps {
  title: string;
  value: string | number;
  unit?: string;
  icon: AppIcon;
  trend?: number;
  progress?: number;
  color?: string;
  delay?: number;
}

function trendColor(trend: number): string {
  if (trend > 0) return '#22c55e';
  if (trend < 0) return '#ef4444';
  return '#94a3b8';
}

export function StatCard({ title, value, unit, icon: Icon, trend, progress, color = '#6b8dd6', delay = 0 }: StatCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      whileInView={{ opacity: 1, y: 0, scale: 1 }}
      viewport={{ once: true, margin: '-50px' }}
      transition={{ duration: 0.5, delay }}
      className="bg-white rounded-2xl p-4 sm:p-5 shadow-sm hover:shadow-md transition-shadow relative overflow-hidden border border-[#6b8dd6]/10"
    >
      <motion.div
        initial={{ scaleX: 0 }}
        whileInView={{ scaleX: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.6, delay: delay + 0.2 }}
        className="absolute top-0 left-0 right-0 h-1 origin-left rounded-t-2xl"
        style={{ backgroundColor: color }}
      />

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-3">
          <div className="flex-1">
            <p className="text-xs text-[#4a5a8a] font-medium mb-1">{title}</p>
            <div className="flex items-baseline gap-1">
              <motion.span
                initial={{ scale: 0 }}
                whileInView={{ scale: 1 }}
                viewport={{ once: true }}
                transition={{ type: 'spring', stiffness: 200, delay: delay + 0.3 }}
                className="text-2xl font-bold text-[#1a1e5e]"
              >
                {value}
              </motion.span>
              {unit && <span className="text-sm text-[#4a5a8a]">{unit}</span>}
            </div>
          </div>
          <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
            <Icon className="w-5 h-5" style={{ color }} />
          </div>
        </div>

        {progress !== undefined && (
          <div className="mb-2">
            <div className="h-1.5 bg-[#eef2ff] rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                whileInView={{ width: `${Math.min(progress, 100)}%` }}
                viewport={{ once: true }}
                transition={{ duration: 1, delay: delay + 0.4, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ backgroundColor: color }}
              />
            </div>
            <p className="text-xs text-[#4a5a8a] mt-1">{progress}% от цели</p>
          </div>
        )}

        {trend !== undefined && (
          <motion.div
            initial={{ opacity: 0, x: -10 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ delay: delay + 0.5 }}
            className="mt-0.5 flex flex-col gap-1 items-start"
          >
            <div
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium shrink-0"
              style={{ backgroundColor: `${trendColor(trend)}15`, color: trendColor(trend) }}
            >
              <span>{trend > 0 ? '↑' : trend < 0 ? '↓' : '→'}</span>
              <span>{Math.abs(trend)}%</span>
            </div>
            <span className="text-[11px] text-[#4a5a8a] leading-snug">к прошлой неделе</span>
          </motion.div>
        )}
      </div>
    </motion.div>
  );
}
