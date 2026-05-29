'use client';

import { motion } from 'framer-motion';
import { ArrowRight, Heart, Moon, TrendingUp, Activity, ClipboardList, User, Settings, Footprints, Weight } from '@/components/icons';
import Link from 'next/link';
import Image from 'next/image';

function MiniCard({
  icon: Icon, label, value, unit, color, progress,
}: {
  icon: typeof Heart;
  label: string;
  value: string;
  unit?: string;
  color: string;
  progress?: number;
}) {
  return (
    <div className="bg-[#f5f8ff] rounded-xl p-3 relative overflow-hidden">
      <div className="flex items-start justify-between mb-2">
        <div>
          <p className="text-[10px] text-[#4a5a8a] mb-0.5">{label}</p>
          <div className="flex items-baseline gap-0.5">
            <span className="text-lg font-bold text-[#1a1e5e]">{value}</span>
            {unit && <span className="text-[9px] text-[#4a5a8a]">{unit}</span>}
          </div>
        </div>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: `${color}20` }}>
          <Icon className="w-3.5 h-3.5" style={{ color }} />
        </div>
      </div>
      {progress !== undefined && (
        <div className="h-1 bg-[#c5d3f0]/30 rounded-full overflow-hidden">
          <div className="h-full rounded-full" style={{ width: `${Math.min(progress, 100)}%`, backgroundColor: color }} />
        </div>
      )}
    </div>
  );
}

function ChartBar({ height, active }: { height: number; active?: boolean }) {
  return (
    <motion.div
      initial={{ scaleY: 0 }}
      whileInView={{ scaleY: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.6, ease: 'easeOut' }}
      className="w-full rounded-t-md origin-bottom"
      style={{ height: `${height}%`, backgroundColor: active ? '#6b8dd6' : '#c5d3f0', opacity: 0.85 }}
    />
  );
}

const bars = [42, 68, 53, 85, 61, 92, 74];
const days = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

const sidebarNav = [
  { icon: Activity,     label: 'Главная',      active: true  },
  { icon: TrendingUp,   label: 'Аналитика',    active: false },
  { icon: Heart,        label: 'Рекомендации', active: false },
  { icon: ClipboardList,label: 'История',      active: false },
  { icon: User,         label: 'Профиль',      active: false },
];

export function DashboardPreview() {
  return (
    <section id="preview" className="py-24 bg-white overflow-hidden">
      <div className="max-w-7xl mx-auto px-6 lg:px-12">
        <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-16">

          {/* Превью — слева */}
          <motion.div
            initial={{ opacity: 0, x: -40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7 }}
            className="w-full lg:w-[58%] flex-shrink-0"
          >
            <div className="relative rounded-2xl overflow-hidden shadow-2xl border border-[#e2e8f0]">
              {/* Браузерная строка */}
              <div className="flex items-center gap-2 px-4 py-3 bg-[#1a1e5e] border-b border-white/10">
                <div className="flex gap-1.5">
                  <div className="w-3 h-3 rounded-full bg-red-400/80" />
                  <div className="w-3 h-3 rounded-full bg-yellow-400/80" />
                  <div className="w-3 h-3 rounded-full bg-green-400/80" />
                </div>
                <div className="flex-1 mx-3">
                  <div className="bg-white/10 rounded-md px-3 py-1 text-[11px] text-white/40 text-center">
                    healthtrack.app/dashboard
                  </div>
                </div>
              </div>

              {/* Дашборд */}
              <div className="flex bg-[#f5f8ff]">

                {/* Сайдбар — белый, как в реальном интерфейсе */}
                <div className="hidden sm:flex w-11 lg:w-44 bg-white border-r border-[#6b8dd6]/15 flex-col flex-shrink-0 shadow-sm">
                  {/* Лого */}
                  <div className="p-3 lg:p-4 border-b border-[#6b8dd6]/10 flex items-center gap-2">
                    <div className="w-7 h-7 flex-shrink-0">
                      <Image src="/vector 7.png" alt="HealthTrack" width={28} height={28} className="w-full h-full object-contain" />
                    </div>
                    <div className="hidden lg:flex flex-col leading-tight">
                      <span className="font-semibold text-[#1a1e5e] text-sm leading-none">Health</span>
                      <span className="font-semibold text-[#6b8dd6] text-sm leading-none">Track</span>
                    </div>
                  </div>

                  {/* Навигация */}
                  <nav className="flex-1 p-2 space-y-0.5">
                    {sidebarNav.map(({ icon: Icon, label, active }) => (
                      <div
                        key={label}
                        className={`flex items-center gap-2 px-2 py-2 rounded-xl text-[11px] font-medium transition-colors ${
                          active
                            ? 'bg-[#6b8dd6] text-white shadow-sm'
                            : 'text-[#4a5a8a]'
                        }`}
                      >
                        <Icon className="w-4 h-4 flex-shrink-0" />
                        <span className="hidden lg:block truncate">{label}</span>
                      </div>
                    ))}
                  </nav>

                  {/* Настройки внизу */}
                  <div className="p-2 border-t border-[#6b8dd6]/10">
                    <div className="flex items-center gap-2 px-2 py-2 rounded-xl text-[11px] text-[#4a5a8a]">
                      <Settings className="w-4 h-4 flex-shrink-0" />
                      <span className="hidden lg:block">Настройки</span>
                    </div>
                    {/* Аватар пользователя */}
                    <div className="hidden lg:flex items-center gap-2 mt-1 p-2 bg-[#eef2ff] rounded-xl">
                      <div className="w-6 h-6 bg-[#6b8dd6] rounded-full flex items-center justify-center flex-shrink-0">
                        <span className="text-white text-[9px] font-bold">А</span>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-[10px] font-semibold text-[#1a1e5e] truncate">Александр</p>
                        <p className="text-[9px] text-[#4a5a8a] truncate">user@mail.ru</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Основной контент */}
                <div className="flex-1 p-3 lg:p-4 space-y-3 min-w-0">
                  {/* Заголовок */}
                  <div>
                    <h3 className="text-sm font-bold text-[#1a1e5e]">Добро пожаловать! 👋</h3>
                    <p className="text-[10px] text-[#4a5a8a]">среда, 7 мая 2026</p>
                  </div>

                  {/* Карточки */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-2">
                    {/* Индекс здоровья */}
                    <div className="bg-white rounded-xl p-3 flex flex-col items-center justify-center shadow-sm border border-[#6b8dd6]/10">
                      <p className="text-[10px] text-[#4a5a8a] mb-2">Индекс здоровья</p>
                      <div className="relative w-14 h-14">
                        <svg viewBox="0 0 80 80" className="-rotate-90 w-full h-full">
                          <circle cx="40" cy="40" r="30" fill="none" stroke="#eef2ff" strokeWidth="9" />
                          <motion.circle
                            cx="40" cy="40" r="30" fill="none"
                            stroke="#22c55e" strokeWidth="9" strokeLinecap="round"
                            strokeDasharray={188}
                            initial={{ strokeDashoffset: 188 }}
                            whileInView={{ strokeDashoffset: 188 - 0.78 * 188 }}
                            viewport={{ once: true }}
                            transition={{ duration: 1.5, ease: 'easeOut' }}
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-base font-bold text-[#22c55e]">78</span>
                        </div>
                      </div>
                      <p className="text-[10px] font-semibold text-[#1a1e5e] mt-1">Отлично</p>
                    </div>

                    {/* Мини-карточки метрик */}
                    <div className="lg:col-span-2 grid grid-cols-2 gap-2">
                      <MiniCard icon={Footprints} label="Шаги"  value="10 120"  color="#6b8dd6"  progress={101} />
                      <MiniCard icon={Moon}       label="Сон"   value="7.5" unit="ч"    color="#93b4e8"  progress={94}  />
                      <MiniCard icon={Heart}      label="Пульс" value="72"  unit="уд/мин" color="#4a5a8a" />
                      <MiniCard icon={Weight}     label="Вес"   value="75"  unit="кг"   color="#a78bfa" />
                    </div>
                  </div>

                  {/* График */}
                  <div className="bg-white rounded-xl p-3 shadow-sm border border-[#6b8dd6]/10">
                    <div className="flex items-center justify-between mb-2">
                      <p className="text-[11px] font-bold text-[#1a1e5e]">Активность за неделю</p>
                      <div className="flex items-center gap-1">
                        <div className="w-2 h-2 rounded-full bg-[#6b8dd6]" />
                        <span className="text-[9px] text-[#4a5a8a]">Шаги</span>
                      </div>
                    </div>
                    <div className="flex items-end gap-1 h-10">
                      {bars.map((h, i) => (
                        <div key={i} className="flex-1 flex flex-col items-center gap-1">
                          <ChartBar height={h} active={i === 6} />
                          <span className="text-[8px] text-[#4a5a8a]">{days[i]}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>

          {/* Текст — справа */}
          <motion.div
            initial={{ opacity: 0, x: 40 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.7, delay: 0.1 }}
            className="w-full lg:w-[42%]"
          >
            <span className="inline-block px-3 py-1 bg-[#1a1e5e]/10 text-[#1a1e5e] text-xs font-bold rounded-full mb-4 uppercase tracking-widest">
              Интерфейс
            </span>
            <h2 className="text-3xl md:text-4xl font-bold text-[#1a1e5e] mb-4 leading-tight">
              Всё видно{' '}
              <span className="text-[#6b8dd6]">с первого взгляда</span>
            </h2>
            <p className="text-[#4a5a8a] text-base leading-relaxed mb-8">
              Понятный дашборд без лишнего.
              Открыл — и сразу видишь, как ты себя чувствуешь.
            </p>
            <Link href="/dashboard" className="inline-flex items-center gap-2 text-[#6b8dd6] font-semibold hover:text-[#1a1e5e] transition-colors">
              Узнать больше <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

        </div>
      </div>
    </section>
  );
}
