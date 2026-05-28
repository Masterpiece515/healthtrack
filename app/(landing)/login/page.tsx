'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect } from 'react';
import { authErrorMessage } from '@/lib/auth-error-messages';
import { signIn } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, Loader2, CheckCircle2, Activity, BarChart3, Brain } from '@/components/icons';
import Image from 'next/image';
import Link from 'next/link';

export default function LoginPage() {
  const router = useRouter();
  const [email,         setEmail]         = useState('');
  const [password,      setPassword]      = useState('');
  const [showPw,        setShowPw]        = useState(false);
  const [loading,       setLoading]       = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error,         setError]         = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const code = params.get('error');
    if (code) {
      setError(authErrorMessage(code));
      window.history.replaceState({}, '', '/login');
    }
  }, []);

  const handleSubmit = async (e: { preventDefault(): void }) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    try {
      const res = await signIn('credentials', { email, password, redirect: false });
      if (res?.ok) {
        router.push('/dashboard');
        router.refresh();
      } else {
        const msg =
          res?.error === 'CredentialsSignin'
            ? 'Неверный email или пароль. Если входили через Google — используйте «Войти через Google».'
            : 'Неверный email или пароль';
        setError(msg);
      }
    } catch {
      setError('Ошибка сети или сервера. Попробуйте ещё раз.');
    } finally {
      setLoading(false);
    }
  };

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setError('');
    await signIn('google', { callbackUrl: '/dashboard' });
  };

  return (
    <div className="min-h-screen flex">
      {/* ── Левая панель — форма ── */}
      <div className="flex-1 bg-[#f5f8ff] flex items-center justify-center p-6 sm:p-10 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-72 h-72 bg-[#6b8dd6]/8 rounded-full blur-[100px] pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-60 h-60 bg-[#6b8dd6]/6 rounded-full blur-[80px] pointer-events-none" />

        <motion.div
          initial={{ opacity: 0, x: -24 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="relative z-10 w-full max-w-md"
        >
          {/* Логотип */}
          <div className="mb-8">
            <Link href="/" className="inline-flex items-center gap-3">
              <Image src="/vector 7.png" alt="HealthTrack" width={44} height={44} className="w-11 h-11 object-contain" loading="eager" />
              <div className="flex flex-col leading-tight">
                <span className="font-bold text-[#1a1e5e] text-xl leading-none">Health</span>
                <span className="font-bold text-[#6b8dd6] text-xl leading-none">Track</span>
              </div>
            </Link>
            <h1 className="text-2xl font-bold text-[#1a1e5e] mt-6 mb-1">Добро пожаловать!</h1>
            <p className="text-[#4a5a8a] text-sm">Войдите, чтобы продолжить</p>
          </div>

          <div className="bg-white rounded-3xl p-7 shadow-sm border border-[#6b8dd6]/10">
            {/* Google */}
            <motion.button
              type="button"
              onClick={handleGoogle}
              disabled={googleLoading || loading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-3 py-3 px-4 bg-white border border-[#6b8dd6]/20 text-[#1a1e5e] font-semibold rounded-xl shadow-sm hover:bg-[#f5f8ff] transition-colors disabled:opacity-60 mb-5"
            >
              {googleLoading ? <Loader2 className="w-4 h-4 animate-spin text-[#6b8dd6]" /> : (
                <svg className="w-5 h-5" viewBox="0 0 24 24">
                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
              )}
              {googleLoading ? 'Перенаправление...' : 'Войти через Google'}
            </motion.button>

            <div className="flex items-center gap-3 mb-5">
              <div className="flex-1 h-px bg-[#6b8dd6]/10" />
              <span className="text-xs text-[#4a5a8a]">или</span>
              <div className="flex-1 h-px bg-[#6b8dd6]/10" />
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#1a1e5e]">Email</label>
                <input type="email" value={email} onChange={e => setEmail(e.target.value)} required
                  placeholder="your@email.com" className={inputClass} />
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-medium text-[#1a1e5e]">Пароль</label>
                <div className="relative">
                  <input type={showPw ? 'text' : 'password'} value={password} onChange={e => setPassword(e.target.value)}
                    required placeholder="••••••••" className={`${inputClass} pr-11`} />
                  <button type="button" onClick={() => setShowPw(!showPw)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#4a5a8a] hover:text-[#1a1e5e] transition-colors">
                    {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {error && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                  className="text-red-500 text-sm text-center bg-red-50 border border-red-200 rounded-xl py-2.5 px-4">
                  {error}
                </motion.p>
              )}

              <motion.button type="submit" disabled={loading || googleLoading}
                whileHover={!loading ? { scale: 1.02 } : {}} whileTap={!loading ? { scale: 0.98 } : {}}
                className="w-full py-3 bg-[#6b8dd6] hover:bg-[#5a7cc5] text-white font-semibold rounded-full shadow-sm disabled:opacity-60 flex items-center justify-center gap-2 transition-colors">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {loading ? 'Входим...' : 'Войти'}
              </motion.button>
            </form>

            <p className="mt-5 text-center text-sm text-[#4a5a8a]">
              Нет аккаунта?{' '}
              <Link href="/register" className="text-[#6b8dd6] hover:text-[#5a7cc5] font-medium transition-colors">
                Зарегистрироваться
              </Link>
            </p>
          </div>

          <p className="text-center mt-5 text-[#4a5a8a] text-sm">
            <Link href="/" className="hover:text-[#1a1e5e] transition-colors">← Вернуться на главную</Link>
          </p>
        </motion.div>
      </div>

      {/* ── Правая панель — CTA (скрыта на мобильных) ── */}
      <motion.div
        initial={{ opacity: 0, x: 40 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.6 }}
        className="hidden lg:flex w-[480px] xl:w-[520px] bg-gradient-to-br from-[#1a1e5e] via-[#2a3080] to-[#4a5a8a] flex-col items-center justify-center p-12 relative overflow-hidden"
      >
        {/* Декоративные круги */}
        <div className="absolute top-[-60px] right-[-60px] w-64 h-64 bg-white/5 rounded-full" />
        <div className="absolute bottom-[-80px] left-[-40px] w-80 h-80 bg-[#6b8dd6]/20 rounded-full" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-[#6b8dd6]/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10 text-center max-w-sm">
          {/* Иллюстрация */}
          <div className="mb-8 flex justify-center">
            <HealthIllustration />
          </div>

          <h2 className="text-3xl font-bold text-white mb-3 leading-tight">
            Начни следить за<br />своим здоровьем!
          </h2>
          <p className="text-[#c5d3f0] text-sm mb-8 leading-relaxed">
            Присоединяйтесь к тысячам людей, которые уже улучшили своё здоровье с HealthTrack
          </p>

          {/* Преимущества */}
          <div className="space-y-3 mb-10 text-left">
            {[
              { icon: Activity,  text: 'Отслеживай шаги, сон и пульс каждый день' },
              { icon: BarChart3, text: 'Умная аналитика и персональные тренды' },
              { icon: Brain,     text: 'AI-рекомендации на основе твоих данных' },
            ].map(({ icon: Icon, text }) => (
              <div key={text} className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center shrink-0">
                  <Icon className="w-4 h-4 text-[#93b4e8]" />
                </div>
                <span className="text-white/85 text-sm">{text}</span>
              </div>
            ))}
          </div>

          {/* Кнопка регистрации */}
          <Link href="/register">
            <motion.div
              whileHover={{ scale: 1.04 }}
              whileTap={{ scale: 0.97 }}
              className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-white text-[#1a1e5e] font-bold rounded-full shadow-lg hover:bg-[#f5f8ff] transition-colors cursor-pointer"
            >
              <CheckCircle2 className="w-5 h-5 text-[#6b8dd6]" />
              Создать бесплатный аккаунт
            </motion.div>
          </Link>

          <p className="text-white/40 text-xs mt-4">Регистрация бесплатна. Без подписок.</p>
        </div>
      </motion.div>
    </div>
  );
}

function HealthIllustration() {
  return (
    <svg width="200" height="180" viewBox="0 0 200 180" fill="none" xmlns="http://www.w3.org/2000/svg">
      {/* Фон-круг */}
      <circle cx="100" cy="90" r="80" fill="white" fillOpacity="0.06" />
      <circle cx="100" cy="90" r="60" fill="white" fillOpacity="0.05" />

      {/* Фигура человека */}
      <circle cx="100" cy="52" r="18" fill="#93b4e8" fillOpacity="0.9" />
      <path d="M72 110 Q72 80 100 80 Q128 80 128 110 L124 140 H76 Z" fill="#6b8dd6" fillOpacity="0.85" />

      {/* Руки */}
      <path d="M76 90 Q58 95 52 112" stroke="#93b4e8" strokeWidth="6" strokeLinecap="round" />
      <path d="M124 90 Q142 95 148 112" stroke="#93b4e8" strokeWidth="6" strokeLinecap="round" />

      {/* Ноги */}
      <path d="M83 140 L78 168" stroke="#6b8dd6" strokeWidth="6" strokeLinecap="round" />
      <path d="M117 140 L122 168" stroke="#6b8dd6" strokeWidth="6" strokeLinecap="round" />

      {/* Сердцебиение */}
      <path d="M30 90 L42 90 L50 72 L58 108 L66 82 L72 90 L170 90" stroke="#4ade80" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

      {/* Звёздочки / блики */}
      <circle cx="160" cy="40" r="4" fill="white" fillOpacity="0.4" />
      <circle cx="40" cy="140" r="3" fill="white" fillOpacity="0.3" />
      <circle cx="170" cy="130" r="5" fill="#93b4e8" fillOpacity="0.3" />
    </svg>
  );
}

const inputClass = 'w-full px-4 py-3 bg-[#f5f8ff] border border-[#6b8dd6]/20 rounded-xl text-[#1a1e5e] text-sm placeholder:text-[#c5d3f0] focus:outline-none focus:border-[#6b8dd6] focus:ring-2 focus:ring-[#6b8dd6]/15 transition-colors';
