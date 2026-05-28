'use client';

export const dynamic = 'force-dynamic';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion } from 'framer-motion';
import { signOut } from 'next-auth/react';
import {
  User, Lock, Trash2, LogOut, Check, Loader2,
  ShieldAlert, Eye, EyeOff, Upload, RefreshCw,
  Link2, Link2Off, FileText, Activity,
} from '@/components/icons';
import { useToast } from '@/lib/toast-context';

interface UserData {
  id: string;
  name: string;
  email: string;
  createdAt: string;
}

interface Section {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
}

function Card({ title, icon: Icon, children }: Section) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      className="bg-white rounded-3xl p-6 border border-[#c5d3f0]/20 shadow-sm"
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 bg-[#6b8dd6]/10 rounded-xl flex items-center justify-center">
          <Icon className="w-5 h-5 text-[#6b8dd6]" />
        </div>
        <h2 className="text-lg font-bold text-[#1a1e5e]">{title}</h2>
      </div>
      {children}
    </motion.div>
  );
}

export default function SettingsPage() {
  const { toast } = useToast();

  const [user,    setUser]    = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);

  // CSV импорт
  const fileRef        = useRef<HTMLInputElement>(null);
  const [csvLoading,   setCsvLoading]   = useState(false);
  const [csvResult,    setCsvResult]    = useState<{ imported: number; skipped: number } | null>(null);

  // Fitbit
  const [gfConnected,  setGfConnected]  = useState(false);
  const [gfSyncing,    setGfSyncing]    = useState(false);
  const [gfResult,     setGfResult]     = useState('');

  // Профиль
  const [name,  setName]  = useState('');
  const [email, setEmail] = useState('');
  const [savingProfile, setSavingProfile] = useState(false);

  // Пароль
  const [currentPw, setCurrentPw] = useState('');
  const [newPw,     setNewPw]     = useState('');
  const [showCurrent, setShowCurrent] = useState(false);
  const [showNew,     setShowNew]     = useState(false);
  const [savingPw,  setSavingPw]  = useState(false);

  // Удаление
  const [confirmDelete, setConfirmDelete] = useState('');
  const [deleting,      setDeleting]      = useState(false);

  const checkFitbit = useCallback(async () => {
    try {
      const res  = await fetch('/api/integrations/fitbit/sync');
      const data = await res.json();
      setGfConnected(data.connected ?? false);
    } catch { /* ignore */ }
  }, []);

  useEffect(() => {
    fetch('/api/settings')
      .then(async r => {
        const d = await r.json();
        if (!r.ok) throw Object.assign(new Error(d.error ?? ''), { status: r.status });
        return d;
      })
      .then(d => {
        setUser(d.user);
        setName(d.user.name);
        setEmail(d.user.email);
      })
      .catch((e: unknown) => {
        // 401 сразу после OAuth-редиректа — сессия ещё устанавливается, не показываем ошибку
        const status = (e as { status?: number })?.status;
        if (status !== 401) toast('Ошибка загрузки настроек', 'error');
      })
      .finally(() => setLoading(false));

    checkFitbit();

    // Подключение только сохраняет токены — данные подтягиваются отдельным POST /sync
    const params = new URLSearchParams(window.location.search);
    if (params.get('integration') === 'success') {
      toast('Google Health подключён, загружаем данные…', 'success');
      setGfConnected(true);
      window.history.replaceState({}, '', '/settings');
      fetch('/api/integrations/fitbit/sync', { method: 'POST' })
        .then(async (res) => {
          const data = await res.json();
          if (!res.ok) {
            toast(data.error ?? 'Не удалось загрузить данные из Fitbit', 'error');
            return;
          }
          setGfResult(data.message ?? '');
          toast(data.message ?? 'Данные синхронизированы', 'success');
        })
        .catch(() => toast('Ошибка синхронизации Fitbit', 'error'));
    } else if (params.get('integration') === 'error') {
      toast('Ошибка подключения Fitbit', 'error');
      window.history.replaceState({}, '', '/settings');
    }
  }, [toast, checkFitbit]);

  const handleCsvImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvLoading(true);
    setCsvResult(null);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res  = await fetch('/api/import/csv', { method: 'POST', body: fd });
      const data = await res.json();
      if (!res.ok) { toast(data.error ?? 'Ошибка импорта', 'error'); return; }
      setCsvResult({ imported: data.imported, skipped: data.skipped });
      toast(`Импортировано ${data.imported} записей`, 'success');
    } catch {
      toast('Ошибка импорта', 'error');
    } finally {
      setCsvLoading(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  };

  const syncFitbit = async () => {
    setGfSyncing(true);
    setGfResult('');
    try {
      const res  = await fetch('/api/integrations/fitbit/sync', { method: 'POST' });
      const data = await res.json();
      if (!res.ok) { toast(data.error ?? 'Ошибка синхронизации', 'error'); return; }
      setGfResult(data.message ?? '');
      toast(data.message ?? 'Синхронизировано', 'success');
    } catch {
      toast('Ошибка синхронизации', 'error');
    } finally {
      setGfSyncing(false);
    }
  };

  const saveProfile = async () => {
    setSavingProfile(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update_profile', name, email }),
      });
      const data = await res.json();
      if (!res.ok) { toast(data.error ?? 'Ошибка', 'error'); return; }
      toast('Профиль обновлён', 'success');
      setUser(prev => prev ? { ...prev, name, email } : prev);
    } finally {
      setSavingProfile(false);
    }
  };

  const savePassword = async () => {
    if (!currentPw || !newPw) { toast('Заполните все поля', 'error'); return; }
    if (newPw.length < 6) { toast('Пароль: минимум 6 символов', 'error'); return; }
    setSavingPw(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'change_password', currentPassword: currentPw, newPassword: newPw }),
      });
      const data = await res.json();
      if (!res.ok) { toast(data.error ?? 'Ошибка', 'error'); return; }
      toast('Пароль изменён', 'success');
      setCurrentPw('');
      setNewPw('');
    } finally {
      setSavingPw(false);
    }
  };

  const deleteAccount = async () => {
    if (confirmDelete !== 'УДАЛИТЬ') { toast('Введите УДАЛИТЬ для подтверждения', 'error'); return; }
    setDeleting(true);
    try {
      const res = await fetch('/api/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'delete_account' }),
      });
      if (!res.ok) { toast('Ошибка удаления', 'error'); setDeleting(false); return; }
      await signOut({ callbackUrl: '/' });
    } catch {
      toast('Ошибка удаления', 'error');
      setDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        {[...Array(3)].map((_, i) => (
          <div key={i} className="bg-white rounded-3xl h-48 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Заголовок */}
      <motion.div initial={{ opacity: 0, y: -16 }} animate={{ opacity: 1, y: 0 }}>
        <h1 className="text-3xl font-bold text-[#1a1e5e] mb-1">Настройки</h1>
        <p className="text-[#4a5a8a]">Управление профилем и аккаунтом</p>
      </motion.div>

      {/* Профиль */}
      <Card title="Профиль" icon={User}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[#4a5a8a] mb-1.5 block">Имя</label>
            <input
              value={name}
              onChange={e => setName(e.target.value)}
              className="w-full px-4 py-3 sm:py-2.5 bg-white border border-[#c5d3f0]/40 rounded-xl
                         text-[#1a1e5e] text-sm focus:outline-none focus:border-[#6b8dd6] transition-colors"
            />
          </div>
          <div>
            <label className="text-sm font-medium text-[#4a5a8a] mb-1.5 block">Email</label>
            <input
              type="email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="w-full px-4 py-3 sm:py-2.5 bg-white border border-[#c5d3f0]/40 rounded-xl
                         text-[#1a1e5e] text-sm focus:outline-none focus:border-[#6b8dd6] transition-colors"
            />
          </div>
          <div className="text-xs text-[#c5d3f0]">
            Аккаунт создан: {user ? new Date(user.createdAt).toLocaleDateString('ru-RU') : '—'}
          </div>
          <motion.button
            onClick={saveProfile}
            disabled={savingProfile}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#6b8dd6] hover:bg-[#6b8dd6]/90
                       text-white font-medium rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            {savingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
            {savingProfile ? 'Сохранение...' : 'Сохранить'}
          </motion.button>
        </div>
      </Card>

      {/* Смена пароля */}
      <Card title="Смена пароля" icon={Lock}>
        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium text-[#4a5a8a] mb-1.5 block">Текущий пароль</label>
            <div className="relative">
              <input
                type={showCurrent ? 'text' : 'password'}
                value={currentPw}
                onChange={e => setCurrentPw(e.target.value)}
                placeholder="••••••••"
                className="w-full px-4 py-3 sm:py-2.5 pr-10 bg-white border border-[#c5d3f0]/40 rounded-xl
                           text-[#1a1e5e] text-sm focus:outline-none focus:border-[#6b8dd6] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowCurrent(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c5d3f0] hover:text-[#4a5a8a] transition-colors"
              >
                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <div>
            <label className="text-sm font-medium text-[#4a5a8a] mb-1.5 block">Новый пароль</label>
            <div className="relative">
              <input
                type={showNew ? 'text' : 'password'}
                value={newPw}
                onChange={e => setNewPw(e.target.value)}
                placeholder="Минимум 6 символов"
                className="w-full px-4 py-3 sm:py-2.5 pr-10 bg-white border border-[#c5d3f0]/40 rounded-xl
                           text-[#1a1e5e] text-sm focus:outline-none focus:border-[#6b8dd6] transition-colors"
              />
              <button
                type="button"
                onClick={() => setShowNew(v => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-[#c5d3f0] hover:text-[#4a5a8a] transition-colors"
              >
                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>
          <motion.button
            onClick={savePassword}
            disabled={savingPw}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="flex items-center gap-2 px-5 py-2.5 bg-[#1a1e5e] hover:bg-[#1a1e5e]
                       text-white font-medium rounded-xl text-sm transition-colors disabled:opacity-60"
          >
            {savingPw ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
            {savingPw ? 'Сохранение...' : 'Изменить пароль'}
          </motion.button>
        </div>
      </Card>

      {/* Выход */}
      <Card title="Сессия" icon={LogOut}>
        <p className="text-sm text-[#4a5a8a] mb-4">
          Выйти из аккаунта на этом устройстве. Ваши данные останутся сохранены.
        </p>
        <motion.button
          onClick={() => signOut({ callbackUrl: '/login' })}
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          className="flex items-center gap-2 px-5 py-2.5 bg-[#c5d3f0]/20 hover:bg-[#c5d3f0]/30
                     text-[#4a5a8a] font-medium rounded-xl text-sm transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Выйти из аккаунта
        </motion.button>
      </Card>

      {/* Интеграции */}
      <Card title="Интеграции" icon={Link2}>
        <div className="space-y-6">

          {/* CSV импорт */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <FileText className="w-4 h-4 text-[#6b8dd6]" />
              <h3 className="text-sm font-semibold text-[#1a1e5e]">Импорт из CSV</h3>
            </div>
            <p className="text-xs text-[#4a5a8a] mb-3">
              Загрузите файл из Samsung Health, Garmin, Fitbit или любого другого приложения.
              Поддерживаемые колонки: <span className="font-mono">date, steps, sleep_hours, heart_rate, weight, calories</span>
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              <input
                ref={fileRef}
                type="file"
                accept=".csv"
                onChange={handleCsvImport}
                className="hidden"
              />
              <motion.button
                onClick={() => fileRef.current?.click()}
                disabled={csvLoading}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5
                           bg-[#6b8dd6]/15 hover:bg-[#6b8dd6]/25 text-[#6b8dd6]
                           font-medium rounded-xl text-sm transition-colors disabled:opacity-60"
              >
                {csvLoading
                  ? <Loader2 className="w-4 h-4 animate-spin" />
                  : <Upload className="w-4 h-4" />
                }
                {csvLoading ? 'Импорт...' : 'Выбрать CSV файл'}
              </motion.button>
              {csvResult && (
                <p className="text-sm text-[#4a5a8a]">
                  ✓ Добавлено: <span className="font-semibold text-[#1a1e5e]">{csvResult.imported}</span>
                  {' · '}Пропущено: {csvResult.skipped}
                </p>
              )}
            </div>
          </div>

          <div className="border-t border-[#c5d3f0]/20" />

          {/* Google Health */}
          <div>
            <div className="flex items-center gap-2 mb-1">
              <Activity className="w-5 h-5 text-[#4285F4]" />
              <h3 className="text-sm font-semibold text-[#1a1e5e]">Google Health</h3>
              {gfConnected && (
                <span className="px-2 py-0.5 bg-green-500/15 text-green-600 text-xs rounded-full font-medium">
                  Подключён
                </span>
              )}
            </div>
            <p className="text-xs text-[#4a5a8a] mb-3">
              Синхронизирует шаги, сон, пульс и вес из Google Health (Fitbit) за последние 30 дней.
              Нужно включить <span className="font-mono">Google Health API</span> в Google Cloud Console
              и добавить health-scopes в OAuth consent screen.
            </p>
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
              {!gfConnected ? (
                <motion.a
                  href="/api/integrations/fitbit/connect"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                  className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5
                             bg-[#4285F4]/15 hover:bg-[#4285F4]/25 text-[#4285F4]
                             font-medium rounded-xl text-sm transition-colors"
                >
                  <Link2 className="w-4 h-4" />
                  Подключить Google Health
                </motion.a>
              ) : (
                <>
                  <motion.button
                    onClick={syncFitbit}
                    disabled={gfSyncing}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5
                               bg-[#4285F4]/15 hover:bg-[#4285F4]/25 text-[#4285F4]
                               font-medium rounded-xl text-sm transition-colors disabled:opacity-60"
                  >
                    {gfSyncing
                      ? <Loader2 className="w-4 h-4 animate-spin" />
                      : <RefreshCw className="w-4 h-4" />
                    }
                    {gfSyncing ? 'Синхронизация...' : 'Синхронизировать'}
                  </motion.button>
                  <motion.a
                    href="/api/integrations/fitbit/connect"
                    whileHover={{ scale: 1.02 }}
                    className="flex items-center justify-center gap-2 px-4 py-3 sm:py-2.5
                               bg-[#c5d3f0]/15 hover:bg-[#c5d3f0]/25 text-[#4a5a8a]
                               font-medium rounded-xl text-sm transition-colors"
                  >
                    <Link2Off className="w-4 h-4" />
                    Переподключить
                  </motion.a>
                </>
              )}
              {gfResult && (
                <p className="text-sm text-green-600">✓ {gfResult}</p>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Danger zone */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="bg-red-500/5 rounded-3xl p-6 border border-red-500/20"
      >
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 bg-red-500/10 rounded-xl flex items-center justify-center">
            <ShieldAlert className="w-5 h-5 text-red-500" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-red-600">Опасная зона</h2>
            <p className="text-xs text-red-400">Необратимые действия</p>
          </div>
        </div>
        <p className="text-sm text-[#4a5a8a] mb-4">
          Удаление аккаунта безвозвратно удалит все ваши данные: записи здоровья, цели, рекомендации.
          Для подтверждения введите <span className="font-mono font-bold text-red-500">УДАЛИТЬ</span>.
        </p>
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          <input
            value={confirmDelete}
            onChange={e => setConfirmDelete(e.target.value)}
            placeholder="УДАЛИТЬ"
            className="flex-1 sm:flex-none sm:w-40 px-4 py-3 sm:py-2.5 bg-white border border-red-300 rounded-xl text-sm
                       text-[#1a1e5e] focus:outline-none focus:border-red-500 transition-colors"
          />
          <motion.button
            onClick={deleteAccount}
            disabled={deleting || confirmDelete !== 'УДАЛИТЬ'}
            whileHover={confirmDelete === 'УДАЛИТЬ' ? { scale: 1.02 } : {}}
            whileTap={confirmDelete === 'УДАЛИТЬ' ? { scale: 0.98 } : {}}
            className="flex items-center justify-center gap-2 px-5 py-3 sm:py-2.5 bg-red-500 hover:bg-red-600
                       text-white font-medium rounded-xl text-sm transition-colors
                       disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            {deleting ? 'Удаление...' : 'Удалить аккаунт'}
          </motion.button>
        </div>
      </motion.div>
    </div>
  );
}
