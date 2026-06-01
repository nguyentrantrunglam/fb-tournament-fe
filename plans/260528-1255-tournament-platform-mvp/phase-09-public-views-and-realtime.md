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

Build trang public cho khán giả + VĐV xem giải: trang chủ list giải, trang giải detail (info, sponsors, payment), trang category (danh sách đội + bracket), trang bracket interactive, trang lịch thi đấu, score realtime. RSC cho SEO + cache, Firestore listener cho score realtime.

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
- Score realtime: page bracket + match detail tự cập nhật < 3s qua Firestore listener.

**Non-functional:**
- Trang chủ p95 < 1.5s (RSC + Vercel edge cache).
- Bracket page p95 < 2s.
- Score realtime latency p95 < 3s.
- Mobile responsive ≥ 360px width.
- Lighthouse a11y score ≥ 90.

## Architecture

**Files:**
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

lib/queries/
├── use-public-tournaments.ts                 # RSC + client variant
├── use-public-bracket.ts                     # Firestore listener
└── use-match-detail.ts                       # listener for live score

lib/composite-avatar.ts                       # compose 2 avatars to 1 image URL (data URL or pregenerated)
```

## Related Code Files

- Create: tất cả ở Architecture
- Modify:
  - `app/layout.tsx` (P1) bổ sung header navigation public
  - `firestore.rules` đảm bảo public read rules cover các case (đã set ở P3+P4, verify lại)
- Delete: none

## Implementation Steps

### Data fetching

1. **RSC public read helpers**:
   - `getPublicTournaments(limit=20)`: Admin SDK query `tournaments where isPublic == true order by startDate desc`.
   - `getTournamentBySlug(slug)`: query slug index hoặc collection scan.
   - `getCategoryWithRoster(tid, categoryId)`: get category + approved registrations + user info (denormalize displayName/avatar).
   - `getBracket(tid, categoryId)`: read active bracket + matches + sides.
   - **Cache strategy**: `revalidate = 60` cho list page; `revalidate = 30` cho category page; bracket page có realtime listener nên SSR initial + client re-subscribe.
2. **Client realtime hooks**:
   - `usePublicBracket(tid, categoryId)`: Firestore listener `matches where bracketId == activeBracketId`.
   - `useMatchDetail(matchId)`: listener match doc + games subcollection.

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
   - Section "Thông tin thanh toán": QR + bank info text (chỉ hiện cho user signed in? hay public? — quyết định: public — phong trào không có rủi ro).
   - Section "Hạng mục": grid cards, mỗi card link tới `/giai/[slug]/[categoryCode]`.
5. **Category page** (`/giai/[slug]/[categoryCode]`):
   - Header: tên category + code + format + bestOf + status badge.
   - Conditional content:
     - `not_open`: "Đăng ký chưa mở".
     - `open`: thông tin đăng ký + countdown deadline + button "Đăng ký ngay" (chuyển trang `/dang-ky`).
     - `closed` + no bracket: roster grid (team-card list).
     - `closed` + bracket active: link "Xem bracket" + summary.
6. **Bracket page** (`/giai/[slug]/[categoryCode]/bracket`):
   - SSR initial state (RSC).
   - Client component re-subscribe Firestore listener.
   - Render bracket tree dạng CSS grid:
     - Mỗi round = 1 column.
     - Mỗi match = card với 2 side + score.
     - Lines connect matches qua nextMatchId (CSS pseudo-elements hoặc SVG overlay).
   - Click match → modal detail.
7. **Match detail modal**:
   - Realtime listener.
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
   - Server-side: tạo SVG composite từ 2 avatar URL (2 vòng tròn overlap).
   - Cache result: gen 1 lần, lưu Firebase Storage `tournaments/{tid}/composite/{registrationId}.svg` (lazy).
   - Hoặc đơn giản hơn: client render 2 img absolute positioned trong wrapper div (KISS, không cần gen file).
   - **MVP: client CSS render**, không gen file.

### Rules verification

10. **Public read rules test**:
    - Anonymous user xem tournament public → success.
    - Anonymous user xem tournament private → reject.
    - Anonymous xem category roster trước `closed` → reject (registrations).
    - Anonymous xem category roster sau `closed` → success.
    - Anonymous xem matches của tournament public → success.
    - Anonymous xem `users/{uid}/private/identity` → reject.

### SEO + meta

11. **Per-page metadata**:
    - Homepage: title "Giải đấu Cầu lông Phong trào".
    - Tournament page: title `{tournament.name}`, OG image = banner.
    - Category page: title `{category.name} - {tournament.name}`.
12. **Sitemap**: `app/sitemap.ts` generate từ public tournaments.

### Performance

13. **RSC caching**:
    - Static segments where possible.
    - `unstable_cache` cho tournament list (60s).
14. **Image optimization**: `next/image` cho banner + sponsor logos + avatar.
15. **Bundle splitting**: bracket viewer + realtime listener lazy load (dynamic import).

## Success Criteria

- [ ] Trang chủ render list giải public dưới 1.5s p95.
- [ ] Tournament page hiển thị đủ banner, rules, sponsors, payment.
- [ ] Category page conditional content đúng theo lifecycle.
- [ ] Bracket page render bracket tree cho 8/16/32 đội đúng visual.
- [ ] Score realtime: nhập điểm ở 1 client → client khác cập nhật < 3s.
- [ ] Mobile responsive: bracket scroll horizontal, không break layout.
- [ ] Rules test public read pass.
- [ ] Lighthouse a11y ≥ 90 cho homepage + bracket page.

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Bracket layout phức tạp cho 32+ đội | CSS grid với overflow-x scroll; mobile UX rough nhưng usable |
| Firestore read cost tăng nhanh khi giải viral | Listener chỉ subscribe matches của 1 bracket (~100 docs); cached SSR cho public list |
| RSC cache stale khi score đổi liên tục | Bracket page client-only realtime, không cache; tournament/category page revalidate 30-60s đủ |
| SEO crawler không render JS bracket | Initial state SSR có data, crawler thấy được; realtime listener là enhancement |
| Public hiển thị payment QR có lừa đảo? | Out of scope MVP. P5+ verify QR hoặc remove. |
| Composite avatar render lệch | MVP client CSS, không gen file. Test với 0/1/2 avatar fallback. |

## Security Considerations

- Verify rules: public CHỈ thấy public fields (displayName, gender, avatar). KHÔNG leak email/cccd qua RSC response.
- Storage rules: banner/sponsor logo public read OK; team photo public read OK sau `closed`.
- Rate limit không cần ở public read (Firestore handle).
- CSP headers: chỉ cho phép Firebase Storage origin cho images.

## Next Steps

→ Phase 10 (Demo and Polish): chạy 1 giải thật end-to-end + bug fix + visual polish.
