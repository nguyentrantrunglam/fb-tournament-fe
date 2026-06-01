---
phase: 10
title: "Demo and Polish"
status: pending
priority: P1
effort: "3-5d"
dependencies: [9]
---

# Phase 10: Demo and Polish

## Overview

Chạy thử 1 giải nội bộ thật end-to-end để verify toàn bộ 18 bước acceptance criteria của PDR. Fix bug phát hiện. Visual polish (empty state, error message, loading state). Performance pass. Deploy production. **Gate quan trọng nhất:** không pass phase này = không declare MVP done.

## Requirements

**Functional:**
- Chạy 1 giải demo nội bộ với data thật:
  - 3 category: `MS` (đơn nam, 8 đội), `MX` (đôi nam-nữ, 4 cặp), `OPEN` (đôi unrestricted, 6 cặp).
  - Full workflow: setup → đăng ký → duyệt → seed → bốc thăm → vận hành → score → end.
- Verify đầy đủ 18 bước acceptance criteria PDR §10.
- Bug fix priorities: P1 (blocker), P2 (UX rough), P3 (cosmetic).
- Visual polish: empty states, error messages tiếng Việt friendly, loading skeletons, toast notifications.
- Performance pass: Lighthouse audit, optimize chỗ nào < threshold.
- Deploy production Firebase + Vercel.

**Non-functional:**
- 0 P1 bug at gate close.
- ≤ 5 P2 bug at gate close (tracked, không block).
- Lighthouse: Performance ≥ 80, A11y ≥ 90, SEO ≥ 90.
- All security rules tests pass.
- All integration tests pass.

## Architecture

**Files (phần lớn là edit, ít file mới):**
```
docs/
├── deployment-guide.md                       # tạo mới
└── project-changelog.md                      # tạo + log P0-P3

scripts/
├── demo-data-seed.ts                         # tạo data demo cho test E2E
├── reset-emulator-data.ts
└── prod-deploy.sh                            # firebase deploy + vercel deploy

tests/e2e/
├── acceptance-criteria-full-flow.spec.ts     # Playwright full 18-step
├── operations-console-stress.spec.ts         # rapid assign matches
└── cascade-revert-edge-cases.spec.ts

components/shared/
├── empty-state.tsx                           # generic empty state
├── error-boundary.tsx
├── loading-skeleton.tsx
└── friendly-error.tsx                        # translate error codes → VN messages
```

## Related Code Files

- Modify: nhiều — tuỳ bug fix phát hiện
- Create: docs + scripts + E2E tests
- Delete: dead code phát hiện trong polish pass

## Implementation Steps

### E2E acceptance test (Playwright)

1. **Setup Playwright** + Firebase Emulator config cho E2E.
2. **`acceptance-criteria-full-flow.spec.ts`**: viết test cover 18 bước:
   - User A signup (CCCD valid).
   - User B signup trùng CCCD → reject.
   - Admin grant organizer_capable cho A.
   - A tạo tournament + 3 sân + 3 category (MS, MX, OPEN).
   - 8 user khác signup, đăng ký MS.
   - 4 cặp signup + đăng ký MX (1 cặp sai gender → CF reject).
   - 5 cặp đăng ký OPEN (mixed combinations, không validate).
   - A duyệt 7/8 MS, mark paid 5 + reject 1 → slot mở, user mới fill.
   - A thử close khi còn pending → reject. Duyệt nốt → close.
   - User B (khách lạ) check public roster sau closed.
   - A bulk register 5 dòng test (1 sai → 4 success).
   - A set seed cho 3 đội trong MS.
   - A bốc thăm MS → bracket sinh đúng (verify slot positions).
   - A set schedule config.
   - A vào ops console: gán C vào Sân 1, D vào Sân 2.
   - A gán match MS-R1-0 vào Sân 1 → match.refereeUid = C.
   - C nhập điểm best-of-3, endMatch → winner advance.
   - User D withdraw mid-tournament → cascade walkover.
   - A edit điểm R1-1 đổi winner → confirm cascade → R2 reset.
   - Public realtime check.
3. **Stress test ops console**: 50 matches, gán 20 trong 1 phút → no race condition, all assignments coherent.

### Bug triage process

4. **Run E2E test → log all failures.**
5. **Manual exploratory testing 2 ngày**: 3 người (1 organizer, 1 referee, 1 khán giả) thử hết feature → log bugs.
6. **Bug list**:
   - P1 = blocker (test không pass, feature broken). FIX TRƯỚC.
   - P2 = UX rough (chậm, confusing, error message tiếng Anh). FIX nếu thời gian cho phép.
   - P3 = cosmetic (margin, color, copy). Defer.
7. **Fix loop:** test → fix → re-run E2E → repeat.

### Visual polish

8. **Empty states**: mọi list view (tournament list, category list, registration list, match list, schedule) có empty state với CTA rõ ràng.
9. **Error messages tiếng Việt**:
   - Map CF error codes → friendly messages.
   - Form validation errors hiển thị inline.
   - Toast notifications dùng `useToast` shadcn.
10. **Loading skeletons**: cho RSC fallback + client-side loading.
11. **404 page**: tiếng Việt, link về homepage.
12. **Tournament card image fallback**: nếu không banner → placeholder image.

### Performance pass

13. **Lighthouse audit** trên 5 page chính: homepage, tournament page, bracket page, ops console, schedule.
14. **Optimize**:
    - Image: convert PNG → WebP qua Storage upload pipeline (P5+, MVP chỉ next/image).
    - Bundle: dynamic import cho ops console + bracket viewer.
    - Firestore: composite indexes (deploy `firestore.indexes.json`).
15. **Cost projection**:
    - Đếm read/write ops cho 1 giải 20 đội từ start to end.
    - Tính tier free Firestore (50k read/day, 20k write/day) đủ cho ~3 giải/ngày.
    - Document trong `deployment-guide.md`.

### Security final pass

16. **Run all rules tests** (~30 tests từ các phase trước).
17. **Penetration check manual**:
    - Try ghi `tournaments/{tid}` từ client trực tiếp → reject.
    - Try đọc `users/{B}/private/identity` khi không phải B/admin → reject.
    - Try đọc `cccdIndex/*` → reject.
    - Try đọc roster category `open` (chưa closed) → reject.
    - Try gọi CF khi không auth → reject.
18. **Rate limit tests**: spam `createRegistration` 20 lần/phút → bị throttle sau quota.

### Deployment

19. **Production setup**:
    - Firebase prod project: enable Auth providers, set Firestore location, set Storage rules.
    - Vercel: env vars production, custom domain.
    - Cloud Functions deploy production.
    - Firestore indexes deploy.
20. **DNS + SSL**: domain trỏ Vercel, SSL auto.
21. **Smoke test prod**: 1 user signup + 1 tournament tạo + 1 match nhập điểm.

### Documentation

22. **`docs/deployment-guide.md`**: bước deploy, env vars, secrets, monitoring URLs.
23. **`docs/project-changelog.md`**: log P0-P3 implementations + decisions.
24. **README**: update với production URL + screenshot.
25. **Update `docs/codebase-summary.md`**: tổng quan codebase sau MVP.

### Demo session

26. **Chạy demo nội bộ** với 3-5 người trong team:
    - 1 người làm organizer, setup giải.
    - 2-3 người đăng ký + đôi.
    - 1 người làm trọng tài.
    - 1 người làm khán giả xem public.
27. **Ghi nhận feedback**: list ý kiến → tách thành P4 backlog.

## Success Criteria

- [ ] E2E test `acceptance-criteria-full-flow.spec.ts` pass 100%.
- [ ] 18 bước PDR §10 verified.
- [ ] 0 P1 bug.
- [ ] Lighthouse Performance ≥ 80, A11y ≥ 90, SEO ≥ 90 trên 5 page chính.
- [ ] All rules tests pass.
- [ ] All integration tests pass.
- [ ] Production deploy thành công, smoke test pass.
- [ ] `docs/deployment-guide.md` + `docs/project-changelog.md` đầy đủ.
- [ ] Demo session với team, feedback ghi nhận.
- [ ] Cost projection document, dưới free tier cho 3 giải/ngày.

## Risk Assessment

| Risk | Mitigation |
|---|---|
| Phát hiện P1 bug mất nhiều thời gian fix | Buffer 2-3 ngày extra; P3 defer aggressive |
| Production Firestore khác emulator behavior | Smoke test prod trước demo |
| Production cost vượt free tier sớm | Cost projection trước deploy; monitor Billing alert |
| Demo session crash trước khán giả | Run rehearsal trước session 1 ngày |
| Vercel build time chậm | Cache pnpm + next build cache |
| Cloud Functions cold start lag | First invocation chậm — acceptable cho MVP. P5+ keep-warm. |
| User feedback đòi feature không có trong scope MVP | Note vào backlog P4+, không slip MVP scope |

## Security Considerations

- Production rules deploy phải khác emulator (stricter).
- Service account JSON: rotate trước go-live.
- Firebase API key: restrict referrer trên Cloud Console.
- Storage bucket: public read URLs (banner/avatar) OK; deny list bucket.
- Cloud Function: enable App Check (P4+ if budget allows).

## Next Steps (post-MVP)

→ **Plan P4-P5** (separate plan):
- Round Robin + Group + Playoff formats
- Doubles UI nâng cao (drag-drop seed)
- Trọng tài invite qua link/email
- Schedule conflict detection nâng cao
- Re-arrange bracket cross-round

→ **P6+**:
- ELO ranking
- Payment gateway integration (VNPay/MoMo)
- Mobile app native
- Multi-tournament cross-stats
