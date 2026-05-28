import { z } from 'zod';

export const CreateHealthEntrySchema = z.object({
  date:       z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Формат даты: YYYY-MM-DD'),
  steps:      z.coerce.number().int().min(0, 'Минимум 0').max(100_000, 'Максимум 100 000'),
  sleepHours: z.coerce.number().min(0).max(24, 'Максимум 24 ч'),
  heartRate:  z.coerce.number().int().min(30, 'Минимум 30').max(250, 'Максимум 250'),
  weight:     z.coerce.number().min(20, 'Минимум 20 кг').max(300, 'Максимум 300 кг'),
  calories:   z.coerce.number().int().positive().optional(),
  notes:      z.string().max(500, 'Максимум 500 символов').optional(),
});

export const UpdateHealthEntrySchema = CreateHealthEntrySchema.partial().extend({
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
});

export type CreateHealthEntryInput = z.infer<typeof CreateHealthEntrySchema>;
export type UpdateHealthEntryInput = z.infer<typeof UpdateHealthEntrySchema>;
