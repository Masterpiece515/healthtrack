'use client';

import Link from 'next/link';
import { useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Menu, X } from '@/components/icons';
import Image from 'next/image';

const links = [
  { href: '#features', label: 'Возможности' },
  { href: '#how',      label: 'Механика'    },
  { href: '#preview',  label: 'Интерфейс'  },
];

export function Navbar() {
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

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

          {/* Войти — десктоп */}
          <div className="hidden md:flex">
            <Link
              href="/login"
              className="text-[#1a1e5e] text-base font-medium hover:text-[#6b8dd6] transition-colors"
            >
              Войти
            </Link>
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
              <div className="pt-3 border-t border-gray-100">
                <Link
                  href="/login"
                  className="block py-3 text-center text-white text-base font-semibold rounded-full"
                  style={{ background: '#6b8dd6' }}
                >
                  Войти
                </Link>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
