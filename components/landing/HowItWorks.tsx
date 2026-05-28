'use client';

import { motion } from 'framer-motion';
import Image from 'next/image';
import Link from 'next/link';

const steps = [
  {
    number: '1',
    title: 'Регистрация',
    description: 'Создайте аккаунт всего за 30 секунд! Укажите базовую информацию, чтобы создать аккаунт без лишних сложностей.',
    delay: 0.1,
  },
  {
    number: '2',
    title: 'Внос показателей',
    description: 'Каждый день обновляй данные и следи за результатом, отслеживая динамику и ключевые изменения в реальном времени.',
    delay: 0.2,
  },
  {
    number: '3',
    title: 'Получай советы',
    description: 'На основе анализа ваших трендов интеллектуальная система ежедневно формирует персональные рекомендации, помогая корректировать образ жизни с учетом актуальных потребностей организма.',
    delay: 0.3,
  },
];

export function HowItWorks() {
  return (
    <section id="how" className="relative overflow-hidden py-0">

      {/* Волна сверху */}
      <div className="w-full overflow-hidden leading-none" style={{ marginBottom: -4 }}>
        <Image
          src="/wave-top.png"
          alt=""
          aria-hidden
          width={1920}
          height={160}
          className="w-full block"
          style={{ display: 'block' }}
        />
      </div>

      {/* Синий блок */}
      <div style={{ background: '#6091F8' }} className="py-16 md:py-20">
        <div className="max-w-6xl mx-auto px-6 lg:px-12">

          {/* Сетка: левая карточка + 2×2 справа */}
          <div className="grid grid-cols-1 lg:grid-cols-[360px_1fr] gap-5 items-stretch">

            {/* Левая карточка — растягивается на 2 строки */}
            <motion.div
              initial={{ opacity: 0, x: -30 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.7 }}
              className="bg-white rounded-3xl p-8 shadow-lg flex flex-col gap-6 lg:row-span-2"
            >
              <div>
                <p className="text-[#6b8dd6] text-sm font-normal mb-2">
                  Три простых шага
                </p>
                <h2 className="font-extrabold text-[#1a1e5e] leading-tight" style={{ fontSize: 'clamp(1.8rem, 3vw, 2.4rem)' }}>
                  к лучшему<br />здоровью
                </h2>
              </div>

              {/* Иконка сердца */}
              <div className="text-[#6b8dd6] opacity-25">
                <svg viewBox="0 0 60 55" className="w-16 h-14" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M30 52C30 52 5 37 5 18C5 10 11 4 19 4C24 4 28 7 30 11C32 7 36 4 41 4C49 4 55 10 55 18C55 37 30 52 30 52Z" />
                </svg>
              </div>

              <p className="text-[#4a5a8a] text-sm leading-relaxed mt-auto">
                Персональный подход и высокий стандарт во всём.
                Мы заботимся о комфорте и удобстве использования нашего приложения.
              </p>

              <Link href="/register">
                <motion.div
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.97 }}
                  className="inline-flex items-center gap-3 px-5 py-3 rounded-full cursor-pointer"
                  style={{ background: '#6b8dd6' }}
                >
                  <span className="text-white font-semibold text-sm">Зарегистрироваться</span>
                  <span className="flex items-center justify-center rounded-full bg-white/25 text-white font-bold w-7 h-7 text-xs flex-shrink-0">
                    &gt;
                  </span>
                </motion.div>
              </Link>
            </motion.div>

            {/* Верхний ряд справа: шаг 1 + шаг 2 */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              {steps.slice(0, 2).map(({ number, title, description, delay }) => (
                <motion.div
                  key={number}
                  initial={{ opacity: 0, y: 24 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.6, delay }}
                  className="bg-white rounded-3xl p-6 shadow-md"
                >
                  <h3 className="text-[#1a1e5e] font-bold text-base mb-3">
                    {number}. {title}
                  </h3>
                  <p className="text-[#6b8dd6] text-sm leading-relaxed">{description}</p>
                </motion.div>
              ))}
            </div>

            {/* Нижний ряд справа: шаг 3 + картинка */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
              <motion.div
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.6, delay: steps[2].delay }}
                className="bg-white rounded-3xl p-6 shadow-md"
              >
                <h3 className="text-[#1a1e5e] font-bold text-base mb-3">
                  3. {steps[2].title}
                </h3>
                <p className="text-[#6b8dd6] text-sm leading-relaxed">{steps[2].description}</p>
              </motion.div>

              {/* Картинка AI-доктора */}
              <motion.div
                initial={{ opacity: 0, scale: 0.92 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.7, delay: 0.4 }}
                className="hidden sm:block rounded-3xl overflow-hidden shadow-md"
              >
                <Image
                  src="/ai-doctor.png"
                  alt="AI рекомендации"
                  width={400}
                  height={300}
                  className="w-full h-full object-cover"
                />
              </motion.div>
            </div>

          </div>
        </div>
      </div>

      {/* Волна снизу */}
      <div className="w-full overflow-hidden leading-none" style={{ marginTop: -4 }}>
        <Image
          src="/wave-top.png"
          alt=""
          aria-hidden
          width={1920}
          height={160}
          className="w-full block"
          style={{ display: 'block', transform: 'rotate(180deg)' }}
        />
      </div>

    </section>
  );
}
