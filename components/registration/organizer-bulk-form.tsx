'use client'

import { useCallback, useState } from 'react'
import { Plus, Trash2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { useBulkRegister } from '@/lib/registrations/queries'
import { BulkResultTable } from './bulk-result-table'
import { PartnerPicker } from './partner-picker'
import type { CategoryWithStats } from '@/lib/types/category'
import type { SearchUsersResult, BulkRegisterSuccessItem, BulkRegisterErrorItem } from '@/lib/registrations/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

const MAX_ROWS = 50

const selectCls = cn(
  'w-full bg-zinc-800 border border-zinc-700 rounded-md px-2 py-1.5',
  'text-[13px] text-white',
  'focus:outline-none focus:ring-1 focus:ring-orange-500 focus:border-orange-500',
  'cursor-pointer transition-colors',
)

type BulkRow = {
  id: number // local key only
  categoryId: string
  primary: SearchUsersResult | null
  partner: SearchUsersResult | null
}

function emptyRow(id: number): BulkRow {
  return { id, categoryId: '', primary: null, partner: null }
}

type Props = {
  open: boolean
  onOpenChange: (v: boolean) => void
  tournamentId: string
  categories: CategoryWithStats[]
  onDone?: () => void
}

export function OrganizerBulkForm({
  open,
  onOpenChange,
  tournamentId,
  categories,
  onDone,
}: Props) {
  const [nextId, setNextId] = useState(1)
  const [rows, setRows] = useState<BulkRow[]>([emptyRow(0)])
  const [resultOpen, setResultOpen] = useState(false)
  const [successes, setSuccesses] = useState<BulkRegisterSuccessItem[]>([])
  const [errors, setErrors] = useState<BulkRegisterErrorItem[]>([])

  const mutation = useBulkRegister(tournamentId)

  function addRow() {
    if (rows.length >= MAX_ROWS) return
    setRows((r) => [...r, emptyRow(nextId)])
    setNextId((n) => n + 1)
  }

  function removeRow(id: number) {
    setRows((r) => (r.length > 1 ? r.filter((row) => row.id !== id) : r))
  }

  function updateRow(id: number, patch: Partial<BulkRow>) {
    setRows((r) =>
      r.map((row) => {
        if (row.id !== id) return row
        const updated = { ...row, ...patch }
        // Reset partner when category changes (doubles requirement may differ)
        if ('categoryId' in patch) updated.partner = null
        return updated
      }),
    )
  }

  function getCat(categoryId: string): CategoryWithStats | undefined {
    return categories.find((c) => c.id === categoryId)
  }

  function handleClose() {
    onOpenChange(false)
    setRows([emptyRow(0)])
    setNextId(1)
  }

  const handleEditRow = useCallback((rowIndex: number) => {
    // rowIndex is the position in the submitted batch (same order as rows state)
    // Scroll / highlight not implemented; user closes result modal and edits manually
    void rowIndex
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const payload = rows
      .filter((r) => r.categoryId && r.primary)
      .map((r) => ({
        categoryId: r.categoryId,
        primaryUserId: r.primary!.id,
        ...(r.partner ? { partnerUserId: r.partner.id } : {}),
      }))

    if (payload.length === 0) return

    try {
      const result = await mutation.mutateAsync(payload)
      setSuccesses(result.success)
      setErrors(result.errors)
      setResultOpen(true)
      if (result.errors.length === 0) {
        onDone?.()
        handleClose()
      }
    } catch {
      // Network-level errors — mutation cache shows toast
    }
  }

  const openCats = categories.filter((c) => c.registrationStatus === 'open')

  return (
    <>
      <Dialog open={open} onOpenChange={(v) => !v && handleClose()}>
        <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-[720px] max-h-[85vh] flex flex-col">
          <DialogHeader>
            <DialogTitle className="text-white text-base">Bulk import đăng ký</DialogTitle>
            <p className="text-[12px] text-zinc-500 mt-0.5">
              Tối đa {MAX_ROWS} dòng. Partial commit — dòng thành công vẫn lưu khi có dòng lỗi.
            </p>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="flex flex-col flex-1 min-h-0">
            {/* Column headers */}
            <div className="grid grid-cols-[1fr_1fr_1fr_32px] gap-2 px-1 pb-1 text-[10px] font-semibold text-zinc-500 uppercase tracking-wider">
              <span>Hạng mục</span>
              <span>VĐV chính</span>
              <span>Partner (nếu đôi)</span>
              <span />
            </div>

            {/* Scrollable rows */}
            <div className="flex-1 overflow-y-auto space-y-2 pr-1">
              {rows.map((row, idx) => {
                const cat = getCat(row.categoryId)
                const isDoubles = cat?.playerCount === 2
                return (
                  <div
                    key={row.id}
                    className="grid grid-cols-[1fr_1fr_1fr_32px] gap-2 items-start"
                  >
                    {/* Category */}
                    <select
                      value={row.categoryId}
                      onChange={(e) => updateRow(row.id, { categoryId: e.target.value })}
                      className={selectCls}
                    >
                      <option value="">— Chọn —</option>
                      {openCats.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code}
                        </option>
                      ))}
                    </select>

                    {/* Primary athlete */}
                    <PartnerPicker
                      tournamentId={tournamentId}
                      primaryGender={null}
                      genderRequirement={cat?.genderRequirement ?? 'unrestricted'}
                      value={row.primary}
                      onChange={(u) => updateRow(row.id, { primary: u, partner: null })}
                      excludeIds={[]}
                    />

                    {/* Partner */}
                    {isDoubles ? (
                      <PartnerPicker
                        tournamentId={tournamentId}
                        primaryGender={row.primary?.gender ?? null}
                        genderRequirement={cat!.genderRequirement}
                        value={row.partner}
                        onChange={(u) => updateRow(row.id, { partner: u })}
                        excludeIds={row.primary ? [row.primary.id] : []}
                      />
                    ) : (
                      <div className="py-2 text-[13px] text-zinc-600 px-2">—</div>
                    )}

                    {/* Remove row */}
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
                      disabled={rows.length === 1}
                      className="mt-1 p-1 text-zinc-600 hover:text-red-400 disabled:opacity-30 transition-colors"
                      aria-label={`Xoá dòng ${idx + 1}`}
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                )
              })}
            </div>

            {/* Add row */}
            {rows.length < MAX_ROWS && (
              <button
                type="button"
                onClick={addRow}
                className="mt-3 flex items-center gap-1.5 text-[13px] text-zinc-400 hover:text-white transition-colors self-start"
              >
                <Plus className="w-3.5 h-3.5" /> Thêm dòng
              </button>
            )}

            <DialogFooter className="mt-4 gap-2 bg-zinc-900 border-zinc-800">
              <button
                type="button"
                onClick={handleClose}
                className="px-4 py-2 rounded-md text-sm border border-zinc-700 text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors"
              >
                Huỷ
              </button>
              <button
                type="submit"
                disabled={mutation.isPending}
                className={cn(
                  'px-4 py-2 rounded-md text-sm font-medium transition-colors',
                  mutation.isPending
                    ? 'bg-zinc-700 text-zinc-500 cursor-not-allowed'
                    : 'bg-orange-500 hover:bg-orange-400 text-white',
                )}
              >
                {mutation.isPending
                  ? 'Đang xử lý…'
                  : `Import ${rows.filter((r) => r.categoryId && r.primary).length} dòng`}
              </button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <BulkResultTable
        open={resultOpen}
        onClose={() => { setResultOpen(false); if (errors.length === 0) handleClose() }}
        successes={successes}
        errors={errors}
        onEditRow={handleEditRow}
      />
    </>
  )
}
