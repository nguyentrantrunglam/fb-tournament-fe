import { z } from 'zod'

// Self-register: current user is primary; partner optional (doubles categories)
export const selfRegisterSchema = z.object({
  partnerUserId: z.string().optional(),
})

// Organizer single: explicitly pick primary + optional partner
export const organizerSingleSchema = z.object({
  categoryId: z.string().min(1, 'Chọn hạng mục'),
  primaryUserId: z.string().min(1, 'Chọn VĐV chính'),
  partnerUserId: z.string().optional(),
})

// One row in bulk register
export const bulkRowSchema = z.object({
  categoryId: z.string().min(1),
  primaryUserId: z.string().min(1),
  partnerUserId: z.string().optional(),
})

// Full bulk register body (≤50 rows enforced client-side before submit)
export const bulkRegisterSchema = z.object({
  rows: z
    .array(bulkRowSchema)
    .min(1, 'Cần ít nhất 1 dòng')
    .max(50, 'Tối đa 50 dòng mỗi lần'),
})

// Set seed: integer ≥ 1, null = clear
export const seedSchema = z.object({
  seed: z.union([z.number().int().min(1, 'Seed tối thiểu 1'), z.null()]),
})

// Reject with optional reason
export const rejectSchema = z.object({
  reason: z.string().optional(),
})

export type SelfRegisterInput = z.infer<typeof selfRegisterSchema>
export type OrganizerSingleInput = z.infer<typeof organizerSingleSchema>
export type BulkRowInput = z.infer<typeof bulkRowSchema>
export type BulkRegisterInput = z.infer<typeof bulkRegisterSchema>
export type SeedInput = z.infer<typeof seedSchema>
export type RejectInput = z.infer<typeof rejectSchema>
