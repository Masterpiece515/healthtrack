'use client';

import { motion } from 'framer-motion';

const features = [
  {
    title: 'ТВОИ ПОКАЗАТЕЛИ',
    description: 'Шаги, сон, пульс и вес — всё в одном месте. Вводи данные вручную или подключи устройство.',
    delay: 0.1,
  },
  {
    title: 'AI-СОВЕТЫ',
    description: 'Каждый день получай советы, которые подходят именно тебе — AI смотрит на твои данные и подсказывает что улучшить.',
    delay: 0.2,
  },
  {
    title: 'ГРАФИКИ И СТАТИСТИКА',
    description: 'Обновляй данные каждый день и сразу видь, как меняются твои результаты. Всё наглядно на графиках.',
    delay: 0.3,
  },
  {
    title: 'ТВОИ ДАННЫЕ В БЕЗОПАСНОСТИ',
    description: 'Никто не видит твои данные кроме тебя. Всё хранится надёжно на сервере.',
    delay: 0.4,
  },
];

// top-left, top-right, bottom-left, bottom-right
const cardPositions: React.CSSProperties[] = [
  { top: '5%',    left: '0' },
  { top: '5%',    right: '0' },
  { bottom: '5%', left: '0' },
  { bottom: '5%', right: '0' },
];

function FeatureCard({
  title,
  description,
  delay,
}: {
  title: string;
  description: string;
  delay: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: '-60px' }}
      transition={{ duration: 0.5, delay }}
      className="flex flex-col items-start text-left shadow-md hover:shadow-lg transition-shadow"
      style={{
        background: '#6b8dd6',
        borderRadius: '50px',
        padding: '28px 28px',
        position: 'relative',
        zIndex: 2,
      }}
    >
      <p className="font-bold text-white text-[11px] tracking-widest mb-2 uppercase">{title}</p>
      <p className="text-white/90 text-[12px] leading-relaxed">{description}</p>
    </motion.div>
  );
}

export function Features() {
  return (
    <section id="features" className="relative py-24 bg-white overflow-hidden">
      <div className="relative z-10 max-w-6xl mx-auto px-6 lg:px-12">

        {/* ── Мобильная версия ── */}
        <div className="lg:hidden">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="text-center mb-12"
          >
            <h2
              className="font-extrabold text-[#1a1e5e] leading-tight"
              style={{ fontSize: 'clamp(1.8rem, 5vw, 2.4rem)' }}
            >
              Всё что нужно
              <br />для здоровья
            </h2>
            <p className="text-[#4a5a8a] text-sm max-w-sm mx-auto mt-3">
              Четыре простых инструмента — и следить за здоровьем станет легко
            </p>
          </motion.div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {features.map((f, idx) => (
              <FeatureCard key={idx} title={f.title} description={f.description} delay={f.delay} />
            ))}
          </div>
        </div>

        {/* ── Десктопная версия: круговая раскладка ── */}
        <div className="hidden lg:block relative" style={{ height: '760px' }}>

          {/* Круг 1 — самый большой, по часовой */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              width: '860px', height: '860px',
              border: '2px dashed #6091F8',
              borderRadius: '50%', zIndex: 0,
              animation: 'spin-cw 32s linear infinite',
            }}
          />

          {/* Круг 2 — средний, против часовой */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              width: '680px', height: '680px',
              border: '2px dashed #6091F8',
              borderRadius: '50%', zIndex: 0,
              animation: 'spin-ccw 24s linear infinite',
            }}
          />

          {/* Круг 3 — внутренний, по часовой медленно */}
          <div
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none"
            style={{
              width: '500px', height: '500px',
              border: '1.5px dashed #6091F8',
              borderRadius: '50%', zIndex: 0,
              animation: 'spin-cw 18s linear infinite',
            }}
          />

          <style>{`
            @keyframes spin-cw  { from { transform: translate(-50%,-50%) rotate(0deg);   } to { transform: translate(-50%,-50%) rotate(360deg);  } }
            @keyframes spin-ccw { from { transform: translate(-50%,-50%) rotate(0deg);   } to { transform: translate(-50%,-50%) rotate(-360deg); } }
          `}</style>

          {/* Центральный заголовок */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 text-center"
            style={{ width: '300px', zIndex: 1 }}
          >
            <h2
              className="font-extrabold text-[#1a1e5e] leading-tight"
              style={{ fontSize: 'clamp(1.5rem, 2.2vw, 2rem)' }}
            >
              Всё что нужно
              <br />для здоровья
            </h2>
            <p className="text-[#4a5a8a] text-sm mt-3 leading-relaxed">
              Четыре простых инструмента — и следить за здоровьем станет легко
            </p>
          </motion.div>

          {/* Карточки по углам */}
          {features.map((f, idx) => (
            <div
              key={idx}
              className="absolute"
              style={{ width: '240px', ...cardPositions[idx] }}
            >
              <FeatureCard title={f.title} description={f.description} delay={f.delay} />
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}
