import { sqliteTable, text, integer, real } from 'drizzle-orm/sqlite-core';

// ── Пользователи ──────────────────────────────────────────────────────────
export const users = sqliteTable('users', {
  id:           text('id').primaryKey(),
  name:         text('name').notNull(),
  email:        text('email').notNull().unique(),
  passwordHash: text('password_hash').notNull(),
  role:         text('role').notNull().default('user'),  // "user" | "admin"
  createdAt:    text('created_at').notNull(),
});

// ── Записи здоровья ───────────────────────────────────────────────────────
export const healthEntries = sqliteTable('health_entries', {
  id:         text('id').primaryKey(),
  userId:     text('user_id').notNull().references(() => users.id),
  date:       text('date').notNull(),        // "2026-04-11"
  steps:      integer('steps').notNull(),
  sleepHours: real('sleep_hours').notNull(),
  heartRate:  integer('heart_rate').notNull(),
  weight:     real('weight').notNull(),
  calories:   integer('calories'),
  notes:      text('notes'),
  createdAt:  text('created_at').notNull(),
});

// ── Цели пользователя ─────────────────────────────────────────────────────
export const goals = sqliteTable('goals', {
  id:        text('id').primaryKey(),
  userId:    text('user_id').notNull().references(() => users.id),
  metric:    text('metric').notNull(),   // "steps" | "sleep" | "weight" | "calories"
  target:    real('target').notNull(),
  unit:      text('unit').notNull(),     // "шагов" | "ч" | "кг" | "ккал"
  updatedAt: text('updated_at').notNull(),
});

// ── AI-рекомендации (кеш) ─────────────────────────────────────────────────
export const recommendations = sqliteTable('recommendations', {
  id:          text('id').primaryKey(),
  userId:      text('user_id').notNull().references(() => users.id),
  title:       text('title').notNull(),
  description: text('description').notNull(),
  priority:    text('priority').notNull(),  // "high" | "medium" | "low"
  actionable:  integer('actionable', { mode: 'boolean' }).notNull(),
  category:    text('category').notNull(),
  source:      text('source').notNull(),    // "ai" | "static"
  generatedAt: text('generated_at').notNull(),
});

// ── Серии активности (стрик) ──────────────────────────────────────────────
export const streaks = sqliteTable('streaks', {
  userId:         text('user_id').primaryKey().references(() => users.id),
  currentStreak:  integer('current_streak').notNull().default(0),
  longestStreak:  integer('longest_streak').notNull().default(0),
  lastEntryDate:  text('last_entry_date'),  // "2026-04-12"
  updatedAt:      text('updated_at').notNull(),
});

// ── Интеграции (токены сторонних сервисов) ────────────────────────────────
export const integrations = sqliteTable('integrations', {
  userId:             text('user_id').primaryKey().references(() => users.id),
  googleAccessToken:  text('google_access_token'),
  googleRefreshToken: text('google_refresh_token'),
  googleTokenExpiry:  text('google_token_expiry'),
  updatedAt:          text('updated_at').notNull(),
});

// ── Настройки пользователя ────────────────────────────────────────────────
export const userSettings = sqliteTable('user_settings', {
  userId:    text('user_id').primaryKey().references(() => users.id),
  timezone:  text('timezone').notNull().default('Europe/Moscow'),
  units:     text('units').notNull().default('metric'),  // "metric" | "imperial"
  updatedAt: text('updated_at').notNull(),
});
