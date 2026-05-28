'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession, signOut } from 'next-auth/react';
import {
  Activity, TrendingUp, Heart, User,
  Settings, LogOut, Menu, X, ClipboardList, ShieldCheck,
} from '@/components/icons';

const navItems = [
  { path: '/dashboard',       label: 'Главная',      icon: Activity      },
  { path: '/analytics',       label: 'Аналитика',    icon: TrendingUp    },
  { path: '/recommendations', label: 'Рекомендации', icon: Heart         },
  { path: '/history',         label: 'История',      icon: ClipboardList },
  { path: '/profile',         label: 'Профиль',      icon: User          },
];

function NavContent({ collapsed, onLinkClick }: { collapsed: boolean; onLinkClick?: () => void }) {
  const pathname = usePathname();
  const { data: session } = useSession();

  const userName    = (session?.user as { name?: string })?.name   ?? 'Пользователь';
  const userEmail   = (session?.user as { email?: string })?.email ?? '';
  const userRole    = (session?.user as { role?: string })?.role   ?? 'user';
  const userInitial = userName.charAt(0).toUpperCase();

  return (
    <>
      <nav className="flex-1 p-4 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = pathname === item.path || pathname.startsWith(item.path + '/');
          return (
            <Link key={item.path} href={item.path} onClick={onLinkClick}>
              <motion.div
                whileHover={{ x: 3 }}
                whileTap={{ scale: 0.97 }}
                className={`relative px-4 py-3 rounded-xl flex items-center gap-3 transition-colors ${
                  isActive
                    ? 'bg-[#6b8dd6] text-white shadow-md'
                    : 'text-[#4a5a8a] hover:bg-[#eef2ff] hover:text-[#1a1e5e]'
                }`}
              >
                <Icon className="w-5 h-5 flex-shrink-0" />
                <AnimatePresence>
                  {!collapsed && (
                    <motion.span
                      initial={{ opacity: 0, width: 0 }}
                      animate={{ opacity: 1, width: 'auto' }}
                      exit={{ opacity: 0, width: 0 }}
                      className="overflow-hidden whitespace-nowrap font-medium"
                    >
                      {item.label}
                    </motion.span>
                  )}
                </AnimatePresence>
              </motion.div>
            </Link>
          );
        })}
      </nav>

      <div className="p-4 border-t border-[#6b8dd6]/10 space-y-1">
        <Link href="/settings" onClick={onLinkClick}>
          <motion.div
            whileHover={{ x: 3 }}
            className={`px-4 py-3 rounded-xl flex items-center gap-3 transition-colors cursor-pointer ${
              pathname === '/settings'
                ? 'bg-[#6b8dd6] text-white'
                : 'text-[#4a5a8a] hover:bg-[#eef2ff] hover:text-[#1a1e5e]'
            }`}
          >
            <Settings className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span className="whitespace-nowrap font-medium">Настройки</span>}
          </motion.div>
        </Link>

        {userRole === 'admin' && (
          <Link href="/admin" onClick={onLinkClick}>
            <motion.div
              whileHover={{ x: 3 }}
              className={`px-4 py-3 rounded-xl flex items-center gap-3 transition-colors cursor-pointer ${
                pathname.startsWith('/admin')
                  ? 'bg-amber-100 text-amber-700'
                  : 'text-amber-600 hover:bg-amber-50'
              }`}
            >
              <ShieldCheck className="w-5 h-5 flex-shrink-0" />
              {!collapsed && <span className="whitespace-nowrap font-medium">Админ-панель</span>}
            </motion.div>
          </Link>
        )}

        <button
          onClick={() => signOut({ callbackUrl: '/login' })}
          className="w-full px-4 py-3 rounded-xl flex items-center gap-3 text-red-400 hover:bg-red-50 transition-colors"
        >
          <LogOut className="w-5 h-5 flex-shrink-0" />
          {!collapsed && <span className="whitespace-nowrap font-medium">Выход</span>}
        </button>

        {!collapsed && (
          <div className="mt-3 p-3 bg-[#eef2ff] rounded-xl">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 bg-[#6b8dd6] rounded-full flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-bold">{userInitial}</span>
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-[#1a1e5e] truncate">{userName}</p>
                <p className="text-xs text-[#4a5a8a] truncate">{userEmail}</p>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

function Logo({ collapsed, onClick }: { collapsed: boolean; onClick?: () => void }) {
  return (
    <div className="p-5 border-b border-[#6b8dd6]/10">
      <motion.div whileHover={{ scale: 1.03 }} onClick={onClick} className="flex items-center gap-3 cursor-pointer">
        <div className="w-10 h-10 flex-shrink-0">
          <Image src="/vector 7.png" alt="HealthTrack" width={40} height={40} className="w-full h-full object-contain" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden"
            >
              <div className="flex flex-col leading-tight">
                <span className="font-semibold text-[#1a1e5e] text-base leading-none whitespace-nowrap">Health</span>
                <span className="font-semibold text-[#6b8dd6] text-base leading-none whitespace-nowrap">Track</span>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}

export function Sidebar() {
  const [collapsed,  setCollapsed]  = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const onResize = () => { if (window.innerWidth >= 768) setMobileOpen(false); };
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  return (
    <>
      {/* Десктоп */}
      <motion.aside
        initial={false}
        animate={{ width: collapsed ? 80 : 260 }}
        transition={{ duration: 0.3, ease: 'easeInOut' }}
        className="hidden md:flex flex-col bg-white border-r border-[#6b8dd6]/15 h-screen sticky top-0 flex-shrink-0 z-40 shadow-sm"
      >
        <Logo collapsed={collapsed} onClick={() => setCollapsed(!collapsed)} />
        <NavContent collapsed={collapsed} />
      </motion.aside>

      {/* Мобильный хедер */}
      <header className="md:hidden fixed top-0 inset-x-0 z-50 bg-white border-b border-[#6b8dd6]/15 px-4 h-14 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-2">
          <Image src="/vector 7.png" alt="HealthTrack" width={32} height={32} className="w-8 h-8 object-contain" />
          <div className="flex flex-col leading-tight">
            <span className="font-semibold text-[#1a1e5e] text-sm leading-none">Health</span>
            <span className="font-semibold text-[#6b8dd6] text-sm leading-none">Track</span>
          </div>
        </div>
        <button onClick={() => setMobileOpen(true)} className="p-2 text-[#4a5a8a] hover:text-[#1a1e5e] transition-colors">
          <Menu className="w-5 h-5" />
        </button>
      </header>

      {/* Мобильный drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={() => setMobileOpen(false)}
              className="md:hidden fixed inset-0 bg-black/30 backdrop-blur-sm z-50"
            />
            <motion.div
              initial={{ x: '-100%' }} animate={{ x: 0 }} exit={{ x: '-100%' }}
              transition={{ type: 'spring', stiffness: 300, damping: 35 }}
              className="md:hidden fixed left-0 top-0 bottom-0 w-72 z-50 bg-white border-r border-[#6b8dd6]/15 flex flex-col shadow-xl"
            >
              <div className="p-5 border-b border-[#6b8dd6]/10 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Image src="/vector 7.png" alt="HealthTrack" width={36} height={36} className="w-9 h-9 object-contain" />
                  <div className="flex flex-col leading-tight">
                    <span className="font-semibold text-[#1a1e5e] text-base leading-none">Health</span>
                    <span className="font-semibold text-[#6b8dd6] text-base leading-none">Track</span>
                  </div>
                </div>
                <button onClick={() => setMobileOpen(false)} className="p-1.5 rounded-lg text-[#4a5a8a] hover:text-[#1a1e5e] hover:bg-[#eef2ff] transition-colors">
                  <X className="w-4 h-4" />
                </button>
              </div>
              <NavContent collapsed={false} onLinkClick={() => setMobileOpen(false)} />
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
