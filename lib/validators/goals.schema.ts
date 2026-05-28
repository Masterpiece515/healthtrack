import { z } from 'zod';

export const UpsertGoalSchema = z.object({
  metric: z.enum(['steps', 'sleep', 'weight', 'calories']),
  target: z.coerce.number().positive('Цель должна быть положительным числом'),
  unit:   z.string().min(1).max(20),
});

export type UpsertGoalInput = z.infer<typeof UpsertGoalSchema>;
