'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import { LayoutDashboard, Users, ArrowLeft, ShieldCheck, BarChart3 } from '@/components/icons';

const navItems = [
  { path: '/admin',           label: 'Дашборд',      icon: LayoutDashboard, exact: true },
  { path: '/admin/users',     label: 'Пользователи', icon: Users            },
  { path: '/admin/analytics', label: 'Аналитика',    icon: BarChart3        },
];

export function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (item: typeof navItems[0]) =>
    item.exact
      ? pathname === item.path
      : pathname === item.path || pathname.startsWith(item.path + '/');

  return (
    <>
      {/* ── Десктоп: боковая панель ── */}
      <aside className="hidden md:flex flex-col w-64 bg-gradient-to-b from-[#1A1A2E] to-[#16213E]
                         border-r border-white/5 h-screen sticky top-0 flex-shrink-0">
        {/* Лого */}
        <div className="p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl overflow-hidden flex-shrink-0 shadow-lg">
              <Image src="/vector 7.png" alt="HealthTrack" width={40} height={40} className="object-cover w-full h-full" />
            </div>
            <div>
              <h1 className="text-base font-bold text-white">HealthTrack</h1>
              <div className="flex items-center gap-1 mt-0.5">
                <ShieldCheck className="w-3 h-3 text-amber-400" />
                <p className="text-xs text-amber-400 font-medium">Администратор</p>
              </div>
            </div>
          </div>
        </div>

        {/* Навигация */}
        <nav className="flex-1 p-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item);
            return (
              <Link key={item.path} href={item.path}>
                <motion.div
                  whileHover={{ x: 4, scale: 1.02 }}
                  whileTap={{ scale: 0.97 }}
                  className={`relative px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${
                    active
                      ? 'bg-amber-500/20 text-amber-300 shadow-lg'
                      : 'text-white/70 hover:bg-white/5 hover:text-white'
                  }`}
                >
                  <Icon className="w-5 h-5 flex-shrink-0" />
                  <span className="font-medium">{item.label}</span>
                  {active && (
                    <motion.div
                      layoutId="adminActiveBar"
                      className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-8 bg-amber-400 rounded-r-full"
                      transition={{ type: 'spring', stiffness: 300, damping: 30 }}
                    />
                  )}
                </motion.div>
              </Link>
            );
          })}
        </nav>

        {/* Назад к приложению */}
        <div className="p-4 border-t border-white/5">
          <Link href="/dashboard">
            <motion.div
              whileHover={{ x: 4 }}
              className="px-4 py-3 rounded-xl flex items-center gap-3 text-white/50
                         hover:bg-white/5 hover:text-white transition-colors cursor-pointer"
            >
              <ArrowLeft className="w-5 h-5 flex-shrink-0" />
              <span className="font-medium">Назад в приложение</span>
            </motion.div>
          </Link>
        </div>
      </aside>

      {/* ── Мобиль: верхняя шапка ── */}
      <header className="md:hidden fixed top-0 left-0 right-0 z-50
                          bg-[#1A1A2E]/95 backdrop-blur-md border-b border-white/10
                          flex items-center justify-between px-4 h-14">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg overflow-hidden flex-shrink-0">
            <Image src="/vector 7.png" alt="HealthTrack" width={28} height={28} className="object-cover w-full h-full" />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-white font-bold text-sm">HealthTrack</span>
            <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
            <span className="text-amber-400 text-xs font-medium">Админ</span>
          </div>
        </div>
        <Link href="/dashboard"
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl
                         bg-white/5 text-white/60 text-xs font-medium active:bg-white/10">
          <ArrowLeft className="w-3.5 h-3.5" />
          В приложение
        </Link>
      </header>

      {/* ── Мобиль: нижняя навигация ── */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50
                       bg-[#1A1A2E]/95 backdrop-blur-md border-t border-white/10
                       flex items-center justify-around px-2 py-2">
        {navItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);
          return (
            <Link
              key={item.path}
              href={item.path}
              className={`flex flex-col items-center gap-0.5 px-4 py-2 rounded-xl transition-colors
                          ${active ? 'text-amber-300 bg-amber-500/15' : 'text-white/45'}`}
            >
              <Icon className="w-5 h-5" />
              <span className="text-[10px] font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </>
  );
}
