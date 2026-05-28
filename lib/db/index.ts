import fs from 'fs';
import path from 'path';
import initSqlJs, { type Database } from 'sql.js';
import { drizzle } from 'drizzle-orm/sql-js';
import * as schema from './schema';

// На Railway данные хранятся в /data (том), локально — рядом с проектом
const DB_PATH = process.env.DB_PATH ?? path.join(process.cwd(), 'healthtrack.db');

const SCHEMA_SQL = `
  CREATE TABLE IF NOT EXISTS users (
    id            TEXT PRIMARY KEY,
    name          TEXT NOT NULL,
    email         TEXT NOT NULL UNIQUE,
    password_hash TEXT NOT NULL,
    created_at    TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS health_entries (
    id          TEXT PRIMARY KEY,
    user_id     TEXT NOT NULL REFERENCES users(id),
    date        TEXT NOT NULL,
    steps       INTEGER NOT NULL,
    sleep_hours REAL NOT NULL,
    heart_rate  INTEGER NOT NULL,
    weight      REAL NOT NULL,
    calories    INTEGER,
    notes       TEXT,
    created_at  TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS goals (
    id         TEXT PRIMARY KEY,
    user_id    TEXT NOT NULL REFERENCES users(id),
    metric     TEXT NOT NULL,
    target     REAL NOT NULL,
    unit       TEXT NOT NULL,
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS recommendations (
    id           TEXT PRIMARY KEY,
    user_id      TEXT NOT NULL REFERENCES users(id),
    title        TEXT NOT NULL,
    description  TEXT NOT NULL,
    priority     TEXT NOT NULL,
    actionable   INTEGER NOT NULL,
    category     TEXT NOT NULL,
    source       TEXT NOT NULL,
    generated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS streaks (
    user_id         TEXT PRIMARY KEY REFERENCES users(id),
    current_streak  INTEGER NOT NULL DEFAULT 0,
    longest_streak  INTEGER NOT NULL DEFAULT 0,
    last_entry_date TEXT,
    updated_at      TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS user_settings (
    user_id    TEXT PRIMARY KEY REFERENCES users(id),
    timezone   TEXT NOT NULL DEFAULT 'Europe/Moscow',
    units      TEXT NOT NULL DEFAULT 'metric',
    updated_at TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS integrations (
    user_id              TEXT PRIMARY KEY REFERENCES users(id),
    google_access_token  TEXT,
    google_refresh_token TEXT,
    google_token_expiry  TEXT,
    updated_at           TEXT NOT NULL
  );
`;

type DbBundle = {
  sqlite: Database;
  db: ReturnType<typeof drizzle<typeof schema>>;
};

declare global {
  var __dbBundle: DbBundle | undefined;
  var __dbInit: Promise<DbBundle> | undefined;
}

function wasmPath(file: string) {
  return path.join(process.cwd(), 'node_modules', 'sql.js', 'dist', file);
}

function persistSqlite(sqlite: Database) {
  const data = sqlite.export();
  fs.writeFileSync(DB_PATH, Buffer.from(data));
}

function wrapSqliteWithPersist(sqlite: Database): Database {
  const persist = () => persistSqlite(sqlite);

  const originalRun = sqlite.run.bind(sqlite);
  sqlite.run = (...args: Parameters<Database['run']>) => {
    const result = originalRun(...args);
    persist();
    return result;
  };

  const originalExec = sqlite.exec.bind(sqlite);
  sqlite.exec = (...args: Parameters<Database['exec']>) => {
    const result = originalExec(...args);
    persist();
    return result;
  };

  return sqlite;
}

function applySchema(sqlite: Database) {
  sqlite.exec('PRAGMA foreign_keys = ON');
  sqlite.exec(SCHEMA_SQL);

  try {
    sqlite.exec(`ALTER TABLE users ADD COLUMN role TEXT NOT NULL DEFAULT 'user'`);
  } catch {
    // колонка уже есть
  }
}

async function createDbBundle(): Promise<DbBundle> {
  const SQL = await initSqlJs({ locateFile: wasmPath });

  const sqlite = fs.existsSync(DB_PATH)
    ? new SQL.Database(new Uint8Array(fs.readFileSync(DB_PATH)))
    : new SQL.Database();

  applySchema(sqlite);
  wrapSqliteWithPersist(sqlite);

  const db = drizzle(sqlite, { schema });

  if (!fs.existsSync(DB_PATH)) {
    persistSqlite(sqlite);
  }

  process.on('beforeExit', () => persistSqlite(sqlite));

  return { sqlite, db };
}

function getInitPromise() {
  if (!global.__dbInit) {
    global.__dbInit = createDbBundle().then((bundle) => {
      global.__dbBundle = bundle;
      return bundle;
    });
  }
  return global.__dbInit;
}

/** Инициализация БД (вызывается из instrumentation.ts при старте сервера). */
export async function initDb() {
  await getInitPromise();
}

/** Синхронный доступ к Drizzle — только после initDb(). */
export function getDb() {
  const bundle = global.__dbBundle;
  if (!bundle) {
    throw new Error(
      'База данных не инициализирована. Перезапустите dev-сервер (instrumentation вызывает initDb).',
    );
  }
  return bundle.db;
}

/** Совместимость: db.select()… как раньше (lazy proxy после init). */
export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    const instance = getDb();
    const value = Reflect.get(instance, prop);
    return typeof value === 'function' ? value.bind(instance) : value;
  },
});
