/**
 * Mẫu điều lệ dựng sẵn — apply qua nút "Dùng template" trên tab Điều lệ.
 * Mỗi template được chuyển sang markdown (## tiêu đề + nội dung) đổ vào editor.
 */

export type RuleTemplateSection = {
  title: string
  body: string
}

export type RuleTemplate = {
  id: string
  name: string
  description: string
  sections: RuleTemplateSection[]
}

const KOLS_FBSHOP_LAN_3: RuleTemplate = {
  id: 'kols-fbshop-lan-3',
  name: 'Giải KOLs FBShop Lần 3',
  description: 'Đôi Nam Nữ KOL Cầu Lông – vòng tròn 1 lượt 25 điểm + KO trực tiếp, miễn phí lệ phí.',
  sections: [
    {
      title: 'Thông tin chung',
      body: `Giải Cầu Lông KOLs FBShop Lần 3 do FB Sport tổ chức dành riêng cho các nhà sáng tạo nội dung về cầu lông.

• Hạn đăng ký: 19/5/2026
• Bốc thăm: 22/5/2026
• Ngày thi đấu: 24/5/2026
• Địa điểm: Sân cầu lông FBShop – 918 Kim Giang, Thanh Liệt, Hà Nội`,
    },
    {
      title: 'Đối tượng & điều kiện tham dự',
      body: `TIÊU CHÍ VẬN ĐỘNG VIÊN

• Nhà sáng tạo nội dung về Cầu Lông sở hữu trang cá nhân có ít nhất 10.000 lượt theo dõi (follower) trên các nền tảng mạng xã hội như Facebook, YouTube, TikTok, Instagram… (Không bao gồm các trang có tên cộng đồng – ví dụ: Theanh28, Beatvn,...).

• Nhà sáng tạo nội dung về Cầu Lông tiềm năng: sở hữu trang cá nhân có nhiều video có lượng xem và tương tác lớn trên các nền tảng mạng xã hội như Facebook, YouTube, TikTok, Instagram… (Không bao gồm các trang có tên cộng đồng – ví dụ: Theanh28, Beatvn,...).

• Khách mời của FB Sport.

– Mỗi nhà sáng tạo nội dung phải tạo ít nhất 2 video truyền thông liên quan đến giải đấu và đăng trên trang cá nhân trước hoặc sau thời gian tổ chức giải.

– Danh sách VĐV cuối cùng sẽ được quyết định bởi Ban Tổ Chức.

VĐV KHÔNG ĐƯỢC THAM GIA

• Các VĐV đã hoặc đang được hưởng chế độ, tập luyện, thi đấu cho các đơn vị tỉnh, thành, ngành tại các giải do Liên đoàn Cầu Lông Việt Nam tổ chức như: vô địch cá nhân, vô địch đồng đội, giải cây vợt xuất sắc, giải trẻ, giải các nhóm tuổi, giải CLB toàn quốc (các nhóm tuổi)... từ năm 2022 đến nay.

• Nhà sáng tạo có lượng follower lớn, nhưng không đăng tải video về cầu lông trong thời gian dài.`,
    },
    {
      title: 'Lệ phí & thanh toán',
      body: `MIỄN PHÍ LỆ PHÍ — VĐV không phải đóng bất kỳ khoản lệ phí nào khi tham gia giải.

Nhà tài trợ và đơn vị tổ chức (FB Sport · FBShop) chịu toàn bộ chi phí vận hành, sân bãi, cầu thi đấu, trọng tài và giải thưởng.`,
    },
    {
      title: 'Nội dung thi đấu',
      body: `Nội dung duy nhất: ĐÔI NAM NỮ
Đối tượng: Không phân biệt lứa tuổi.`,
    },
    {
      title: 'Thể thức & luật trận',
      body: `GHÉP CẶP THEO HẠNG

• Nam hạng A sẽ cặp với nữ hạng B
• Nam hạng B sẽ cặp với nữ hạng A

BTC sẽ đánh giá và phân loại VĐV phù hợp với tiêu chí của giải đấu, bốc thăm ngẫu nhiên để ghép cặp.

THỂ THỨC VÒNG BẢNG

– BTC áp dụng thể thức thi đấu vòng tròn một lượt tính điểm, mỗi bảng 3–4 đôi (thắng 1 trận được 01 điểm), mỗi hiệp 25 điểm (cách 2, chạm 30).

– Nếu 02 đôi trong bảng có cùng số điểm sẽ tính đến kết quả đối kháng để xác định vị trí trong bảng.

– Nếu 03 đôi trong bảng có cùng số điểm sẽ tính lần lượt theo hiệu số thắng – thua: số hiệp, số điểm, đối kháng, bốc thăm.

VÒNG ĐẤU LOẠI TRỰC TIẾP

Tùy thuộc vào số lượng VĐV đăng ký, BTC sẽ quyết định số đôi VĐV lọt vào vòng đấu loại trực tiếp.

⚠ LƯU Ý

– Nếu VĐV hoặc đôi bỏ cuộc 01 trận trong bảng sẽ hủy tất cả kết quả thi đấu của VĐV/đôi đó.`,
    },
    { title: 'Trang phục & dụng cụ', body: '' },
    { title: 'Giải thưởng', body: '' },
    { title: 'Khiếu nại & kỷ luật', body: '' },
    { title: 'Liên hệ BTC', body: '' },
  ],
}

export const RULE_TEMPLATES: RuleTemplate[] = [KOLS_FBSHOP_LAN_3]

export function getRuleTemplate(id: string): RuleTemplate | undefined {
  return RULE_TEMPLATES.find((t) => t.id === id)
}

// Chuyển template → markdown (## tiêu đề + nội dung) để đổ vào editor điều lệ.
export function templateToMarkdown(t: RuleTemplate): string {
  return t.sections.map((s) => `## ${s.title}\n\n${s.body}`.trimEnd()).join('\n\n')
}
