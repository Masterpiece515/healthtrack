'use client';

import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSession } from 'next-auth/react';
import { Users, Trash2, ShieldCheck, ShieldOff, Search, Eye } from '@/components/icons';
import Link from 'next/link';

interface AdminUser {
  id:           string;
  name:         string;
  email:        string;
  role:         string;
  createdAt:    string;
  entriesCount: number;
}

function RoleBadge({ role }: { role: string }) {
  return role === 'admin' ? (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                     bg-amber-500/20 text-amber-300 border border-amber-500/30">
      <ShieldCheck className="w-3 h-3" />
      Админ
    </span>
  ) : (
    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium
                     bg-white/10 text-white/60 border border-white/10">
      Пользователь
    </span>
  );
}

export default function AdminUsersPage() {
  const { data: session } = useSession();
  const currentUserId = (session?.user as { id?: string })?.id;

  const [users,   setUsers]   = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState<string | null>(null);
  const [search,  setSearch]  = useState('');
  const [confirm, setConfirm] = useState<string | null>(null); // userId to delete

  useEffect(() => {
    fetch('/api/admin/users')
      .then(r => r.json())
      .then(data => {
        if (Array.isArray(data)) setUsers(data);
        else setError(data.error ?? 'Ошибка загрузки');
      })
      .catch(() => setError('Не удалось загрузить пользователей'))
      .finally(() => setLoading(false));
  }, []);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/admin/users/${id}`, { method: 'DELETE' });
    if (res.ok || res.status === 204) {
      setUsers(prev => prev.filter(u => u.id !== id));
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? 'Ошибка удаления');
    }
    setConfirm(null);
  }

  async function handleToggleRole(user: AdminUser) {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    const res = await fetch(`/api/admin/users/${user.id}`, {
      method:  'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ role: newRole }),
    });
    if (res.ok) {
      setUsers(prev => prev.map(u => u.id === user.id ? { ...u, role: newRole } : u));
    } else {
      const data = await res.json().catch(() => ({}));
      alert(data.error ?? 'Ошибка изменения роли');
    }
  }

  const filtered = users.filter(u =>
    u.name.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* Заголовок */}
      <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex items-center gap-3 mb-1">
          <Users className="w-7 h-7 text-amber-400" />
          <h1 className="text-2xl font-bold text-white">Пользователи</h1>
        </div>
        <p className="text-white/40 text-sm">Управление аккаунтами и ролями</p>
      </motion.div>

      {/* Поиск */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="relative"
      >
        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
        <input
          type="text"
          placeholder="Поиск по имени или email..."
          value={search}
          onChange={e => setSearch(e.target.value)}
          className="w-full bg-white/5 border border-white/10 rounded-xl pl-10 pr-4 py-3
                     text-white placeholder:text-white/30 outline-none focus:border-amber-500/50
                     focus:ring-1 focus:ring-amber-500/20 transition-all"
        />
      </motion.div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 rounded-xl p-4">
          {error}
        </div>
      )}

      {loading ? (
        <div className="flex justify-center py-16">
          <div className="w-8 h-8 border-2 border-amber-400/30 border-t-amber-400 rounded-full animate-spin" />
        </div>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.15 }}
          className="bg-white/5 border border-white/10 rounded-2xl overflow-hidden"
        >
          {/* Таблица */}
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/10">
                  <th className="text-left text-white/40 font-medium px-5 py-4">Пользователь</th>
                  <th className="text-left text-white/40 font-medium px-5 py-4 hidden sm:table-cell">Роль</th>
                  <th className="text-left text-white/40 font-medium px-5 py-4 hidden md:table-cell">Записей</th>
                  <th className="text-left text-white/40 font-medium px-5 py-4 hidden lg:table-cell">Дата регистрации</th>
                  <th className="text-right text-white/40 font-medium px-5 py-4">Действия</th>
                </tr>
              </thead>
              <tbody>
                <AnimatePresence>
                  {filtered.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="text-center text-white/30 py-12">
                        Пользователи не найдены
                      </td>
                    </tr>
                  ) : (
                    filtered.map((user, i) => (
                      <motion.tr
                        key={user.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0, x: 10 }}
                        transition={{ delay: i * 0.03 }}
                        className="border-b border-white/5 hover:bg-white/5 transition-colors"
                      >
                        {/* Пользователь */}
                        <td className="px-5 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-gradient-to-br from-[#6b8dd6] to-[#93b4e8]
                                            flex items-center justify-center flex-shrink-0">
                              <span className="text-white text-sm font-bold">
                                {user.name.charAt(0).toUpperCase()}
                              </span>
                            </div>
                            <div>
                              <p className="text-white font-medium leading-tight">
                                {user.name}
                                {user.id === currentUserId && (
                                  <span className="ml-2 text-xs text-amber-400/70">(вы)</span>
                                )}
                              </p>
                              <p className="text-white/40 text-xs">{user.email}</p>
                            </div>
                          </div>
                        </td>

                        {/* Роль */}
                        <td className="px-5 py-4 hidden sm:table-cell">
                          <RoleBadge role={user.role} />
                        </td>

                        {/* Кол-во записей */}
                        <td className="px-5 py-4 hidden md:table-cell">
                          <span className="text-white/60">{user.entriesCount}</span>
                        </td>

                        {/* Дата */}
                        <td className="px-5 py-4 hidden lg:table-cell">
                          <span className="text-white/40">
                            {new Date(user.createdAt).toLocaleDateString('ru-RU')}
                          </span>
                        </td>

                        {/* Действия */}
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            {/* Просмотр */}
                            <Link
                              href={`/admin/users/${user.id}`}
                              title="Просмотр пользователя"
                              className="p-2 rounded-lg text-white/40 hover:text-blue-400 hover:bg-blue-500/10 transition-colors"
                            >
                              <Eye className="w-4 h-4" />
                            </Link>

                            {user.id !== currentUserId && (
                              <>
                                {/* Переключить роль */}
                                <button
                                  onClick={() => handleToggleRole(user)}
                                  title={user.role === 'admin' ? 'Снять права админа' : 'Назначить админом'}
                                  className="p-2 rounded-lg text-white/40 hover:text-amber-400 hover:bg-amber-500/10 transition-colors"
                                >
                                  {user.role === 'admin'
                                    ? <ShieldOff className="w-4 h-4" />
                                    : <ShieldCheck className="w-4 h-4" />
                                  }
                                </button>

                                {/* Удалить */}
                                <button
                                  onClick={() => setConfirm(user.id)}
                                  title="Удалить пользователя"
                                  className="p-2 rounded-lg text-white/40 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" />
                                </button>
                              </>
                            )}
                          </div>
                        </td>
                      </motion.tr>
                    ))
                  )}
                </AnimatePresence>
              </tbody>
            </table>
          </div>

          {/* Итог */}
          <div className="px-5 py-3 border-t border-white/5 text-white/30 text-xs">
            Показано: {filtered.length} из {users.length}
          </div>
        </motion.div>
      )}

      {/* Диалог подтверждения удаления */}
      <AnimatePresence>
        {confirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
              onClick={() => setConfirm(null)}
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="fixed inset-0 flex items-center justify-center z-50 p-4"
            >
              <div className="bg-[#1A1A2E] border border-white/10 rounded-2xl p-6 max-w-sm w-full shadow-2xl">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-10 h-10 bg-red-500/20 rounded-xl flex items-center justify-center">
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </div>
                  <div>
                    <h3 className="text-white font-semibold">Удалить пользователя?</h3>
                    <p className="text-white/40 text-sm">Это действие необратимо</p>
                  </div>
                </div>
                <p className="text-white/60 text-sm mb-6">
                  Все данные пользователя, включая записи о здоровье и цели, будут удалены.
                </p>
                <div className="flex gap-3">
                  <button
                    onClick={() => setConfirm(null)}
                    className="flex-1 px-4 py-2.5 rounded-xl border border-white/10 text-white/70
                               hover:bg-white/5 transition-colors text-sm font-medium"
                  >
                    Отмена
                  </button>
                  <button
                    onClick={() => handleDelete(confirm)}
                    className="flex-1 px-4 py-2.5 rounded-xl bg-red-500 hover:bg-red-600
                               text-white transition-colors text-sm font-medium"
                  >
                    Удалить
                  </button>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}
