import { z } from 'zod'

export const createCategorySchema = z
  .object({
    code: z
      .string()
      .min(2, 'Mã tối thiểu 2 ký tự')
      .max(12, 'Mã tối đa 12 ký tự')
      .regex(/^[A-Z0-9_-]+$/, 'Chỉ dùng chữ hoa, số, _ hoặc -'),
    name: z.string().min(1, 'Tên không được để trống').max(100, 'Tên tối đa 100 ký tự'),
    playerCount: z.union([z.literal(1), z.literal(2)]),
    genderRequirement: z.enum(['men_only', 'women_only', 'mixed_pair', 'unrestricted']),
    bestOf: z.union([z.literal(1), z.literal(3), z.literal(5)]),
    fee: z.number().min(0, 'Lệ phí không âm'),
    maxTeams: z.number().min(2, 'Ít nhất 2 đội').max(256, 'Tối đa 256 đội'),
    registrationDeadline: z.string().min(1, 'Chọn hạn đăng ký'),
  })
  .refine(
    (d) => !(d.genderRequirement === 'mixed_pair' && d.playerCount === 1),
    {
      message: 'Đôi nam-nữ (mixed_pair) chỉ áp dụng cho nội dung đôi — 2 người',
      path: ['genderRequirement'],
    }
  )

export type CreateCategoryInput = z.infer<typeof createCategorySchema>
