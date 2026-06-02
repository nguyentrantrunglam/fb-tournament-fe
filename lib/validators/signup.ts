import { z } from 'zod'
import { cccdSchema } from './cccd'

// Bước 1 — tài khoản (Firebase Auth)
export const accountSchema = z
  .object({
    email: z.string().min(1, 'Nhập email').email('Email không hợp lệ'),
    password: z.string().min(6, 'Mật khẩu tối thiểu 6 ký tự'),
    confirmPassword: z.string().min(1, 'Nhập lại mật khẩu'),
  })
  .refine((d) => d.password === d.confirmPassword, {
    message: 'Mật khẩu nhập lại không khớp',
    path: ['confirmPassword'],
  })

export type AccountFormData = z.infer<typeof accountSchema>

// Bước 2 — hồ sơ (CF completeProfile)
export const profileSchema = z.object({
  fullName: z.string().min(2, 'Nhập họ tên').max(80, 'Quá dài'),
  cccd: cccdSchema,
  gender: z.enum(['male', 'female'], { message: 'Chọn giới tính' }),
  dob: z.string().min(1, 'Chọn ngày sinh'),
  phone: z
    .string()
    .regex(/^0\d{9}$/, 'SĐT không hợp lệ')
    .or(z.literal(''))
    .optional(),
})

export type ProfileFormData = z.infer<typeof profileSchema>
