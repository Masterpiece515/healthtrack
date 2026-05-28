import { z } from 'zod';

export const RegisterSchema = z.object({
  name:     z.string().min(2, 'Минимум 2 символа').max(60),
  email:    z.string().email('Некорректный email'),
  password: z.string().min(6, 'Минимум 6 символов').max(72),
});

export const ChangePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Введите текущий пароль'),
  newPassword:     z.string().min(6, 'Минимум 6 символов').max(72),
});

export const UpdateProfileSchema = z.object({
  name:  z.string().min(2).max(60).optional(),
  email: z.string().email().optional(),
});

export type RegisterInput        = z.infer<typeof RegisterSchema>;
export type ChangePasswordInput  = z.infer<typeof ChangePasswordSchema>;
export type UpdateProfileInput   = z.infer<typeof UpdateProfileSchema>;
