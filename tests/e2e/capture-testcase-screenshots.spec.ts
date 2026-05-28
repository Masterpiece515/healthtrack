/**
 * Скриншоты для таблиц тест-кейсов 4.8–4.12 (диплом HealthTrack).
 * Запуск: из папки healthtrack при работающем `npm run dev` на BASE_URL (по умолчанию :3000)
 *
 *   npx playwright install chromium
 *   npx playwright test tests/e2e/capture-testcase-screenshots.spec.ts
 */
import { test, expect } from '@playwright/test';
import path from 'path';
import fs from 'fs';
import initSqlJs from 'sql.js';

const OUT = path.join(process.cwd(), 'docs', 'screenshots-testcases-4.8-4.12');

function ensureDir() {
  if (!fs.existsSync(OUT)) fs.mkdirSync(OUT, { recursive: true });
}

async function setUserRole(email: string, role: 'user' | 'admin') {
  const dbPath = path.join(process.cwd(), 'healthtrack.db');
  if (!fs.existsSync(dbPath)) throw new Error(`База не найдена: ${dbPath}`);

  const SQL = await initSqlJs({
    locateFile: (file) => path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file),
  });
  const db = new SQL.Database(new Uint8Array(fs.readFileSync(dbPath)));
  db.run('UPDATE users SET role = ? WHERE LOWER(email) = LOWER(?)', [role, email]);
  fs.writeFileSync(dbPath, Buffer.from(db.export()));
  db.close();
}

test.describe.configure({ mode: 'serial' });

test('скриншоты тест-кейсов 4.8–4.12', async ({ page, baseURL }) => {
  test.setTimeout(300_000);
  ensureDir();
  const origin = baseURL ?? 'http://localhost:3000';
  const stamp = Date.now();
  const email = `test.screenshots.${stamp}@example.com`;
  const password = 'test123456';
  const name = 'Тест Пользователь';

  // ── 4.8 Регистрация ─────────────────────────────────────────────
  await page.goto('/register', { waitUntil: 'domcontentloaded' });
  await page.screenshot({ path: path.join(OUT, '4.8-register-page.png'), fullPage: false });

  await page.getByPlaceholder('Александр').fill(name);
  await page.getByPlaceholder('your@email.com').fill(email);
  await page.getByPlaceholder('Минимум 6 символов').fill(password);
  await page.screenshot({ path: path.join(OUT, '4.8-register-filled.png'), fullPage: false });

  await page.getByRole('button', { name: 'Зарегистрироваться', exact: true }).click();
  await page.waitForURL('**/dashboard', { timeout: 30_000 });
  await expect(page.getByRole('heading', { name: /Добро пожаловать/ })).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, '4.8-dashboard-after-register.png'), fullPage: false });

  // ── 4.9 Добавление записи ───────────────────────────────────────
  await page.getByRole('button', { name: 'Добавить запись' }).click();
  await expect(page.getByRole('heading', { name: 'Добавить запись' })).toBeVisible();
  await page.screenshot({ path: path.join(OUT, '4.9-modal-add-entry.png'), fullPage: false });

  await page.getByPlaceholder('10 000').fill('8500');
  await page.locator('input[type="number"]').nth(1).fill('7.5');
  await page.locator('input[type="number"]').nth(2).fill('72');
  await page.locator('input[type="number"]').nth(3).fill('75');
  await page.screenshot({ path: path.join(OUT, '4.9-modal-filled.png'), fullPage: false });

  const saveRespPromise = page.waitForResponse(
    (r) => r.url().includes('/api/health') && r.request().method() === 'POST',
    { timeout: 25_000 },
  );
  await page.getByRole('button', { name: 'Сохранить запись' }).click();
  const saveResp = await saveRespPromise;
  expect(saveResp.status(), await saveResp.text()).toBe(201);
  await page.waitForTimeout(2000);
  await page.screenshot({ path: path.join(OUT, '4.9-dashboard-after-save.png'), fullPage: false });

  // ── 4.10 Индекс здоровья (результат calcHealthScore / summary на UI) ──
  await expect(page.getByText('Индекс здоровья').first()).toBeVisible();
  await page.screenshot({ path: path.join(OUT, '4.10-dashboard-health-index.png'), fullPage: false });

  // ── 4.11 Рекомендации: низкий сон + обновление ───────────────────
  const today = new Date();
  for (let i = 0; i < 3; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - (i + 1));
    const iso = d.toISOString().split('T')[0];
    const res = await page.request.post(`${origin}/api/health`, {
      headers: { 'Content-Type': 'application/json' },
      data: {
        date: iso,
        steps: 3000,
        sleepHours: 4.5,
        heartRate: 85,
        weight: 76,
      },
    });
    expect(res.ok(), `POST /api/health день ${iso}: ${res.status()}`).toBeTruthy();
  }

  await page.goto('/recommendations');
  await expect(page.getByRole('heading', { name: /AI Рекомендации/i })).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, '4.11-recommendations-before-refresh.png'), fullPage: false });

  const recLoad = page.waitForResponse(
    (r) => r.url().includes('/api/recommendations') && r.request().method() === 'GET',
    { timeout: 120_000 },
  );
  await page.getByRole('button', { name: 'Обновить' }).click();
  await recLoad;
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, '4.11-recommendations-after-refresh.png'), fullPage: false });

  // ── 4.12 Доступ к админке: 403 API как user ─────────────────────
  const res403 = await page.request.get(`${origin}/api/admin/stats`);
  expect(res403.status()).toBe(403);
  const body403 = await res403.text();
  fs.writeFileSync(path.join(OUT, '4.12-api-admin-stats-403-body.txt'), body403, 'utf8');

  await page.goto(`${origin}/api/admin/stats`);
  await page.waitForTimeout(500);
  await page.screenshot({ path: path.join(OUT, '4.12-api-admin-stats-403.png'), fullPage: false });

  await page.goto('/admin');
  await page.waitForURL('**/dashboard', { timeout: 10_000 });
  await page.waitForTimeout(600);
  await page.screenshot({ path: path.join(OUT, '4.12-redirect-user-admin-to-dashboard.png'), fullPage: false });

  // Повысить роль до admin и перелогиниться
  await setUserRole(email, 'admin');

  await page.goto('/settings');
  await page.getByRole('button', { name: 'Выйти из аккаунта' }).click();
  await page.waitForURL('**/login**', { timeout: 15_000 });

  await page.goto('/login');
  await page.locator('input[type="email"]').fill(email);
  await page.locator('input[type="password"]').fill(password);
  await page.getByRole('button', { name: 'Войти', exact: true }).click();
  await page.waitForURL('**/dashboard', { timeout: 20_000 });

  await page.goto('/admin');
  await page.waitForURL('**/admin', { timeout: 15_000 });
  await expect(page.getByRole('heading', { name: 'Панель администратора' })).toBeVisible({ timeout: 15_000 });
  await page.waitForTimeout(800);
  await page.screenshot({ path: path.join(OUT, '4.12-admin-dashboard.png'), fullPage: false });

  const res200 = await page.request.get(`${origin}/api/admin/stats`);
  expect(res200.ok()).toBeTruthy();
  fs.writeFileSync(path.join(OUT, '4.12-api-admin-stats-200-body.txt'), await res200.text(), 'utf8');
});
