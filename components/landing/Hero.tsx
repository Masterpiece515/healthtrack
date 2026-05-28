'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import Image from 'next/image';

export function Hero() {
  return (
    <section className="relative min-h-screen flex items-center bg-white overflow-x-hidden pt-16 w-full max-w-full box-border">

      <div className="relative z-10 w-full min-w-0 max-w-7xl mx-auto px-4 sm:px-6 lg:px-12 py-16 box-border">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-0 w-full min-w-0">

          {/* Левая колонка — текст */}
          <div className="flex-1 min-w-0 w-full max-w-full lg:max-w-[55%]">
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="text-[#6b8dd6] text-sm font-medium mb-4"
            >
              Контролируй здоровье с умом
            </motion.p>

            <motion.h1
              initial={{ opacity: 0, y: 24 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.1 }}
              className="font-extrabold leading-tight mb-6 max-w-full break-words text-pretty"
              style={{
                fontSize: 'clamp(0.9rem, 2.8vw + 0.55rem, 3.2rem)',
                color: '#1a1e5e',
              }}
            >
              HEALTH TRACK -{' '}
              <span className="text-[#1a1e5e]">ЛУЧШИЙ ВЫБОР</span>{' '}
              <span className="text-[#6b8dd6]">ДЛЯ ЗАБОТЫ О СВОЕМ ЗДОРОВЬЕ</span>
            </motion.h1>

            <motion.p
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.2 }}
              className="text-[#4a5a8a] text-base md:text-lg leading-relaxed mb-10 max-w-lg"
            >
              Отслеживай шаги, сон, пульс и вес в одном месте.
              Персональный AI‑ассистент анализирует твои данные
              и даёт конкретные рекомендации каждый день.
            </motion.p>

            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.3 }}
            >
              <Link href="/register">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-3 px-6 py-3 cursor-pointer rounded-full"
                  style={{ background: '#6b8dd6' }}
                >
                  <span className="text-white font-semibold text-base">
                    Начать бесплатно
                  </span>
                  <span
                    className="flex items-center justify-center rounded-full bg-white/25 text-white font-bold w-8 h-8 text-sm flex-shrink-0"
                  >
                    &gt;
                  </span>
                </motion.div>
              </Link>
            </motion.div>
          </div>

          {/* Правая колонка — изображение */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, delay: 0.2 }}
            className="flex-1 min-w-0 w-full max-w-full flex justify-center lg:justify-end"
          >
            <div className="relative w-full min-w-0 max-w-[480px]">
              <Image
                src="/hero-heart.png"
                alt="HealthTrack 3D визуализация"
                width={480}
                height={480}
                className="w-full h-auto object-contain drop-shadow-xl"
                priority
              />
            </div>
          </motion.div>
        </div>
      </div>
    </section>
  );
}
