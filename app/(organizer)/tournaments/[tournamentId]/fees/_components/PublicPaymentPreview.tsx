'use client'

import { QrCode } from 'lucide-react'
import { getBankByCode } from '@/lib/data/vn-banks'
import type { PaymentConfigFormData } from '@/lib/validators/payment-config'

// Bỏ dấu tiếng Việt + in hoa — nội dung CK ngân hàng chỉ nhận ASCII.
function toAsciiUpper(text: string): string {
  return text
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/đ/g, 'd')
    .replace(/Đ/g, 'D')
    .toUpperCase()
}

// Điền template bằng dữ liệu mẫu để BTC thấy nội dung CK thực tế.
const SAMPLE = {
  '{tên_VĐV}': 'Nguyen Van A',
  '{mã_hạng_mục}': 'MS',
  '{số_điện_thoại}': '0901234567',
} as const

function renderMemo(template: string): string {
  let out = template
  for (const [token, value] of Object.entries(SAMPLE)) {
    out = out.replaceAll(token, value)
  }
  return toAsciiUpper(out).replace(/\s+/g, ' ').trim()
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider">{label}</p>
      <p className="text-[14px] text-white mt-0.5 break-words">{value || '—'}</p>
    </div>
  )
}

export function PublicPaymentPreview({ data }: { data: PaymentConfigFormData }) {
  const bank = getBankByCode(data.bankCode)
  const memo = data.transferMemoTemplate ? renderMemo(data.transferMemoTemplate) : ''

  return (
    <aside>
      <p className="text-[10px] font-semibold text-zinc-500 uppercase tracking-widest mb-4">
        Preview · Trang public
      </p>

      <div className="rounded-xl border border-zinc-800 bg-zinc-950/50 p-5">
        <h3 className="text-[15px] font-semibold text-white mb-4">Thanh toán lệ phí</h3>

        <div className="flex gap-5">
          {/* QR */}
          <div className="w-32 h-32 flex-shrink-0 rounded-lg bg-zinc-800/60 border border-zinc-800 flex items-center justify-center overflow-hidden">
            {data.qrUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={data.qrUrl} alt="QR" className="w-full h-full object-contain p-2" />
            ) : (
              <QrCode className="w-10 h-10 text-zinc-700" />
            )}
          </div>

          {/* Account info */}
          <div className="flex-1 min-w-0 space-y-3">
            <Row label="Chủ tài khoản" value={data.accountHolder} />
            <Row label="Số tài khoản" value={data.accountNumber} />
            <Row label="Ngân hàng" value={bank?.shortName ?? data.bankCode} />
          </div>
        </div>

        <div className="mt-5">
          <p className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider mb-1.5">
            Nội dung CK
          </p>
          <div className="rounded-md border border-orange-900/50 bg-orange-950/20 px-3 py-2.5">
            <p className="font-mono text-[13px] text-orange-300 break-words">
              {memo || '— chưa có template —'}
            </p>
          </div>
        </div>
      </div>

      <p className="text-center text-[12px] text-zinc-500 mt-4">
        Quét bằng app ngân hàng để chuyển khoản
      </p>
    </aside>
  )
}
