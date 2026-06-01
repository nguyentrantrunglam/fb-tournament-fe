# Design Brief — Nền tảng Quản lý Giải đấu Cầu lông

> **Status:** Draft v0.1 — sẵn sàng gửi cho AI design tool
> **Ngày:** 2026-05-28
> **Đi kèm spec:** [project-overview-pdr.md](project-overview-pdr.md), [system-architecture.md](system-architecture.md), [bracket-algorithm-spec.md](bracket-algorithm-spec.md)

---

## 1. Bối cảnh sản phẩm

Web platform **công khai** cho cộng đồng cầu lông phong trào Việt Nam. Cho phép bất kỳ ai tạo tài khoản (đồng thời là VĐV), được trao quyền tạo & quản lý giải đấu, đăng ký tham gia, làm trọng tài, hoặc xem realtime công khai.

**Người dùng (5 vai trò):**
- **Khán giả** (chưa đăng nhập): xem giải công khai, sơ đồ, lịch, kết quả realtime.
- **VĐV** (mọi user): đăng ký giải, xem giải đã đăng ký.
- **Trọng tài** (được mời cho 1 giải): nhập điểm các trận được giao.
- **Organizer / BTC** (được cấp quyền cho 1 giải): tạo giải, cấu hình, vận hành.
- **Admin** (platform): cấp quyền cho user.

## 2. Design system constraints

- **Stack:** Next.js 15 App Router + shadcn/ui (Radix + Tailwind CSS).
- **Ngôn ngữ:** Tiếng Việt 100%, KHÔNG đa ngôn ngữ.
- **Responsive:** Mobile-first từ 360px (iPhone SE), desktop ≥1280px.
- **Accessibility:** WCAG AA, contrast > 4.5:1, keyboard navigation.
- **Tone:** Thân thiện, năng động, thể thao — không quá formal.
- **Iconography:** Lucide React.
- **Typography:** Inter hoặc Be Vietnam Pro (hỗ trợ tiếng Việt tốt).

## 2.1 Visual Style Reference (LOCKED — theo screenshot tham chiếu)

**Phong cách tổng:** Dark fintech/SaaS dashboard kiểu Linear / Vercel / Cron. Generous whitespace, gradient subtle, accent màu cam, hierarchy rõ ràng qua typography weight + opacity.

### Color palette (Tailwind tokens gợi ý)

| Token | Hex | Dùng cho |
|---|---|---|
| `bg.app` | `#0A0A0B` | App background (near-black) |
| `bg.surface` | `#15181D` | Card / panel surface |
| `bg.surface-2` | `#1B1F25` | Card elevated / hover state |
| `border.subtle` | `rgba(255,255,255,0.06)` | Card borders, dividers |
| `border.strong` | `rgba(255,255,255,0.12)` | Active border, focus ring |
| `accent.primary` | `#F97316` (orange-500) | Primary CTA, active step, key emphasis |
| `accent.primary-hover` | `#EA580C` (orange-600) | Hover state |
| `success` | `#10B981` (emerald-500) | Completed step, paid badge, checkmark |
| `warning` | `#F59E0B` (amber-500) | Cảnh báo, conflict |
| `danger` | `#EF4444` (red-500) | Destructive action, live indicator |
| `info` | `#0EA5E9` (sky-500) | Informational notifications |
| `text.primary` | `#FAFAFA` | Heading + body chính |
| `text.muted` | `#A1A1AA` (zinc-400) | Label, sub-text, breadcrumb |
| `text.dim` | `#71717A` (zinc-500) | Placeholder, meta |

**Dark theme = default**. Light mode optional, secondary.

### Layout architecture

```
┌────────────────────────────────────────────────────────────────────┐
│  Top Bar (height 64px)                                             │
│  Breadcrumb           Workflow Stepper (6 steps)        🔔  👤      │
├──────────────┬─────────────────────────────────────────────────────┤
│              │                                                     │
│  Sidebar     │  Main Content (max-width 1440px, padding 32px)      │
│  (260px)     │                                                     │
│              │  ┌─ Hero Card ──────────────────────────────────┐   │
│  Brand       │  │ Tournament name, location, dates, badges      │   │
│              │  └─────────────────────────────────────────────┘   │
│  Tournament  │                                                     │
│  context     │  ┌─ KPI Grid (4 cols) ──────────────────────────┐   │
│  (active)    │  │ [big#] [big#] [big#] [big#]                  │   │
│              │  └─────────────────────────────────────────────┘   │
│  Nav         │                                                     │
│  sections:   │  ┌─ Main panels (2 cols) ───────────────────────┐   │
│  - Tổng quan │  │ Checklist     │  Hạng mục list                │   │
│  - S1·CẤU    │  └─────────────────────────────────────────────┘   │
│    HÌNH      │                                                     │
│  - S2·ĐĂNG   │  ┌─ Activity / Alerts (2 cols) ─────────────────┐   │
│    KÝ        │  │ Hoạt động     │  Cảnh báo                    │   │
│  - S3·BỐC    │  └─────────────────────────────────────────────┘   │
│    THĂM      │                                                     │
│  - VẬN HÀNH  │                                                     │
│              │                                                     │
│  User info   │                                                     │
└──────────────┴─────────────────────────────────────────────────────┘
```

### Sidebar pattern (organizer view)

- **Width:** 260px desktop. Mobile: drawer overlay.
- **Brand block** top: logo small + "FB Tournament" + tagline muted "Quản lý giải cầu lông".
- **Tournament context** card: tên giải + status badge (cam dot + "Bốc thăm" hoặc state hiện tại). Tap → back to giải list.
- **Nav sections** with section labels uppercase muted (`text.muted`, size 11px, tracking-wide):
  - `TỔNG QUAN`
  - `S1·CẤU HÌNH` — Thông tin giải, Nội dung [count], Trọng tài [count], Sân thi đấu [count], Lệ phí & QR
  - `S2·ĐĂNG KÝ` — Đăng ký [count], Danh sách đội [count]
  - `S3·BỐC THĂM & LẬP LỊCH` — Sơ đồ, Cấu hình bán kết, Lịch & trận
  - `VẬN HÀNH` — Vận hành LIVE (icon lock 🔒 nếu chưa enabled)
  - `TÀI KHOẢN` — Thông báo, Cài đặt giải
- **Nav item:** icon Lucide + label + optional count badge bên phải. Hover bg `surface-2`. Active = bg `surface-2` + left border accent cam 2px.
- **User info** bottom: avatar circle + tên + role muted.

### Top bar pattern

- **Left:** breadcrumb path (cha `>` con muted, current bold).
- **Center:** **Workflow stepper** ngang — 6 step numbered circles + label:
  - `1 Cấu hình ✓` (completed = green check + emerald text)
  - `2 Mở đăng ký ✓`
  - `3 Bốc thăm ✓`
  - `4 Sẵn sàng` (active = orange filled circle + orange text)
  - `5 Vận hành` (upcoming = ring outline + muted text)
  - `6 Kết thúc`
  - Connector line giữa steps: green if completed, muted if upcoming.
- **Right:** notification bell badge + user avatar dropdown.

### Hero card pattern (tournament page header)

- Padding 24px, radius 12px, bg `surface`, subtle border.
- Big title `text.primary` 28px bold.
- Meta row: icon + text muted — địa điểm | ngày | tổng hạng mục.
- Top-right: trạng thái badge (cam dot + label) + 2 buttons "← Lùi" outlined + "Tiếp →" filled accent.

### KPI card pattern

- 4 column grid, gap 16px.
- Mỗi card: padding 20px, radius 12px, bg `surface`, subtle border, **subtle gradient overlay** (top-left to bottom-right, opacity 5-10%).
- Top: label uppercase muted 11px tracking-wide (vd: `ĐĂNG KÝ`).
- Middle: **huge number** `text.primary` 40px bold (vd: `65`).
- Bottom: sub-text muted nhỏ (vd: `👥 trên 72 chỗ`).
- Optional: thin colored progress bar bottom (cam / xanh / amber theo nghĩa).

### Checklist card pattern

- Title bold + sub-title muted.
- Each row: large circle icon (✓ green nếu done, empty circle if not) + label + sub-label + chevron right.
- Click row → mở detail page.

### List card pattern (hạng mục)

- Title bold + count + link "Xem tất cả →" muted top-right.
- Each row: thumbnail/initials chip + label + sub-text + count badge right + progress bar dài bên dưới label.

### Activity timeline pattern

- Title bold.
- Each item: icon circle (color theo type: success / info / warning) + main text + sub-text muted + time-ago muted right.

### Alerts card pattern

- Title bold + count badge.
- Each alert: icon (warning amber / info sky) + title bold + body muted + button outlined "Mở [action] →".

### Buttons

- **Primary:** bg `accent.primary` solid, white text, padding 10x16, radius 8. Hover bg `accent.primary-hover`. Có arrow icon nếu là CTA chuyển bước.
- **Secondary outlined:** transparent bg + border `border.strong` + text primary. Hover bg `surface-2`.
- **Ghost text:** chỉ text + chevron, no bg/border. Dùng cho link "Xem tất cả".
- **Destructive:** bg `danger` solid hoặc outlined đỏ.

### Badges & dots

- **Status badge:** pill radius 6, padding 2x8, bg fill alpha 15% màu + text màu đậm, có thể có dot.
  - vd: cam dot + "Bốc thăm" cho status `drawing`.
  - Green check + "Hoàn tất" cho status `completed`.
- **Count badge:** bg `surface-2`, text muted, padding 2x6, radius 4.

### Forms & inputs (chưa thấy trong screenshot, suy ra)

- Input: bg `surface-2` + border `border.subtle` + text primary + label muted above + radius 8.
- Focus: border `accent.primary` + 1px ring.
- Error: border `danger` + helper text màu danger.

### Cards stack & dividers

- Vertical gap giữa card sections: 24px.
- Inside card: dividers `border.subtle` 1px, padding 16-20px sections.
- Radius unified: 8px (small) / 12px (card) / 16px (modal).

### Iconography rules

- Lucide React only.
- Stroke width 1.5-2.
- Size 16/20/24 theo context (inline / button / hero).
- Icon color = `text.muted` mặc định, primary khi accent context.

## 3. Information Architecture

**Routes chính:**

```
/                                              Homepage (public)
/giai/[slug]                                   Tournament detail (public)
/giai/[slug]/[code]                            Category page
/giai/[slug]/[code]/bracket                    Bracket interactive
/giai/[slug]/lich                              Schedule timeline
/dang-nhap, /dang-ky, /quen-mat-khau           Auth
/ho-so                                         User profile
/trang-chu                                     User dashboard (sau đăng nhập)
/dang-ky-giai/[slug]/[code]                    Register form
/giai/[slug]/quan-ly                           Organizer dashboard (Tổng quan)
/giai/[slug]/quan-ly/thong-tin                 Thông tin giải
/giai/[slug]/quan-ly/noi-dung                  Hạng mục list/CRUD
/giai/[slug]/quan-ly/trong-tai                 Trọng tài pool
/giai/[slug]/quan-ly/san                       Sân thi đấu
/giai/[slug]/quan-ly/le-phi                    Lệ phí & QR
/giai/[slug]/quan-ly/dang-ky                   Đăng ký list
/giai/[slug]/quan-ly/danh-sach-doi             Danh sách đội (sau closed)
/giai/[slug]/quan-ly/so-do                     Sơ đồ + bốc thăm
/giai/[slug]/quan-ly/lich                      Lịch & trận
/giai/[slug]/dieu-hanh                         Vận hành LIVE (Operations Console)
/trong-tai                                     Referee dashboard
/trong-tai/[matchId]                           Match scoring
/admin/users                                   Admin user management
```

**Sidebar nav structure** (theo Visual Style §2.1):
- `TỔNG QUAN` — `/quan-ly` dashboard
- `S1·CẤU HÌNH` — Thông tin giải, Nội dung, Trọng tài, Sân thi đấu, Lệ phí & QR
- `S2·ĐĂNG KÝ` — Đăng ký, Danh sách đội
- `S3·BỐC THĂM & LẬP LỊCH` — Sơ đồ, Cấu hình bán kết (re-arrange), Lịch & trận
- `VẬN HÀNH` — Vận hành LIVE (lock icon nếu chưa enabled)
- `TÀI KHOẢN` — Thông báo, Cài đặt giải

## 4. Priority Screens cần design (15 screens)

| # | Screen | Vai trò | Độ ưu tiên | Đặc thù UX |
|---|---|---|---|---|
| 1 | **Homepage** | Public | P0 | Hero + grid card giải đang/sắp/đã diễn ra |
| 2 | **Sign-up form** | Public | P0 | Multi-field: email, password, họ tên, CCCD (12 số), giới tính, ngày sinh — validate inline tiếng Việt |
| 3 | **Tournament detail page** (public) | Public | P0 | Banner full-width, info, sponsors strip, payment QR, list categories |
| 4 | **Category page** (sau đóng đăng ký) | Public | P0 | Grid team cards (đôi: 2 avatar overlap), badge VĐV |
| 5 | **Bracket viewer** | Public | P0 | Sơ đồ tree CSS grid, mỗi match card 2-side, line connect, click → modal detail. Responsive: mobile horizontal scroll. |
| 6 | **Match detail modal** | Public | P0 | Realtime: live indicator, games breakdown, side A/B với composite avatar |
| 7 | **Tournament setup wizard** (organizer) | Organizer | P0 | 4-step: basic info → detail (banner, rules, sponsors, payment QR) → courts → first category |
| 7b | **Tournament dashboard "Tổng quan"** (organizer) | Organizer | P0 | **Reference design** (xem §2.1 visual style) — sidebar nav + top stepper + hero card + 4 KPI cards (Đăng ký / Đã xác nhận / Chờ lệ phí / Lệ phí thu) + "Bước tiếp theo" checklist + "Hạng mục" list + "Hoạt động gần đây" + "Cảnh báo" |
| 8 | **Category form** | Organizer | P0 | Code, name, `playerCount` + `genderRequirement` dropdowns, format, bestOf, deadline, fee, maxTeams |
| 9 | **Registration list** (organizer) | Organizer | P0 | Tab filter status (pending/approved/rejected/withdrawn) + payment badge, bulk actions, search |
| 10 | **Bulk register form** | Organizer | P1 | Multi-row table, add/remove row, validate per row, kết quả modal: success/error rows |
| 11 | **Config đội page** | Organizer | P1 | Card mỗi registration: tên VĐV, ảnh đội (default composite, upload override), input seed |
| 12 | **Operations Console** | Organizer | P0 | **Đặc biệt phức tạp** — 2-level: (a) gán trọng tài vào sân (giữ cố định), (b) gán match pending vào sân. Hiển thị mỗi sân 1 row: trọng tài hiện tại + match đang chạy + button gán match tiếp |
| 13 | **Match scoring page** | Referee | P0 | 2 cột side A/B với tên + composite avatar, list game đã chấm, form nhập game đang chấm, button "Bắt đầu/Kết thúc trận" |
| 14 | **Edit score + cascade dialog** | Organizer | P1 | Form sửa game + nếu đổi winner → confirm dialog liệt kê các match downstream sẽ reset (red warning cho match đang in_progress) |
| 15 | **User profile** | All | P1 | Form sửa displayName/phone/avatar; CCCD/gender/dob lock (chỉ hiện, không sửa được) |

## 5. UX Patterns đặc thù cần khắc hoạ

### 0. Workflow stepper (top bar)

6 step điều hướng tổng quan vòng đời 1 tournament/category. Tham chiếu screenshot §2.1:

| Step | Label | Trigger chuyển | Khi nào hiện |
|---|---|---|---|
| 1 | Cấu hình | Sau khi config xong tournament + ≥1 category + ≥courts cần | Sau khi tạo tournament |
| 2 | Mở đăng ký | Sau khi mở registration ít nhất 1 category | Khi step 1 ✓ |
| 3 | Bốc thăm | Sau khi đóng đăng ký + bốc thăm ít nhất 1 category | Khi step 2 ✓ |
| 4 | Sẵn sàng | Schedule config xong, courts có trọng tài, sẵn sàng vận hành | Khi step 3 ✓ |
| 5 | Vận hành | Có ít nhất 1 match đang `in_progress` | Khi step 4 ✓ |
| 6 | Kết thúc | Tất cả match `completed` hoặc `walkover` | Khi step 5 ✓ |

**Note kỹ thuật:** Stepper state **derive từ data** (category status + bracket existence + schedule config + match status aggregation), KHÔNG cần thêm field `tournament.status` granular. Implement client-side aggregation.

### A. Bracket viewer

- Single elimination format chuẩn (16/32/64 đội).
- Mỗi match card: 2 side, mỗi side có tên + composite avatar nhỏ + score.
- Bye match: phantom side mờ + "BYE" badge.
- Match `in_progress`: viền đỏ + dot pulse animation.
- Match `completed`: winner highlight (xanh) + loser strikethrough.
- Click match → modal detail.
- Mobile: horizontal scroll, mỗi round 1 column.

### B. Operations Console (Bảng điều hành)

- Layout 3 tabs: "Theo sân" (default) | "Theo hạng mục" | "Timeline".
- Tab "Theo sân": table 1 row/court
  - Col 1: Tên sân + dropdown chọn trọng tài.
  - Col 2: Match đang diễn ra (link → scoring page nếu là trọng tài).
  - Col 3: Button "Gán match" → popup list match pending sort theo `scheduledAt`.
- Cảnh báo conflict banner top: "⚠️ VĐV X có 2 trận trùng giờ", "⚠️ Trọng tài Y kẹt 2 sân".
- Drag-drop là nice-to-have, MVP dropdown click.

### C. Category lifecycle states UI

3 trạng thái với visual khác biệt rõ:
- **`not_open`**: badge xám "Chưa mở đăng ký", form admin edit.
- **`open`**: badge xanh "Đang mở đăng ký" + countdown deadline + button "Đăng ký ngay".
- **`closed`**: badge cam "Đã đóng — Sẵn sàng bốc thăm" + danh sách VĐV public.

### D. Confirmation dialogs nguy hiểm

Cascade revert / withdraw / reset bracket — dialog phải:
- Header màu cam/đỏ.
- List rõ những gì sẽ thay đổi.
- Đếm số match bị ảnh hưởng.
- Button "Huỷ" + "Xác nhận, reset N trận" (button nguy hiểm màu đỏ).

### E. Composite avatar pattern

- Đơn (1 VĐV): 1 avatar tròn.
- Đôi (2 VĐV): 2 avatar tròn overlap ~30%, avatar phía sau opacity nhẹ hơn.
- BTC upload override `teamPhotoUrl` → thay composite bằng ảnh full.

### F. Realtime indicators

- Score update: flash highlight 200ms khi giá trị đổi.
- Match `in_progress`: badge "🔴 LIVE" với dot pulse.
- Schedule "đang diễn ra" cũng dùng cùng cue.

## 6. Visual deliverables mong muốn

- **Wireframes lo-fi** cho 15 màn hình (mobile + desktop).
- **High-fidelity mockup** cho 5 màn hình quan trọng nhất: #1 (homepage), #5 (bracket viewer), #6 (match modal), #12 (operations console), #13 (match scoring).
- **Component library** preview: button, input, card, modal, toast, badge, tabs.
- **Color palette** + typography scale.
- **Dark mode** cho ít nhất homepage + bracket viewer.
- **Empty states** cho list views (chưa có giải, chưa có đăng ký, chưa có trận).
- **Error states** + loading skeletons.

## 7. Out of scope cho design này

- Admin panel chi tiết (đơn giản, không cần design kỹ).
- Email templates.
- Mobile native app.
- Animation đặc sắc (chỉ cần micro-interactions cơ bản).
- Brand identity / logo (chưa quyết).

## 8. Inspiration tham khảo

- **Tournament Software** (BWF official) — tree bracket viewer chuẩn.
- **Toornament.com** — public tournament page layout.
- **Strava** — community-driven sport platform aesthetic.
- **Linear.app** — clean admin UI cho organizer area.

## 9. Câu hỏi designer có thể cần làm rõ

- Có cần animation realtime score update không? (Suggest: simple flash khi điểm đổi.)
- Bracket > 16 đội — hiển thị thế nào trên mobile? (Suggest: pagination theo round.)
- Mixed doubles team card: 2 avatar gender-coded (xanh nam, hồng nữ) hay neutral?

## 10. Deliverables format

Designer trả về **HTML + Tailwind self-contained** preview, mỗi file 1 screen, theo phong cách §2.1 (dark + orange accent, Linear/Vercel-inspired):

```
design-preview/
├── 01-homepage.html
├── 02-signup.html
├── 03-tournament-public.html
├── 04-category-roster.html
├── 05-bracket-viewer.html
├── 06-match-modal.html
├── 07b-organizer-dashboard.html   ← match screenshot reference 1:1
├── 08-category-form.html
├── 09-registration-list.html
├── 10-bulk-register.html
├── 11-config-doi.html
├── 12-operations-console.html
├── 13-match-scoring.html
├── 14-edit-score-cascade.html
├── 15-user-profile.html
└── design-tokens.html              ← preview palette + typography + components
```

Mỗi file:
- Self-contained (CDN Tailwind + Lucide).
- Dark mode default.
- Responsive (test 360 / 768 / 1440).
- Vietnamese content thật (không lorem ipsum).
- Comment HTML chỉ rõ component tách re-use được.

Figma file tuỳ chọn — không bắt buộc nếu HTML preview chất lượng cao.

## 11. Spec đính kèm

Designer cần đọc 3 file spec để hiểu logic + entity:

1. [project-overview-pdr.md](project-overview-pdr.md) — scope, users, lifecycle, 40 decisions
2. [system-architecture.md](system-architecture.md) — ERD entities (đặc biệt Category, Registration, Match, Court với fields)
3. [bracket-algorithm-spec.md](bracket-algorithm-spec.md) — chỉ cần đọc §13 worked example để hiểu bracket structure

## Unresolved

- Logo "FB Tournament" — designer đề xuất 1-2 mark đơn giản (ký tự `FB` trong square cam, hoặc icon shuttlecock).
- Light mode: cần làm song song hay defer P5+? (Suggest: defer, dark-first.)
- Mobile sidebar pattern: drawer overlay full-screen hay drawer 80% với backdrop?
- Có cần slide intro tutorial cho organizer lần đầu vào ops console không? (Suggest: defer P4+.)
- Bracket viewer cho 32+ đội mobile: vertical scroll theo round (như Toornament) hay horizontal swipe?
