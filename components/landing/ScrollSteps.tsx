'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

// SVG-иконка следа ноги
function FootSvg({ flip }: { flip?: boolean }) {
  return (
    <svg
      width="22" height="28" viewBox="0 0 22 28" fill="none"
      style={{ transform: flip ? 'scaleX(-1)' : undefined }}
      xmlns="http://www.w3.org/2000/svg"
    >
      {/* Пятка */}
      <ellipse cx="11" cy="21" rx="7" ry="6" fill="currentColor" />
      {/* Подъём */}
      <ellipse cx="9" cy="14" rx="4.5" ry="5.5" fill="currentColor" />
      {/* Большой палец */}
      <ellipse cx="5"  cy="6"  rx="3"   ry="4"   fill="currentColor" />
      {/* 2-й палец */}
      <ellipse cx="10" cy="4"  rx="2.5" ry="3.5" fill="currentColor" />
      {/* 3-й палец */}
      <ellipse cx="15" cy="5"  rx="2.2" ry="3.2" fill="currentColor" />
      {/* 4-й палец */}
      <ellipse cx="19" cy="8"  rx="1.8" ry="2.8" fill="currentColor" />
    </svg>
  );
}

const TOTAL = 9; // максимум следов на экране

export function ScrollSteps() {
  const [progress,  setProgress]  = useState(0);
  const [visible,   setVisible]   = useState(false);
  const [steps,     setSteps]     = useState(0);

  useEffect(() => {
    const onScroll = () => {
      const scrollY   = window.scrollY;
      const maxScroll = document.documentElement.scrollHeight - window.innerHeight;
      const p = maxScroll > 0 ? scrollY / maxScroll : 0;
      setProgress(p);
      setSteps(Math.round(p * 10000));
      setVisible(scrollY > 80);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const shown = Math.min(Math.floor(progress * (TOTAL + 1)), TOTAL);

  return (
    <>
      {/* ── Вертикальная цепочка следов слева ── */}
      <div className="fixed left-5 top-0 bottom-0 z-40 pointer-events-none
                      hidden lg:flex flex-col justify-around py-20">
        {Array.from({ length: TOTAL }).map((_, i) => {
          const isLeft = i % 2 === 0;
          const appear = i < shown;
          return (
            <motion.div
              key={i}
              initial={false}
              animate={{
                opacity: appear ? 0.45 : 0,
                x:       appear ? 0    : isLeft ? -14 : 14,
                scale:   appear ? 1    : 0.6,
              }}
              transition={{ type: 'spring', stiffness: 260, damping: 22, delay: appear ? 0 : 0 }}
              style={{ color: '#6b8dd6', marginLeft: isLeft ? 0 : 10 }}
            >
              <FootSvg flip={!isLeft} />
            </motion.div>
          );
        })}
      </div>

      {/* ── Счётчик шагов (правый нижний угол) ── */}
      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.9 }}
            animate={{ opacity: 1,  y: 0,  scale: 1   }}
            exit={{    opacity: 0,  y: 24, scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300, damping: 28 }}
            className="fixed bottom-6 right-6 z-50 bg-white rounded-2xl shadow-xl
                       border border-[#c5d3f0]/40 px-4 py-3 flex items-center gap-3
                       pointer-events-none"
          >
            {/* Иконка */}
            <div className="w-9 h-9 rounded-xl bg-[#eef2ff] flex items-center justify-center flex-shrink-0"
                 style={{ color: '#6b8dd6' }}>
              <FootSvg />
            </div>

            {/* Цифры */}
            <div className="min-w-[72px]">
              <p className="text-[10px] text-[#4a5a8a] leading-none mb-0.5">Шагов пройдено</p>
              <p className="text-lg font-bold text-[#1a1e5e] leading-none tabular-nums">
                {steps.toLocaleString('ru-RU')}
              </p>
            </div>

            {/* Прогресс-бар вертикальный */}
            <div className="w-1.5 h-10 bg-[#eef2ff] rounded-full overflow-hidden self-stretch my-0.5">
              <motion.div
                className="w-full bg-[#6b8dd6] rounded-full"
                style={{ height: `${progress * 100}%` }}
                transition={{ type: 'tween', ease: 'linear', duration: 0.1 }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
