import { z } from 'zod'

// CCCD: đúng 12 chữ số (unique toàn hệ thống — validate server-side bằng cccdIndex)
export const cccdSchema = z
  .string()
  .regex(/^\d{12}$/, 'CCCD phải gồm đúng 12 chữ số')
