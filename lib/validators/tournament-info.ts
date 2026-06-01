import { z } from 'zod'

export const tournamentInfoSchema = z.object({
  name: z.string().min(3, 'Tên giải tối thiểu 3 ký tự').max(100),
  slug: z
    .string()
    .min(3, 'Slug tối thiểu 3 ký tự')
    .max(80)
    .regex(/^[a-z0-9-]+$/, 'Slug chỉ gồm chữ thường, số và dấu gạch ngang'),
  description: z.string().max(500, 'Tối đa 500 ký tự').default(''),
  startDate: z.string().min(1, 'Bắt buộc'),
  endDate: z.string().min(1, 'Bắt buộc'),
  location: z.string().min(5, 'Địa điểm tối thiểu 5 ký tự').max(200),
}).refine(
  (d) => !d.startDate || !d.endDate || d.endDate >= d.startDate,
  { message: 'Ngày kết thúc phải sau ngày bắt đầu', path: ['endDate'] }
)

export type TournamentInfoFormData = z.infer<typeof tournamentInfoSchema>
