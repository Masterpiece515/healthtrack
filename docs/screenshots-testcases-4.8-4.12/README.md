# Скриншоты для тест-кейсов 4.8–4.12

PNG и текстовые дампы ответов API создаются скриптом Playwright при запуске теста (папка заполняется автоматически).

## Запуск

1. Терминал 1 — поднять приложение:
   ```bash
   cd healthtrack
   npm run dev
   ```
2. Терминал 2 — один раз установить Chromium и выполнить съёмку:
   ```bash
   cd healthtrack
   npx playwright install chromium
   npm run screenshots:testcases
   ```
   При другом хосте/порте:
   ```bash
   set BASE_URL=http://127.0.0.1:3001
   npm run screenshots:testcases
   ```

## Соответствие файлов таблицам

| Файл | Таблица / тест-кейс |
|------|---------------------|
| `4.8-register-page.png` | 4.8 — страница `/register` |
| `4.8-register-filled.png` | 4.8 — форма с тестовыми данными |
| `4.8-dashboard-after-register.png` | 4.8 — после регистрации, `/dashboard` |
| `4.9-modal-add-entry.png` | 4.9 — модальное окно «Добавить запись» |
| `4.9-modal-filled.png` | 4.9 — поля 8500 / 7.5 / 72 / 75 |
| `4.9-dashboard-after-save.png` | 4.9 — дашборд после сохранения |
| `4.10-dashboard-health-index.png` | 4.10 — индекс здоровья на дашборде |
| `4.11-recommendations-before-refresh.png` | 4.11 — `/recommendations` до обновления |
| `4.11-recommendations-after-refresh.png` | 4.11 — после кнопки «Обновить» |
| `4.12-api-admin-stats-403.png` | 4.12 — ответ `GET /api/admin/stats` для роли `user` |
| `4.12-api-admin-stats-403-body.txt` | 4.12 — тело ответа 403 (JSON) |
| `4.12-redirect-user-admin-to-dashboard.png` | 4.12 — переход на `/admin` редиректит на `/dashboard` |
| `4.12-admin-dashboard.png` | 4.12 — `/admin` для роли `admin` |
| `4.12-api-admin-stats-200-body.txt` | 4.12 — тело успешного ответа API (после повышения роли) |

**Примечание.** В тест-кейсе указан `POST /api/recommendations`; в приложении обновление выполняется через **`GET /api/recommendations`** по кнопке «Обновить» — скриншоты отражают фактическое поведение UI.

Создаётся **уникальный** пользователь `test.screenshots.<timestamp>@example.com`; в конце теста ему в SQLite выставляется роль **`admin`** (локальная БД `healthtrack.db`).
