/**
 * Создаёт трёх демо-пользователей с реалистичной историей здоровья.
 * Запуск: node scripts/seed-demo-users.js
 */

const fs   = require('fs');
const path = require('path');
const { randomUUID } = require('crypto');

const DB_PATH   = path.join(__dirname, '..', 'healthtrack.db');
const WASM_PATH = path.join(__dirname, '..', 'node_modules', 'sql.js', 'dist', 'sql-wasm.wasm');

// Хэши bcrypt для пароля "Demo1234!" (cost 10)
const PASS_HASH = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lh7y';

// ── Генераторы случайных чисел ────────────────────────────────────────────────
function rand(min, max) {
  return min + Math.random() * (max - min);
}
function randInt(min, max) {
  return Math.round(rand(min, max));
}
/** Значение с линейным трендом: от startVal к endVal за totalDays, с шумом */
function trend(day, totalDays, startVal, endVal, noise) {
  const t   = day / totalDays;
  const val = startVal + (endVal - startVal) * t;
  return val + rand(-noise, noise);
}

// ── Форматирование дат ────────────────────────────────────────────────────────
function daysAgo(n) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}
function now() {
  return new Date().toISOString();
}

// ── Пользователи ──────────────────────────────────────────────────────────────
const USERS = [
  {
    id:    randomUUID(),
    name:  'Артём М.',
    email: 'artem.m@healthtrack.demo',
    // Похудел 7 кг за 2 месяца, улучшил сон, ходит больше
    entries: (id) => buildEntries(id, {
      days:        62,
      skipChance:  0.18, // пропускает ~18% дней
      weightStart: 87.2, weightEnd: 80.1,
      stepsStart:  4800,  stepsEnd:  9200,
      sleepStart:  5.7,   sleepEnd:  7.6,
      hrStart:     83,    hrEnd:     70,
      caloriesBase: 2100,
      weightNoise: 0.4, stepsNoise: 900, sleepNoise: 0.4, hrNoise: 4,
    }),
    goals: (id) => [
      { id: randomUUID(), userId: id, metric: 'steps',    target: 10000, unit: 'шагов',  updatedAt: now() },
      { id: randomUUID(), userId: id, metric: 'weight',   target: 78,    unit: 'кг',     updatedAt: now() },
      { id: randomUUID(), userId: id, metric: 'sleep',    target: 8,     unit: 'ч',      updatedAt: now() },
    ],
    streak: { current: 9, longest: 21 },
  },
  {
    id:    randomUUID(),
    name:  'Мария К.',
    email: 'maria.k@healthtrack.demo',
    // Регулярная, не пропускает тренировки, стабильный вес
    entries: (id) => buildEntries(id, {
      days:        70,
      skipChance:  0.06,
      weightStart: 63.8, weightEnd: 62.1,
      stepsStart:  8400,  stepsEnd: 11200,
      sleepStart:  7.2,   sleepEnd:  7.9,
      hrStart:     69,    hrEnd:     64,
      caloriesBase: 1750,
      weightNoise: 0.3, stepsNoise: 800, sleepNoise: 0.35, hrNoise: 3,
    }),
    goals: (id) => [
      { id: randomUUID(), userId: id, metric: 'steps',    target: 12000, unit: 'шагов',  updatedAt: now() },
      { id: randomUUID(), userId: id, metric: 'sleep',    target: 8,     unit: 'ч',      updatedAt: now() },
      { id: randomUUID(), userId: id, metric: 'calories', target: 1800,  unit: 'ккал',   updatedAt: now() },
    ],
    streak: { current: 34, longest: 42 },
  },
  {
    id:    randomUUID(),
    name:  'Дмитрий С.',
    email: 'dmitry.s@healthtrack.demo',
    // Умеренно активный, ведёт дневник нерегулярно
    entries: (id) => buildEntries(id, {
      days:        55,
      skipChance:  0.28,
      weightStart: 80.5, weightEnd: 78.9,
      stepsStart:  5900,  stepsEnd:  7800,
      sleepStart:  6.4,   sleepEnd:  7.1,
      hrStart:     77,    hrEnd:     72,
      caloriesBase: 2300,
      weightNoise: 0.5, stepsNoise: 1100, sleepNoise: 0.5, hrNoise: 5,
    }),
    goals: (id) => [
      { id: randomUUID(), userId: id, metric: 'steps',  target: 8000, unit: 'шагов', updatedAt: now() },
      { id: randomUUID(), userId: id, metric: 'weight', target: 77,   unit: 'кг',    updatedAt: now() },
    ],
    streak: { current: 5, longest: 14 },
  },
];

function buildEntries(userId, cfg) {
  const entries = [];
  for (let daysBack = cfg.days; daysBack >= 1; daysBack--) {
    if (Math.random() < cfg.skipChance) continue;

    const dayIndex = cfg.days - daysBack;
    const weight   = Math.round(trend(dayIndex, cfg.days, cfg.weightStart, cfg.weightEnd, cfg.weightNoise) * 10) / 10;
    const steps    = Math.max(1000, randInt(
      trend(dayIndex, cfg.days, cfg.stepsStart, cfg.stepsEnd, cfg.stepsNoise),
      trend(dayIndex, cfg.days, cfg.stepsStart, cfg.stepsEnd, cfg.stepsNoise),
    ));
    const sleep    = Math.round(Math.max(4, Math.min(10,
      trend(dayIndex, cfg.days, cfg.sleepStart, cfg.sleepEnd, cfg.sleepNoise)
    )) * 10) / 10;
    const hr       = Math.max(50, Math.min(120, randInt(
      trend(dayIndex, cfg.days, cfg.hrStart, cfg.hrEnd, cfg.hrNoise),
      trend(dayIndex, cfg.days, cfg.hrStart, cfg.hrEnd, cfg.hrNoise),
    )));
    const calories = randInt(cfg.caloriesBase - 200, cfg.caloriesBase + 200);

    entries.push({
      id:         randomUUID(),
      userId,
      date:       daysAgo(daysBack),
      steps,
      sleepHours: sleep,
      heartRate:  hr,
      weight,
      calories,
      createdAt:  now(),
    });
  }
  return entries;
}

// ── Основная функция ──────────────────────────────────────────────────────────
async function main() {
  const initSqlJs = require(path.join(__dirname, '..', 'node_modules', 'sql.js'));

  const wasmBinary = fs.readFileSync(WASM_PATH);
  const SQL = await initSqlJs({ wasmBinary });

  let db;
  if (fs.existsSync(DB_PATH)) {
    db = new SQL.Database(new Uint8Array(fs.readFileSync(DB_PATH)));
    console.log('Загружена существующая БД:', DB_PATH);
  } else {
    console.error('БД не найдена:', DB_PATH, '— запустите dev-сервер хотя бы раз');
    process.exit(1);
  }

  db.run('PRAGMA foreign_keys = ON');

  let usersCreated   = 0;
  let entriesCreated = 0;

  for (const user of USERS) {
    // Проверяем, нет ли уже такого email
    const existing = db.exec(`SELECT id FROM users WHERE email = '${user.email}'`);
    if (existing.length && existing[0].values.length) {
      console.log(`  Пропуск (уже есть): ${user.name} <${user.email}>`);
      continue;
    }

    // Вставляем пользователя
    db.run(
      `INSERT INTO users (id, name, email, password_hash, role, created_at) VALUES (?,?,?,?,?,?)`,
      [user.id, user.name, user.email, PASS_HASH, 'user', now()]
    );

    // Вставляем записи здоровья
    const entries = user.entries(user.id);
    for (const e of entries) {
      try {
        db.run(
          `INSERT INTO health_entries (id, user_id, date, steps, sleep_hours, heart_rate, weight, calories, created_at)
           VALUES (?,?,?,?,?,?,?,?,?)`,
          [e.id, e.userId, e.date, e.steps, e.sleepHours, e.heartRate, e.weight, e.calories, e.createdAt]
        );
        entriesCreated++;
      } catch (err) {
        // UNIQUE conflict — пропускаем
      }
    }

    // Вставляем цели
    const goals = user.goals(user.id);
    for (const g of goals) {
      db.run(
        `INSERT OR IGNORE INTO goals (id, user_id, metric, target, unit, updated_at) VALUES (?,?,?,?,?,?)`,
        [g.id, g.userId, g.metric, g.target, g.unit, g.updatedAt]
      );
    }

    // Вставляем стрик
    const lastEntry = db.exec(
      `SELECT date FROM health_entries WHERE user_id = '${user.id}' ORDER BY date DESC LIMIT 1`
    );
    const lastDate = lastEntry.length && lastEntry[0].values.length
      ? lastEntry[0].values[0][0]
      : daysAgo(1);

    db.run(
      `INSERT OR REPLACE INTO streaks (user_id, current_streak, longest_streak, last_entry_date, updated_at)
       VALUES (?,?,?,?,?)`,
      [user.id, user.streak.current, user.streak.longest, lastDate, now()]
    );

    usersCreated++;
    console.log(`  ✓ ${user.name} <${user.email}> — ${entries.length} записей`);
  }

  // Сохраняем БД
  const data = db.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
  db.close();

  console.log(`\nГотово: создано ${usersCreated} пользователей, ${entriesCreated} записей здоровья`);
  console.log(`Пароль для всех: Demo1234!`);
}

main().catch((e) => { console.error(e); process.exit(1); });
