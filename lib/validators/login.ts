import { z } from 'zod'

export const loginSchema = z.object({
  email: z.string().min(1, 'Nhập email').email('Email không hợp lệ'),
  password: z.string().min(1, 'Nhập mật khẩu'),
})

export type LoginFormData = z.infer<typeof loginSchema>
