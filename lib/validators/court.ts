import { z } from 'zod'

export const addCourtSchema = z.object({
  name: z
    .string()
    .min(1, 'Nhập tên sân')
    .max(40, 'Tên sân quá dài'),
})

export type AddCourtInput = z.infer<typeof addCourtSchema>
