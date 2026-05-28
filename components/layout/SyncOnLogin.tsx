'use client';

import { useEffect, useRef } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/lib/toast-context';

/**
 * Запускает фоновую синхронизацию Fitbit один раз за браузерную сессию
 * сразу после того, как пользователь вошёл в аккаунт.
 */
export function SyncOnLogin() {
  const { data: session, status } = useSession();
  const { toast } = useToast();
  const didSync = useRef(false);

  useEffect(() => {
    if (status !== 'authenticated' || !session?.user) return;
    if (didSync.current) return;

    const userId = (session.user as { id?: string }).id;
    if (!userId) return;

    const storageKey = `ht_synced_${userId}`;
    if (sessionStorage.getItem(storageKey)) return;

    didSync.current = true;
    sessionStorage.setItem(storageKey, '1');

    async function run() {
      try {
        // Проверяем подключён ли Fitbit
        const checkRes = await fetch('/api/integrations/fitbit/sync');
        if (!checkRes.ok) return;
        const check = await checkRes.json() as { connected?: boolean };
        if (!check.connected) return;

        // Запускаем синхронизацию
        const syncRes = await fetch('/api/integrations/fitbit/sync', { method: 'POST' });
        const data = await syncRes.json() as { imported?: number; message?: string; error?: string };

        if (syncRes.ok && data.imported != null && data.imported > 0) {
          toast(`Fitbit: синхронизировано ${data.imported} записей`, 'success');
        }
      } catch {
        // Фоновая синхронизация — не показываем ошибку пользователю
      }
    }

    // Небольшая задержка чтобы не блокировать первый рендер дашборда
    const timer = setTimeout(run, 1500);
    return () => clearTimeout(timer);
  }, [status, session, toast]);

  return null;
}
