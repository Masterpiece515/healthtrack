'use client';

import Link from 'next/link';
import { useState, useEffect, useRef } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X, LogOut, LayoutDashboard, Settings } from '@/components/icons';
import Image from 'next/image';
import { useSession, signOut } from 'next-auth/react';

const links = [
  { href: '#features', label: 'Возможности' },
  { href: '#how',      label: 'Механика'    },
  { href: '#preview',  label: 'Интерфейс'  },
];

function UserMenu() {
  const { data: session } = useSession();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const name    = (session?.user as { name?: string })?.name  ?? 'Пользователь';
  const email   = (session?.user as { email?: string })?.email ?? '';
  const initial = name.charAt(0).toUpperCase();

  // Закрывать при клике вне
  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    }
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-2.5 px-3 py-1.5 rounded-full
                   bg-[#eef2ff] hover:bg-[#dce6ff] border border-[#c5d3f0]/40
                   transition-colors"
      >
        <div className="w-7 h-7 rounded-full bg-[#6b8dd6] flex items-center justify-center flex-shrink-0">
          <span className="text-white text-xs font-bold">{initial}</span>
        </div>
        <span className="text-sm font-semibold text-[#1a1e5e] max-w-[120px] truncate hidden sm:block">
          {name}
        </span>
        <svg className={`w-3.5 h-3.5 text-[#4a5a8a] transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.96 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.96 }}
            transition={{ duration: 0.15 }}
            className="absolute right-0 mt-2 w-56 bg-white rounded-2xl shadow-xl
                       border border-[#c5d3f0]/30 overflow-hidden z-50"
          >
            {/* Шапка профиля */}
            <div className="px-4 py-3 border-b border-[#eef2ff]">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6b8dd6] to-[#93b4e8]
                                flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-bold">{initial}</span>
                </div>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-[#1a1e5e] truncate">{name}</p>
                  <p className="text-xs text-[#4a5a8a] truncate">{email}</p>
                </div>
              </div>
            </div>

            {/* Пункты меню */}
            <div className="py-1.5">
              <Link
                href="/dashboard"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#1a1e5e]
                           hover:bg-[#eef2ff] transition-colors"
              >
                <LayoutDashboard className="w-4 h-4 text-[#6b8dd6]" />
                Перейти в приложение
              </Link>
              <Link
                href="/settings"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm text-[#1a1e5e]
                           hover:bg-[#eef2ff] transition-colors"
              >
                <Settings className="w-4 h-4 text-[#6b8dd6]" />
                Настройки
              </Link>
            </div>

            <div className="border-t border-[#eef2ff] py-1.5">
              <button
                onClick={() => { setOpen(false); signOut({ callbackUrl: '/' }); }}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-500
                           hover:bg-red-50 transition-colors"
              >
                <LogOut className="w-4 h-4" />
                Выйти
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

export function Navbar() {
  const { data: session, status } = useSession();
  const isLoggedIn = status === 'authenticated' && !!session?.user;

  const [scrolled,  setScrolled]  = useState(false);
  const [menuOpen,  setMenuOpen]  = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <header
      className={`fixed top-0 inset-x-0 z-50 transition-all duration-300 ${
        scrolled ? 'bg-white/95 backdrop-blur-md shadow-sm' : 'bg-white'
      }`}
    >
      <div className="max-w-7xl mx-auto min-w-0 px-4 sm:px-6 lg:px-12">
        <div className="flex items-center justify-between h-16 min-w-0 gap-2">

          {/* Логотип */}
          <Link href="/" className="flex items-center gap-2 shrink-0 min-w-0">
            <Image
              src="/vector 7.png"
              alt="HealthTrack"
              width={40}
              height={40}
              className="w-10 h-10"
            />
            <div className="flex flex-col leading-tight">
              <span className="font-semibold text-[#1a1e5e] text-base leading-none">Health</span>
              <span className="font-semibold text-[#6b8dd6] text-base leading-none">Track</span>
            </div>
          </Link>

          {/* Навигация — десктоп */}
          <nav className="hidden md:flex items-center gap-8">
            {links.map(({ href, label }) => (
              <a
                key={href}
                href={href}
                className="text-[#1a1e5e] text-base hover:text-[#6b8dd6] transition-colors"
              >
                {label}
              </a>
            ))}
          </nav>

          {/* Правый блок — десктоп */}
          <div className="hidden md:flex items-center">
            {status === 'loading' ? (
              // Скелетон пока загружается сессия
              <div className="w-28 h-8 rounded-full bg-[#eef2ff] animate-pulse" />
            ) : isLoggedIn ? (
              <UserMenu />
            ) : (
              <Link
                href="/login"
                className="text-[#1a1e5e] text-base font-medium hover:text-[#6b8dd6] transition-colors"
              >
                Войти
              </Link>
            )}
          </div>

          {/* Бургер — мобильный */}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="md:hidden p-2 text-[#1a1e5e]"
          >
            {menuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>
      </div>

      {/* Мобильное меню */}
      <AnimatePresence>
        {menuOpen && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            className="md:hidden bg-white border-t border-gray-100"
          >
            <div className="px-6 py-4 space-y-3">
              {links.map(({ href, label }) => (
                <a
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className="block py-3 text-[#1a1e5e] text-base"
                >
                  {label}
                </a>
              ))}
              <div className="pt-3 border-t border-gray-100 space-y-2">
                {isLoggedIn ? (
                  <>
                    <Link
                      href="/dashboard"
                      onClick={() => setMenuOpen(false)}
                      className="flex items-center gap-3 py-3 text-[#1a1e5e] text-base font-medium"
                    >
                      <LayoutDashboard className="w-5 h-5 text-[#6b8dd6]" />
                      Перейти в приложение
                    </Link>
                    <button
                      onClick={() => { setMenuOpen(false); signOut({ callbackUrl: '/' }); }}
                      className="w-full flex items-center gap-3 py-3 text-red-500 text-base font-medium"
                    >
                      <LogOut className="w-5 h-5" />
                      Выйти
                    </button>
                  </>
                ) : (
                  <Link
                    href="/login"
                    onClick={() => setMenuOpen(false)}
                    className="block py-3 text-center text-white text-base font-semibold rounded-full"
                    style={{ background: '#6b8dd6' }}
                  >
                    Войти
                  </Link>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
