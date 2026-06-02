import { z } from 'zod'

export const createTournamentSchema = z
  .object({
    name: z.string().min(3, 'Tên giải tối thiểu 3 ký tự').max(100, 'Quá dài'),
    startDate: z.string().min(1, 'Chọn ngày bắt đầu'),
    endDate: z.string().min(1, 'Chọn ngày kết thúc'),
    location: z.string().min(3, 'Nhập địa điểm').max(200, 'Quá dài'),
  })
  .refine((d) => !d.startDate || !d.endDate || d.endDate >= d.startDate, {
    message: 'Ngày kết thúc phải sau ngày bắt đầu',
    path: ['endDate'],
  })

export type CreateTournamentFormData = z.infer<typeof createTournamentSchema>
