'use client'

import { useState } from 'react'
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type GroupKoConfig = {
  groupCount: number
  qualifyPerGroup: number
}

type Props = {
  open: boolean
  onOpenChange: (open: boolean) => void
  onConfirm: (config: GroupKoConfig) => void
  isPending: boolean
}

export function GroupKoConfigDialog({ open, onOpenChange, onConfirm, isPending }: Props) {
  const [groupCount, setGroupCount] = useState('4')
  const [qualifyPerGroup, setQualifyPerGroup] = useState('1')

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    const gc = parseInt(groupCount, 10)
    const qpg = parseInt(qualifyPerGroup, 10)
    if (!gc || gc < 2 || !qpg || qpg < 1) return
    onConfirm({ groupCount: gc, qualifyPerGroup: qpg })
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <DialogTitle>Cấu hình vòng bảng</DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-2">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="groupCount">Số bảng</Label>
            <Input
              id="groupCount"
              type="number"
              min={2}
              max={16}
              value={groupCount}
              onChange={(e) => setGroupCount(e.target.value)}
              required
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <Label htmlFor="qualifyPerGroup">Số đội đi tiếp mỗi bảng</Label>
            <Input
              id="qualifyPerGroup"
              type="number"
              min={1}
              max={8}
              value={qualifyPerGroup}
              onChange={(e) => setQualifyPerGroup(e.target.value)}
              required
            />
          </div>

          <DialogFooter className="pt-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isPending}
            >
              Huỷ
            </Button>
            <Button type="submit" disabled={isPending}>
              {isPending ? 'Đang dựng…' : 'Dựng khung'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
