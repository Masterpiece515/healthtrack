// ===== Mock данные для HealthTrack =====
// В реальном приложении эти данные приходят из API / базы данных

export interface ActivityPoint {
  time: string;
  steps: number;
  heartRate: number;
  calories: number;
}

export interface WeeklyPoint {
  day: string;
  steps: number;
  sleep: number;
  score: number;
}

export interface Recommendation {
  id: string;
  title: string;
  description: string;
  priority: "high" | "medium" | "low";
  actionable: boolean;
  category: "sleep" | "activity" | "nutrition" | "hydration";
}

export interface StatCardData {
  title: string;
  value: string;
  unit?: string;
  trend: number;
  progress?: number;
  color: string;
  icon: string; // имя иконки Lucide
}

// Активность за сегодня (почасовые данные)
export const activityData: ActivityPoint[] = [
  { time: "00:00", steps: 0,     heartRate: 65, calories: 0   },
  { time: "03:00", steps: 50,    heartRate: 62, calories: 10  },
  { time: "06:00", steps: 850,   heartRate: 68, calories: 85  },
  { time: "09:00", steps: 3200,  heartRate: 78, calories: 220 },
  { time: "12:00", steps: 5800,  heartRate: 82, calories: 380 },
  { time: "15:00", steps: 7900,  heartRate: 85, calories: 465 },
  { time: "18:00", steps: 9200,  heartRate: 88, calories: 520 },
  { time: "21:00", steps: 9850,  heartRate: 75, calories: 550 },
  { time: "23:59", steps: 10120, heartRate: 68, calories: 565 },
];

// Активность за неделю
export const weeklyData: WeeklyPoint[] = [
  { day: "Пн", steps: 8200,  sleep: 7.2, score: 72 },
  { day: "Вт", steps: 9500,  sleep: 6.8, score: 74 },
  { day: "Ср", steps: 7100,  sleep: 8.0, score: 76 },
  { day: "Чт", steps: 11300, sleep: 7.5, score: 80 },
  { day: "Пт", steps: 6800,  sleep: 6.0, score: 68 },
  { day: "Сб", steps: 13200, sleep: 8.5, score: 85 },
  { day: "Вс", steps: 10120, sleep: 7.5, score: 78 },
];

// Карточки метрик
export const statCards: StatCardData[] = [
  {
    title: "Шаги",
    value: "10 120",
    trend: 15,
    progress: 101,
    color: "#B5B384",
    icon: "Footprints",
  },
  {
    title: "Сон",
    value: "7.5",
    unit: "ч",
    trend: -5,
    progress: 94,
    color: "#93A4C2",
    icon: "Moon",
  },
  {
    title: "Пульс",
    value: "72",
    unit: "уд/мин",
    trend: 2,
    color: "#5C6B8A",
    icon: "Heart",
  },
  {
    title: "Вес",
    value: "75",
    unit: "кг",
    trend: -1,
    color: "#D4DFF3",
    icon: "Weight",
  },
];

// AI-рекомендации
export const recommendations: Recommendation[] = [
  {
    id: "1",
    title: "Улучшите качество сна",
    description: "Ваш сон короче обычного на 30 минут. Попробуйте ложиться на час раньше.",
    priority: "high",
    actionable: true,
    category: "sleep",
  },
  {
    id: "2",
    title: "Отличная активность!",
    description: "Вы превысили цель по шагам на 23%. Продолжайте в том же духе!",
    priority: "medium",
    actionable: false,
    category: "activity",
  },
  {
    id: "3",
    title: "Пейте больше воды",
    description: "Гидратация ниже рекомендуемой. Добавьте 2 стакана воды в день.",
    priority: "high",
    actionable: true,
    category: "hydration",
  },
];

// Общие данные пользователя
export const userProfile = {
  name: "Александр",
  surname: "И.",
  email: "alexander@mail.ru",
  healthScore: 78,
  healthTrend: 5,
  achievements: 12,
  activityRate: 85,
  streak: 7,
};
