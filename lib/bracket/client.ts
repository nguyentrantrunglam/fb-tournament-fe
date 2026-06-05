import { api, ApiError } from '@/lib/api/client'
import type { CategoryBracket } from '@/lib/types/bracket'

export type SkeletonGroupKoBody = {
  groupCount: number
  qualifyPerGroup: number
}

/**
 * Fetch the active bracket for a category.
 * Returns null when no bracket has been built yet (404 SKELETON_NOT_FOUND).
 * Throws for all other error codes.
 */
export async function fetchBracket(categoryId: string): Promise<CategoryBracket | null> {
  try {
    return await api.get<CategoryBracket>(`/categories/${categoryId}/bracket`)
  } catch (err) {
    if (err instanceof ApiError && err.status === 404 && err.code === 'SKELETON_NOT_FOUND') {
      return null
    }
    throw err
  }
}

/**
 * Create the bracket skeleton for a category.
 * group_ko requires groupCount + qualifyPerGroup; other formats pass no body.
 */
export async function createSkeleton(
  categoryId: string,
  body?: SkeletonGroupKoBody,
): Promise<CategoryBracket> {
  return api.post<CategoryBracket>(`/categories/${categoryId}/bracket/skeleton`, body)
}

/**
 * Run the draw (or re-draw) for a category that already has a skeleton.
 * Increments drawVersion on the returned bracket.
 */
export async function drawBracket(categoryId: string): Promise<CategoryBracket> {
  return api.post<CategoryBracket>(`/categories/${categoryId}/bracket/draw`)
}
