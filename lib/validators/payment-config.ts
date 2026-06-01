import { z } from 'zod'
import { VN_BANKS } from '@/lib/data/vn-banks'

const bankCodes = VN_BANKS.map((b) => b.code) as [string, ...string[]]

export const paymentConfigSchema = z.object({
  accountHolder: z
    .string()
    .min(2, 'Nhập tên chủ tài khoản')
    .max(80, 'Quá dài'),
  accountNumber: z
    .string()
    .min(4, 'Nhập số tài khoản')
    .max(30, 'Quá dài')
    .regex(/^[0-9\s]+$/, 'Số tài khoản chỉ gồm chữ số'),
  bankCode: z.enum(bankCodes, { message: 'Chọn ngân hàng' }),
  transferMemoTemplate: z
    .string()
    .max(120, 'Tối đa 120 ký tự')
    .default(''),
  qrUrl: z.string().nullable().default(null),
})

export type PaymentConfigFormData = z.infer<typeof paymentConfigSchema>
