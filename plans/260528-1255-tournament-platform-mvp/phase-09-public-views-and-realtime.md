---
phase: 9
title: "Public Views and Realtime"
status: pending
priority: P1
effort: "3-4d"
dependencies: [8]
---

# Phase 9: Public Views and Realtime

## Overview

Build trang public cho khán giả + VĐV xem giải: trang chủ list giải, trang giải detail (info, sponsors, payment), trang category (danh sách đội + bracket), trang bracket interactive, trang lịch thi đấu, score realtime. RSC fetch `GET /public/*` (no-auth) cho SEO + cache, Socket.IO client cho score realtime.

## Requirements

**Functional:**
- Trang chủ `/`: list giải public, sort theo ngày bắt đầu DESC (mới nhất trên).
- Trang giải `/giai/[slug]`: info, banner, rules, sponsors, payment QR (cho VĐV chuẩn bị đăng ký), list categories.
- Trang category `/giai/[slug]/[categoryCode]`:
  - Trước khi `closed`: hiển thị info category + nút đăng ký (nếu open).
  - Sau khi `closed`: hiển thị danh sách đội approved + team photo composite/override.
  - Sau bốc thăm: hiển thị bracket interactive.
- Trang bracket `/giai/[slug]/[categoryCode]/bracket`: sơ đồ bracket dạng tree, click match → modal detail.
- Trang lịch `/giai/[slug]/lich`: timeline tất cả match công khai theo ngày + sân.
- Score realtime: page bracket + match detail tự cập nhật < 3s qua Socket.IO (thực tế < 1s).

**Non-functional:**
- Trang chủ p95 < 1.5s (RSC + cache).
- Bracket page p95 < 2s.
- Score realtime latency p95 < 3s (Socket.IO push, thực tế < 1s).
- Mobile responsive ≥ 360px width.
- Lighthouse a11y score ≥ 90.

## Architecture

**Repo:** frontend = `badminton-web` (repo này). Public read endpoints ở `badminton-api` module `public/` (`@Public()`).

**Files (badminton-web):**
```
app/(public)/
├── page.tsx                                  # trang chủ
├── giai/[slug]/
│   ├── page.tsx                              # tournament detail
│   ├── [categoryCode]/
│   │   ├── page.tsx                          # category info + roster + register button
│   │   └── bracket/page.tsx                  # bracket view
│   └── lich/page.tsx                         # schedule timeline
└── layout.tsx                                # shared header, footer

components/public/
├── tournament-card.tsx                       # card on homepage
├── tournament-header.tsx                     # banner + name + dates
├── tournament-info.tsx                       # rules + sponsors + payment QR
├── sponsor-strip.tsx                         # horizontal logos
├── category-roster.tsx                       # grid of teams with photos
├── team-card.tsx                             # name + composite/override photo
├── public-bracket-view.tsx                   # tree bracket (CSS grid)
├── match-card.tsx                            # 2 sides + score + status badge
├── match-detail-modal.tsx                    # full games breakdown + realtime
└── schedule-timeline.tsx                     # by day/court

lib/api/
├── use-public-tournaments.ts                 # RSC fetch + client variant (GET /public/tournaments)
├── use-public-bracket.ts                     # Socket.IO subscribe room category:{cid}
└── use-match-detail.ts                       # Socket.IO subscribe room match:{mid}

lib/composite-avatar.ts                       # compose 2 avatars to 1 image (CSS render, unchanged)
```

**Public read endpoints (badminton-api module `public/`, `@Public()`):**
- `GET /public/tournaments?status=` — list isPublic=true.
- `GET /public/tournaments/:slug` — detail (isPublic only).
- `GET /public/tournaments/:slug/categories/:code` — category + roster (roster CHỈ khi `registrationStatus=closed`).
- `GET /public/tournaments/:slug/categories/:code/bracket` — active bracket + matches (đã ẩn PII qua serializer).
- `GET /public/tournaments/:slug/schedule`.

## Related Code Files

- Create: tất cả ở Architecture
- Modify:
  - `app/layout.tsx` (P1) bổ sung header navigation public
  - `badminton-api` module `public/`: serializer đảm bảo public response KHÔNG leak `identity.nationalId`/`phone`/`email` (verify lại — set ở P3+P4)
- Delete: none

## Implementation Steps

### Data fetching

1. **RSC public read helpers** (fetch `GET /public/*`, no-auth):
   - `getPublicTournaments(limit=20)`: `GET /public/tournaments?status=` → service query `isPublic == true order by startDate desc`.
   - `getTournamentBySlug(slug)`: `GET /public/tournaments/:slug`.
   - `getCategoryWithRoster(slug, code)`: `GET /public/tournaments/:slug/categories/:code` (category + approved registrations CHỈ khi closed; serializer denormalize displayName/avatar, ẩn PII).
   - `getBracket(slug, code)`: `GET /public/tournaments/:slug/categories/:code/bracket` (active bracket + matches sideA/sideB embedded).
   - **Cache strategy**: `revalidate = 60` cho list page; `revalidate = 30` cho category page; bracket page có realtime Socket.IO nên SSR initial + client re-subscribe.
2. **Client realtime hooks** (Socket.IO client qua `lib/socket.ts`):
   - `usePublicBracket(tid, categoryId)`: join room `category:{cid}`, listen `match:updated` + `bracket:updated`, merge vào TanStack Query cache.
   - `useMatchDetail(matchId)`: join room `match:{mid}`, listen `match:updated` (match doc đã serialize, games embedded). Public join room không cần auth (read-only).

### Pages

3. **Homepage** (`/`):
   - Hero section đơn giản (logo + tagline).
   - "Giải đang diễn ra" section: filter `now BETWEEN startDate AND endDate`.
   - "Sắp diễn ra" section: filter `startDate > now`.
   - "Đã kết thúc" section: filter `endDate < now`.
   - Mỗi giải = `tournament-card`: banner thumbnail + tên + ngày + địa điểm + status badge.
4. **Tournament page** (`/giai/[slug]`):
   - Header: banner full-width + tên giải + ngày + địa điểm.
   - Section "Thông tin": rules text formatted.
   - Section "Nhà tài trợ": sponsor strip horizontal scroll.
   - Section "Thông tin thanh toán": QR + bank info text (quyết định: public — phong trào không có rủi ro).
   - Section "Hạng mục": grid cards, mỗi card link tới `/giai/[slug]/[categoryCode]`.
5. **Category page** (`/giai/[slug]/[categoryCode]`):
   - Header: tên category + code + format + bestOf + status badge.
   - Conditional content:
     - `not_open`: "Đăng ký chưa mở".
     - `open`: thông tin đăng ký + countdown deadline + button "Đăng ký ngay" (chuyển trang `/dang-ky`).
     - `closed` + no bracket: roster grid (team-card list).
     - `closed` + bracket active: link "Xem bracket" + summary.
6. **Bracket page** (`/giai/[slug]/[categoryCode]/bracket`):
   - SSR initial state (RSC fetch `GET /public/.../bracket`).
   - Client component re-subscribe Socket.IO room `category:{cid}`.
   - Render bracket tree dạng CSS grid:
     - Mỗi round = 1 column.
     - Mỗi match = card với 2 side + score.
     - Lines connect matches qua nextMatchId (CSS pseudo-elements hoặc SVG overlay).
   - Click match → modal detail.
7. **Match detail modal**:
   - Realtime: subscribe Socket.IO room `match:{mid}`.
   - Header: round + category + scheduledAt + court (nếu có) + status.
   - 2 cột side A/B với tên VĐV (đôi: 2 tên + composite avatar).
   - Games breakdown: list game với scoreA-scoreB + winner highlight.
   - Live indicator: badge "🔴 Đang diễn ra" nếu in_progress.
8. **Schedule page** (`/giai/[slug]/lich`):
   - Timeline view: group by date (1 day = 1 section), within day list match sort by scheduledAt.
   - Mỗi match row: scheduledAt + category + sides + court + status.
   - Filter: theo category, sân, status.

### Composite avatar

9. **`composite-avatar.ts`**:
   - **MVP: client CSS render** — 2 img absolute positioned trong wrapper div (2 vòng tròn overlap), KISS, không gen file.
   - (P5+ optional: server gen SVG composite, cache lên DigitalOcean Spaces `tournaments/{tid}/composite/{registrationId}.svg`.)

### Public read verification (thay public firestore rules)

10. **Public read e2e test** (supertest đánh vào public endpoints — verify no PII leak):
    - Anonymous fetch `GET /public/tournaments/:slug` (isPublic) → 200.
    - Anonymous fetch tournament private (isPublic=false) → 404/403.
    - Anonymous fetch category roster trước `closed` → roster ẩn (chỉ meta).
    - Anonymous fetch category roster sau `closed` → roster hiển thị (approved).
    - Anonymous fetch `GET /public/.../bracket` (tournament public) → 200.
    - Response KHÔNG chứa `identity.nationalId` / `phone` / `email` (serializer `@Exclude`).

### SEO + meta

11. **Per-page metadata**:
    - Homepage: title "Giải đấu Cầu lông Phong trào".
    - Tournament page: title `{tournament.name}`, OG image = banner.
    - Category page: title `{category.name} - {tournament.name}`.
12. **Sitemap**: `app/sitemap.ts` generate từ public tournaments (`GET /public/tournaments`).

### Performance

13. **RSC caching**:
    - Static segments where possible.
    - `unstable_cache` cho tournament list (60s).
14. **Image optimization**: `next/image` cho banner + sponsor logos + avatar.
15. **Bundle splitting**: bracket viewer + Socket.IO client lazy load (dynamic import).

## Success Criteria

- [ ] Trang chủ render list giải public dưới 1.5s p95.
- [ ] Tournament page hiển thị đủ banner, rules, sponsors, payment.
- [ ] Category page conditional content đúng theo lifecycle.
- [ ] Bracket page render bracket tree cho 8/16/32 đội đúng visual.
- [ ] Score realtime: nhập điểm ở 1 client → client khác cập nhật < 3s qua Socket.IO.
- [ ] Mobile responsive: bracket scroll horizontal, không break layout.
- [ ] Public read e2e test pass (no PII leak).
- [ ] Lighthouse a11y ≥ 90 cho homepage + bracket page.

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Bracket layout phức tạp cho 32+ đội | CSS grid với overflow-x scroll; mobile UX rough nhưng usable |
| Socket.IO connection load tăng khi giải viral | Public client chỉ join room category/match cần xem (~100 docs); cached SSR cho public list; multi-instance scaling (Redis adapter) defer P5+ |
| RSC cache stale khi score đổi liên tục | Bracket page client-only realtime, không cache; tournament/category page revalidate 30-60s đủ |
| SEO crawler không render JS bracket | Initial state SSR có data (RSC fetch), crawler thấy được; Socket.IO realtime là enhancement |
| Public hiển thị payment QR có lừa đảo? | Out of scope MVP. P5+ verify QR hoặc remove. |
| Composite avatar render lệch | MVP client CSS, không gen file. Test với 0/1/2 avatar fallback. |

## Security Considerations

- Public read endpoints (`@Public()`) qua serializer: CHỈ trả public fields (displayName, gender, avatar). KHÔNG leak `email`/`nationalId`/`phone` qua RSC fetch hay response.
- DigitalOcean Spaces: banner/sponsor logo/team photo public read URL OK (bucket policy public-read cho prefix ảnh).
- Rate limit public read: nhẹ qua `ThrottlerModule` ở API (read persistent server, không lo Firestore quota).
- CSP headers: chỉ cho phép DigitalOcean Spaces origin cho images.

## Next Steps

→ Phase 10 (Demo and Polish): chạy 1 giải thật end-to-end + bug fix + visual polish.
