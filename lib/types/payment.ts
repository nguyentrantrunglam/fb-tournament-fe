// Cấu hình thanh toán của giải (= Tournament.paymentConfig). Lệ phí thu NGOÀI app —
// BTC đánh dấu paid thủ công (xem PDR Payment Tracking). Màn Lệ phí & QR cấu hình
// thông tin nhận tiền + QR hiển thị ở trang public.
export type PaymentConfig = {
  accountHolder: string         // tên chủ tài khoản (in hoa theo chuẩn NH)
  accountNumber: string         // số tài khoản
  bankCode: string              // mã napas, vd "ICB"
  transferMemoTemplate: string  // template nội dung CK, vd "SAIGON26 {tên_VĐV} {mã_hạng_mục}"
  qrUrl: string | null          // ảnh QR upload (MVP không tự gen từ STK)
}

// Biến cho phép trong transferMemoTemplate
export const MEMO_VARIABLES = ['{tên_VĐV}', '{mã_hạng_mục}', '{số_điện_thoại}'] as const
