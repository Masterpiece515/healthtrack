/** Сообщения для query `?error=` от Auth.js на странице входа */
export function authErrorMessage(code: string | null): string {
  if (!code) return '';
  const messages: Record<string, string> = {
    Configuration:
      'Не удалось завершить вход через Google (сеть или настройки). Проверьте интернет и VPN; в Google Console должны быть redirect URI для того же хоста и порта, что в браузере. Запуск: npm run dev:3000.',
    AccessDenied: 'Вход отменён или доступ запрещён.',
    Verification: 'Ссылка для входа устарела или уже использована.',
  };
  return messages[code] ?? 'Ошибка входа. Попробуйте ещё раз или войдите по email и паролю.';
}
