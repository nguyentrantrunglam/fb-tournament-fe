'use client'

import { CheckCircle2, XCircle } from 'lucide-react'
import { cn } from '@/lib/utils'
import type { BulkRegisterSuccessItem, BulkRegisterErrorItem } from '@/lib/registrations/client'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'

type Props = {
  open: boolean
  onClose: () => void
  successes: BulkRegisterSuccessItem[]
  errors: BulkRegisterErrorItem[]
  /** Called when user clicks "Sửa lại dòng này" for an error row */
  onEditRow?: (rowIndex: number) => void
}

export function BulkResultTable({ open, onClose, successes, errors, onEditRow }: Props) {
  const total = successes.length + errors.length

  return (
    <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
      <DialogContent className="bg-zinc-900 border-zinc-800 text-white max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-white text-base">Kết quả bulk import</DialogTitle>
          <p className="text-[13px] text-zinc-400 mt-1">
            {total} dòng · {' '}
            <span className="text-emerald-400">{successes.length} thành công</span>
            {errors.length > 0 && (
              <>, <span className="text-red-400">{errors.length} lỗi</span></>
            )}
          </p>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto mt-2 space-y-1 pr-1">
          {/* Success rows */}
          {successes.map((s) => (
            <div
              key={s.registrationId}
              className="flex items-center gap-3 px-3 py-2 rounded-md bg-emerald-950/40 border border-emerald-900/40"
            >
              <CheckCircle2 className="w-4 h-4 text-emerald-400 flex-shrink-0" />
              <span className="text-[13px] text-emerald-300">
                Dòng {s.rowIndex + 1} — đăng ký #{s.registrationId.slice(-6)}
              </span>
            </div>
          ))}

          {/* Error rows */}
          {errors.map((e) => (
            <div
              key={e.rowIndex}
              className="flex items-start gap-3 px-3 py-2 rounded-md bg-red-950/40 border border-red-900/40"
            >
              <XCircle className="w-4 h-4 text-red-400 flex-shrink-0 mt-0.5" />
              <div className="flex-1 min-w-0">
                <p className="text-[13px] text-red-300">
                  Dòng {e.rowIndex + 1} — {e.message}
                </p>
                <p className="text-[11px] text-zinc-600 font-mono">{e.code}</p>
              </div>
              {onEditRow && (
                <button
                  type="button"
                  onClick={() => { onEditRow(e.rowIndex); onClose() }}
                  className={cn(
                    'flex-shrink-0 text-[12px] px-2 py-1 rounded border',
                    'border-zinc-700 text-zinc-400 hover:text-white hover:border-zinc-500 transition-colors',
                  )}
                >
                  Sửa lại dòng này
                </button>
              )}
            </div>
          ))}
        </div>

        <DialogFooter className="mt-4 bg-zinc-900 border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 rounded-md text-sm bg-orange-500 hover:bg-orange-400 text-white font-medium transition-colors"
          >
            Đóng
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
