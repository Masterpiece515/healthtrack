'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader2, Star } from '@/components/icons';
import Link from 'next/link';
import { signIn } from 'next-auth/react';

const reviews = [
  { name: 'Артём М.',   text: 'Сбросил 7 кг за 2 месяца. AI-советы реально работают — теперь сплю лучше и хожу пешком везде!', stars: 5 },
  { name: 'Мария К.',   text: 'Наконец-то вижу свой прогресс в цифрах. Аналитика за неделю мотивирует не пропускать тренировки.', stars: 5 },
  { name: 'Дмитрий С.', text: 'Простой интерфейс и умные рекомендации. Лучшее приложение для здоровья, которое я пробовал.', stars: 5 },
];

export function CTA() {
  const [googleLoading, setGoogleLoading] = useState(false);

  const handleGoogle = async () => {
    setGoogleLoading(true);
    await signIn('google', { callbackUrl: '/dashboard' });
  };

  return (
    <section id="register" className="relative py-20 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row items-stretch gap-8 lg:gap-0 rounded-3xl overflow-hidden shadow-xl">

          {/* Левая часть — отзывы */}
          <div className="flex-1 bg-[#f5f7ff] px-10 py-12 lg:px-12 flex flex-col justify-center">
            <div className="mb-8">
              <p className="text-sm font-semibold text-[#6b8dd6] uppercase tracking-widest mb-2">Отзывы пользователей</p>
              <h2 className="font-extrabold text-[#1a1e5e] text-2xl md:text-3xl leading-tight">
                Нам доверяют тысячи людей
              </h2>
            </div>

            <div className="space-y-4">
              {reviews.map((r, i) => (
                <motion.div
                  key={r.name}
                  initial={{ opacity: 0, y: 16 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.4, delay: i * 0.1 }}
                  className="bg-white rounded-2xl p-5 shadow-sm border border-[#e8eeff]"
                >
                  <div className="flex items-center gap-1 mb-2">
                    {Array.from({ length: r.stars }).map((_, j) => (
                      <Star key={j} className="w-3.5 h-3.5 fill-[#fbbf24] text-[#fbbf24]" />
                    ))}
                  </div>
                  <p className="text-[#4a5a8a] text-sm leading-relaxed mb-3">&quot;{r.text}&quot;</p>
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full bg-[#6b8dd6]/15 flex items-center justify-center text-[#6b8dd6] font-bold text-xs">
                      {r.name[0]}
                    </div>
                    <span className="text-[#1a1e5e] font-semibold text-sm">{r.name}</span>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Правая часть — синяя CTA */}
          <div
            className="flex-1 flex flex-col justify-center items-center px-10 py-12 lg:px-12 text-center relative overflow-hidden"
            style={{ background: 'linear-gradient(135deg, #4a6abf 0%, #6b8dd6 50%, #7fa0e0 100%)' }}
          >
            {/* Декоративные круги */}
            <div className="absolute top-[-40px] right-[-40px] w-48 h-48 bg-white/8 rounded-full pointer-events-none" />
            <div className="absolute bottom-[-60px] left-[-30px] w-56 h-56 bg-white/5 rounded-full pointer-events-none" />

            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="relative z-10 w-full max-w-sm"
            >
              {/* Иллюстрация */}
              <div className="flex justify-center mb-6">
                <svg width="160" height="130" viewBox="0 0 160 130" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="80" cy="65" r="55" fill="white" fillOpacity="0.08" />
                  <circle cx="80" cy="65" r="38" fill="white" fillOpacity="0.07" />
                  {/* Тело */}
                  <circle cx="80" cy="34" r="14" fill="white" fillOpacity="0.85" />
                  <path d="M58 85 Q58 60 80 60 Q102 60 102 85 L99 108 H61 Z" fill="white" fillOpacity="0.75" />
                  {/* Руки */}
                  <path d="M61 70 Q46 75 42 88" stroke="white" strokeOpacity="0.7" strokeWidth="5" strokeLinecap="round" />
                  <path d="M99 70 Q114 75 118 88" stroke="white" strokeOpacity="0.7" strokeWidth="5" strokeLinecap="round" />
                  {/* Ноги */}
                  <path d="M67 108 L63 126" stroke="white" strokeOpacity="0.7" strokeWidth="5" strokeLinecap="round" />
                  <path d="M93 108 L97 126" stroke="white" strokeOpacity="0.7" strokeWidth="5" strokeLinecap="round" />
                  {/* Кардиограмма */}
                  <path d="M18 72 L30 72 L37 58 L44 86 L51 66 L57 72 L142 72" stroke="#4ade80" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" opacity="0.9" />
                  {/* Звёздочки */}
                  <circle cx="130" cy="28" r="3" fill="white" fillOpacity="0.5" />
                  <circle cx="22" cy="105" r="2.5" fill="white" fillOpacity="0.4" />
                  <circle cx="138" cy="100" r="4" fill="white" fillOpacity="0.25" />
                </svg>
              </div>

              <h2 className="font-extrabold text-white text-2xl md:text-3xl mb-2 leading-tight">
                Присоединяйся к нам!
              </h2>
              <p className="text-white/75 text-sm leading-relaxed mb-6">
                Тысячи людей уже улучшили своё здоровье.<br />
                Создай аккаунт — это бесплатно и займёт минуту.
              </p>

              {/* Преимущества */}
              <div className="space-y-2 mb-7 text-left">
                {[
                  '✓  Отслеживай шаги, сон и пульс',
                  '✓  AI-советы на основе твоих данных',
                  '✓  Наглядная аналитика за 7 дней',
                ].map(item => (
                  <p key={item} className="text-white/85 text-sm font-medium">{item}</p>
                ))}
              </div>

              {/* Google кнопка */}
              <motion.button
                type="button"
                onClick={handleGoogle}
                disabled={googleLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="w-full flex items-center justify-center gap-3 py-3 px-4
                           bg-white text-[#1a1e5e] font-semibold rounded-xl shadow
                           hover:bg-gray-50 transition-colors disabled:opacity-60 mb-3"
              >
                {googleLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                {googleLoading ? 'Перенаправление...' : 'Зарегистрироваться через Google'}
              </motion.button>

              <p className="text-white/55 text-xs">
                или{' '}
                <Link href="/register" className="text-white underline font-semibold hover:text-white/90 transition-colors">
                  создай аккаунт с email
                </Link>
              </p>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
