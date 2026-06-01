# mockup

Phân tích ảnh design, đối chiếu nghiệp vụ, rồi build UI + logic cơ bản.

## Usage

```
/mockup <tên màn hình>
```

Sau khi gọi lệnh, đính kèm ảnh design vào tin nhắn tiếp theo (hoặc paste ảnh trực tiếp).

Ví dụ: `/mockup login` → user paste ảnh design màn hình đăng nhập.

## Instructions

### Bước 1 — Phân tích ảnh design

Khi nhận ảnh từ user, phân tích và liệt kê:

**Layout & Components:**
- Tất cả UI components nhìn thấy (button, input, card, table, modal, tab, badge, v.v.)
- Layout: grid/flex, spacing, responsive hints
- Typography: heading levels, label styles
- Color tokens: primary, secondary, destructive, muted, v.v.
- States thấy được: loading, empty, error, disabled

**UX Flows trong ảnh:**
- Các action user có thể thực hiện
- Navigation paths thấy được
- Form fields và validation hints

---

### Bước 2 — Đối chiếu nghiệp vụ

Đọc các tài liệu nghiệp vụ liên quan (chọn theo tên màn hình `$ARGUMENTS`):

- `docs/project-overview-pdr.md` — roles, rules, scope MVP
- `docs/system-architecture.md` — data schema, flows
- Phase plan tương ứng trong `plans/260528-1255-tournament-platform-mvp/` (ví dụ màn hình bracket → đọc phase-05)

Sau đó đưa ra **quyết định design** — chia 2 nhóm rõ ràng:

#### 🔴 Thay đổi bắt buộc (nghiệp vụ)

| Điểm | Thay đổi | Lý do |
|------|----------|-------|
| [element từ ảnh] | → [mô tả fix] | [rule PDR / domain cụ thể] |
| [element còn thiếu] | Thêm [field/component] | [bắt buộc theo spec] |

Áp dụng khi:
- Design thiếu field bắt buộc theo PDR (vd: CCCD 12 số)
- Design cho phép action mà role không có quyền
- Design vi phạm rule domain (vd: edit score match đã kết thúc mà không có flow cascade-revert)
- Design dùng term sai so với domain (vd: "player" thay vì "VĐV")

#### 🟡 Đề xuất thẩm mỹ / UX (không bắt buộc)

Đề xuất cải thiện dựa trên UX best practice, shadcn/ui patterns, và context sử dụng (mobile referee vs desktop organizer). Mỗi đề xuất cần có lý do cụ thể — không đề xuất chung chung.

Ví dụ các loại đề xuất:
- **Layout**: "Dùng Card thay List vì mỗi item có 4+ fields — Card scan dễ hơn trên mobile"
- **Density**: "Table phù hợp hơn Card grid ở đây vì organizer cần compare nhiều rows cùng lúc"
- **Hierarchy**: "Đưa status badge lên trên tên để scan nhanh tình trạng match"
- **Empty state**: "Thêm CTA vào empty state — user không biết làm gì tiếp theo"
- **Feedback**: "Thêm toast confirm sau submit form — hiện tại user không biết action thành công chưa"
- **Mobile**: "Nút action quá nhỏ cho trọng tài dùng trên sân — tăng touch target lên 44px"

Trình bày dưới dạng:
> 💡 **Đề xuất:** [mô tả thay đổi]
> **Lý do:** [tại sao tốt hơn trong context này]
> **Áp dụng:** Mặc định áp dụng vào code — ghi chú "design gốc dùng X, đã đổi sang Y" trong báo cáo bước 4.

User có thể revert nếu không đồng ý.

---

### Bước 3 — Build UI

Dựa vào design đã phân tích + quyết định ở bước 2:

**Tech constraints:**
- Framework: Next.js 15 App Router — dùng Server Component mặc định, Client Component (`"use client"`) chỉ khi cần interactivity/state
- UI primitives: shadcn/ui + Tailwind — dùng component có sẵn trước, extend sau
- Forms: React Hook Form + Zod schema
- Data fetching: TanStack Query cho client-side, RSC fetch cho server-side
- Auth guard: kiểm tra role từ Firebase Auth custom claims
- State minimal: Zustand chỉ cho global UI state (modal open, sidebar)

**Output files theo màn hình:**

```
app/
  (tên-route)/
    page.tsx          # RSC shell (layout + data fetch)
    _components/      # components riêng của route này
      ScreenName.tsx  # main Client Component (nếu cần interactivity)
      sub-components...
lib/
  validators/
    ten-man-hinh.ts   # Zod schema nếu có form
```

**Coding standards:**
- TypeScript strict — không dùng `any`
- Không comment giải thích WHAT code làm — chỉ comment WHY nếu logic non-obvious
- Không thêm feature ngoài scope màn hình đang build
- Placeholder data thay vì mock API call khi chưa có backend

**Logic cơ bản cần có:**
- Form validation (Zod schema + React Hook Form error display)
- Loading states (Skeleton hoặc spinner)
- Empty states (khi không có data)
- Error boundary / error state
- Role guard: redirect hoặc show 403 nếu role không đủ quyền
- Responsive: mobile-first (ưu tiên trọng tài nhập điểm trên mobile)

---

### Bước 4 — Báo cáo

Sau khi build xong:

1. **Files đã tạo/sửa** (với đường dẫn clickable)
2. **Thay đổi so với design gốc** — tách rõ: 🔴 bắt buộc (nghiệp vụ) vs 🟡 đề xuất thẩm mỹ đã áp dụng
3. **Việc còn lại** — những gì cần backend/CF thật để hoạt động hoàn chỉnh
4. **Cách test**: chạy `/emulator start` rồi navigate đến route

---

Nếu `$ARGUMENTS` trống, hỏi user: "Màn hình nào bạn muốn mockup? Vui lòng đính kèm ảnh design."
