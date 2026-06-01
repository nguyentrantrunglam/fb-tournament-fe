// Danh sách ngân hàng VN phổ biến (mã napas dùng cho VietQR).
// Rút gọn cho MVP — bổ sung khi cần.
export type VnBank = { code: string; shortName: string; fullName: string }

export const VN_BANKS: VnBank[] = [
  { code: 'ICB', shortName: 'VietinBank', fullName: 'Ngân hàng TMCP Công Thương Việt Nam' },
  { code: 'VCB', shortName: 'Vietcombank', fullName: 'Ngân hàng TMCP Ngoại Thương Việt Nam' },
  { code: 'BIDV', shortName: 'BIDV', fullName: 'Ngân hàng TMCP Đầu tư và Phát triển Việt Nam' },
  { code: 'VBA', shortName: 'Agribank', fullName: 'Ngân hàng Nông nghiệp và Phát triển Nông thôn' },
  { code: 'TCB', shortName: 'Techcombank', fullName: 'Ngân hàng TMCP Kỹ Thương Việt Nam' },
  { code: 'MB', shortName: 'MB Bank', fullName: 'Ngân hàng TMCP Quân Đội' },
  { code: 'ACB', shortName: 'ACB', fullName: 'Ngân hàng TMCP Á Châu' },
  { code: 'VPB', shortName: 'VPBank', fullName: 'Ngân hàng TMCP Việt Nam Thịnh Vượng' },
  { code: 'TPB', shortName: 'TPBank', fullName: 'Ngân hàng TMCP Tiên Phong' },
  { code: 'STB', shortName: 'Sacombank', fullName: 'Ngân hàng TMCP Sài Gòn Thương Tín' },
  { code: 'MSB', shortName: 'MSB', fullName: 'Ngân hàng TMCP Hàng Hải' },
  { code: 'VIB', shortName: 'VIB', fullName: 'Ngân hàng TMCP Quốc Tế Việt Nam' },
]

export function getBankByCode(code: string): VnBank | undefined {
  return VN_BANKS.find((b) => b.code === code)
}

// Label hiển thị: "VietinBank (ICB)"
export function bankLabel(bank: VnBank): string {
  return `${bank.shortName} (${bank.code})`
}
