// ===== Общие типы для HealthTrack =====

/** Одна запись показателей здоровья за день */
export interface HealthEntry {
  id: string;
  date: string;           // ISO-дата: "2026-04-11"
  steps: number;
  sleepHours: number;
  heartRate: number;
  weight: number;
  calories?: number;
  notes?: string;
  createdAt: string;      // ISO timestamp
}

/** Данные из формы (без id и createdAt — генерируем на сервере) */
export type HealthEntryInput = Omit<HealthEntry, 'id' | 'createdAt'>;

/** Одна AI-рекомендация */
export interface AIRecommendation {
  id: string;
  title: string;
  description: string;
  priority: 'high' | 'medium' | 'low';
  actionable: boolean;
  category: 'sleep' | 'activity' | 'nutrition' | 'hydration' | 'general';
  source: 'ai' | 'static';  // ai = от OpenAI, static = запасные данные
}

/** Ответ GET /api/health */
export interface HealthListResponse {
  entries: HealthEntry[];
  summary: {
    avgSteps: number;
    avgSleep: number;
    avgHeartRate: number;
    latestWeight: number;
    healthScore: number;
  };
  hasFitbit: boolean;
}

/** Ответ GET /api/recommendations */
export interface RecommendationsResponse {
  recommendations: AIRecommendation[];
  generatedAt: string;
  model: string;
}

/** Ответ POST /api/health */
export interface AddEntryResponse {
  entry: HealthEntry;
  healthScore: number;
}

/** Ошибка API */
export interface ApiError {
  error: string;
  details?: string;
}
