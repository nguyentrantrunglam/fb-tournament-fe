# PDR — Nền tảng Quản lý Giải đấu Cầu lông

> **Status:** Draft v0.2 (pivot stack) — Locked sau khi user xác nhận
> **Ngày:** 2026-06-03 (v0.1: 2026-05-28)
> **Loại sản phẩm:** Platform công khai (Cấp C) cho phong trào cầu lông tự phát
> **Ngôn ngữ UI:** Tiếng Việt
> **Pivot note:** v0.2 chuyển stack **Firebase → NestJS + MongoDB + Socket.IO + DigitalOcean Spaces + Docker/Nginx**. Mọi quyết định domain/nghiệp vụ (D3–D40) giữ nguyên; chỉ stack hạ tầng đổi (D1, D2 cập nhật). Repo: `badminton-web` (Next.js, repo này) + `badminton-api` (NestJS, repo riêng). Map chi tiết: [architecture-pivot mapping report](../plans/reports/architecture-pivot-260603-1217-firebase-to-nestjs-mongo-mapping-report.md).

---

## 1. Tổng quan

Hệ thống web cho phép bất kỳ ai cũng có thể:
- Tạo tài khoản (đồng thời là vận động viên — VĐV).
- Được trao quyền tạo & quản lý giải đấu cầu lông.
- Đăng ký tham gia giải, được BTC duyệt thủ công.
- Tham gia thi đấu, được trọng tài nhập điểm.
- Theo dõi bảng đấu / lịch / kết quả realtime.

Đối tượng: cộng đồng cầu lông phong trào (CLB, công ty, nhóm bạn) — **không nhằm mục tiêu BWF / liên đoàn chính thức**.

## 2. Mục tiêu sản phẩm

| Mục tiêu | Đo lường |
|---|---|
| Một BTC chạy 1 giải hoàn chỉnh từ đầu đến cuối qua app | 1 giải nội bộ chạy thành công ở P3 |
| Người xem theo dõi sơ đồ + tỉ số realtime mà không cần app riêng | Trang public render dưới 1.5s, score update < 3s |
| Trọng tài nhập điểm dễ trên mobile | Single-screen form, không scroll |
| Business logic tách khỏi hạ tầng, dễ test + bảo trì | Bracket / scoring logic ở `src/domain/` thuần (không import nestjs/mongoose) |

## 3. Người dùng & vai trò

### Global roles (gắn với user, field `globalRole`)
| Role | Quyền |
|---|---|
| `admin` | Quản trị platform: cấp quyền `organizer`, ban user, xem mọi giải |
| `organizer_capable` | Được admin cấp để tạo tournament (sau đó tự là `organizer` của giải mình tạo) |
| `athlete` (default) | Mọi tài khoản mặc định (VĐV). Có thể đăng ký vào giải. (đổi tên từ `user` ở v0.1) |

### Tournament-scoped roles (gắn với 1 tournament cụ thể)
| Role | Quyền |
|---|---|
| `organizer` | Tạo / sửa / xoá giải; duyệt đăng ký; bốc thăm; sắp xếp lại bảng; mời trọng tài; công khai giải |
| `referee` | Bắt đầu / kết thúc match; nhập điểm các trận được giao |

### Implicit role
| Role | Quyền |
|---|---|
| `participant` | User đã được duyệt vào ít nhất 1 category của giải. Có quyền xem giải kể cả khi chưa public. |

**Quy tắc cấp `organizer`:** Mặc định không user nào có. `admin` cấp quyền cho user khi cần thiết (qua admin panel hoặc bằng tay ở giai đoạn MVP).

## 4. Phạm vi MVP (P0–P3)

### Auth & User
- Đăng ký + đăng nhập bằng email + password (**session-based auth qua API**: express-session + Passport local, bcrypt hash; cookie `connect.sid` dùng chung REST + Socket.IO). **KHÔNG Google OAuth** — auth 100% qua API.
- Profile bắt buộc lúc đăng ký:
  - Họ tên
  - **CCCD (Căn Cước Công Dân) 12 số** — bắt buộc, unique toàn hệ thống (field `nationalId`; UI hiển thị "CCCD").
  - Giới tính (nam / nữ)
  - Ngày sinh
- Profile tùy chọn: số điện thoại, avatar.
- **Mỗi người chỉ có 1 tài khoản duy nhất**, định danh qua `nationalId`. Hệ thống reject signup nếu `nationalId` đã tồn tại (**Mongo unique index**, lỗi `E11000` → `NATIONAL_ID_ALREADY_REGISTERED`).
- `nationalId` chỉ chính chủ + admin xem được; KHÔNG hiển thị public, không hiển thị cho organizer / referee / đồng đội (lưu trong `user.identity`, `@Exclude` serializer).
- MVP: trust user nhập, không tích hợp KYC government. Admin có thể verify tay khi nghi ngờ.
- Quên mật khẩu qua email (tự xử lý: token reset + SMTP/nodemailer, thay Firebase Auth built-in).

### Tournament

**Thông tin cơ bản (bước tạo giải):**
- Tên giải, mô tả ngắn, ngày bắt đầu, ngày kết thúc, địa điểm.

**Thông tin chi tiết (bước Config, có thể chỉnh sau):**
- **Banner & logo** (`bannerUrl` 2000×1000 + `logoUrl` vuông, upload **DigitalOcean Spaces** qua presigned URL).
- **Thể lệ** (`rulesText`, markdown — luật chơi, quy định riêng).
- **Nhà tài trợ** (`sponsors[]`): mỗi sponsor có `tier` (kim cương / vàng / bạc / đơn vị vận hành / bảo trợ truyền thông), `name`, `logoUrl`, `link`, `description`.
- **Phương thức thanh toán** (`paymentConfig`): tên chủ tài khoản, số tài khoản, ngân hàng (mã napas), template nội dung CK gợi ý (biến `{tên_VĐV}` `{mã_hạng_mục}` `{số_điện_thoại}`), ảnh mã QR (upload — MVP không tự gen từ STK).

**Visibility:**
- Toggle `isPublic` (mặc định false). Public = hiện ở trang chủ + ai cũng vào xem được. Private = chỉ organizer + participant.

**Quản lý sân (Court):**
- BTC tạo trước danh sách sân của giải (vd: Sân 1, Sân 2, Sân 3).
- Mỗi sân có thể được gán 1 trọng tài cố định (xem Operations Console).

### Category trong giải

**Config cơ bản:**
- **Tên category**: tự định nghĩa, vd "Đôi nam U19", "Đơn mở rộng".
- **Mã category** (`code`): tự định nghĩa kiểu kebab/upper-snake, vd `MD19` / `WS35`. Unique trong tournament. Dùng cho URL + hiển thị gọn.
- **Số người mỗi đội** (`playerCount`): `1` (đơn) hoặc `2` (đôi).
- **Yêu cầu giới tính** (`genderRequirement`):
  - `men_only` — tất cả người chơi phải là nam (đơn nam / đôi nam).
  - `women_only` — tất cả người chơi phải là nữ (đơn nữ / đôi nữ).
  - `mixed_pair` — **chỉ áp dụng `playerCount=2`** — bắt buộc 1 nam + 1 nữ.
  - `unrestricted` — không phân biệt giới tính (giải nhỏ, phong trào). UI không filter, không validate.
- **Format** (`format`): 3 thể thức — `single_elim` (loại trực tiếp, crossover seeding), `round_robin` (vòng tròn 1 lượt, xếp hạng theo điểm + hiệu số game), `group_ko` (chia bảng → top N mỗi bảng vào vòng KO). Mỗi hạng mục chọn 1.
- **Best of**: 1 / 3 / 5 game.

**UI filter khi đăng ký** (cho VĐV chọn bản thân + partner):
| genderRequirement | Filter |
|---|---|
| `men_only` | chỉ user nam |
| `women_only` | chỉ user nữ |
| `mixed_pair` | VĐV 1 nam → VĐV 2 chỉ hiện nữ (và ngược lại) |
| `unrestricted` | không filter |

**Combination invalid:** `genderRequirement = mixed_pair` AND `playerCount = 1` → API reject lúc tạo category.

**Config đăng ký:**
- **Hạn đăng ký** (`registrationDeadline`): datetime. Sau deadline, hệ thống reject đăng ký mới dù `registrationStatus = open`.
- **Lệ phí** (`fee`): số tiền VND (0 nếu free).
- **Số lượng đội tối đa** (`maxTeams`): hard cap.
  - **Quy tắc đếm slot:** `currentCount = approved + pending`. Khi BTC reject 1 pending → slot giảm 1, mở chỗ cho người mới.
  - Đầy slot → API reject đăng ký mới.

**Category lifecycle (3 trạng thái — BTC chuyển thủ công):**
1. **`not_open`** (mặc định) — BTC còn cấu hình. Chưa nhận đăng ký.
2. **`open`** — VĐV đăng ký được (nếu `tournament.isPublic = true` AND chưa quá deadline AND chưa đầy slot).
3. **`closed`** — đóng đăng ký + **danh sách VĐV approved hiển thị public** (kèm ảnh đội — xem Team Photo). BTC còn thêm/sửa ảnh đội. Sẵn sàng bốc thăm.

**Chuyển `open → closed` chỉ cho phép khi KHÔNG còn registration `pending`** — BTC phải duyệt/từ chối hết. Tránh quên VĐV đang chờ.

**Sau bốc thăm**, category vào trạng thái implicit "drawn" (tracked qua `Bracket.isActive`). Không thay đổi registration thông thường được nữa; muốn sửa → organizer override + audit.

### Registration

**2 cách tạo registration:**

**Cách 1 — VĐV tự đăng ký** (default flow):
- VĐV đăng ký 1 hoặc nhiều category trong cùng giải.
- Đôi: nhập partner (chọn từ danh sách user, đã filter theo `genderRequirement`). **Auto-confirm partner** ở MVP, không cần partner approve.
- Validate giới tính theo `genderRequirement` của category.
- `status = pending`, BTC duyệt/từ chối thủ công.

**Cách 2 — Organizer đăng ký hộ** (single hoặc bulk):
- Yêu cầu: VĐV đích **phải đã có account** trong hệ thống (định danh qua CCCD hoặc tìm theo tên/email).
- Single: form 1 registration (chọn category + VĐV + partner nếu đôi).
- **Bulk: form multi-row** — thêm nhiều dòng cùng lúc, mỗi dòng 1 registration (chọn category + VĐV + partner). Validate từng dòng độc lập theo `genderRequirement`.
- Khi BTC submit bulk → API xử lý từng dòng:
  - Dòng valid → tạo registration với `status = approved` (auto, không cần duyệt riêng) + `paymentStatus = unpaid`.
  - Dòng invalid (sai gender, CCCD không tồn tại, trùng đăng ký, hết slot, quá deadline) → **báo lỗi cụ thể về cho BTC**, dòng đó KHÔNG được tạo.
  - Các dòng valid khác trong batch **vẫn được commit** (partial success), BTC chỉ cần fix dòng lỗi.
- Audit log: `createdByUid` (BTC) + `createdMode` (`self` / `organizer_single` / `organizer_bulk`).

**Quy tắc chung (cả 2 cách):**
- Snapshot `feeSnapshot = category.fee` lúc tạo.
- Validate slot (`approved + pending < maxTeams`).
- Validate deadline (`now < registrationDeadline`).
- Validate `genderRequirement`.
- BTC vẫn có thể huỷ approval / VĐV vẫn có thể rút sau khi đã `approved`.

### Payment Tracking (lệ phí)
- Mỗi `Registration` có `paymentStatus`: `unpaid` (mặc định) → `paid`.
- BTC xem mã QR + thông tin chuyển khoản của giải, nhận tiền từ VĐV ngoài app, sau đó vào app **đánh dấu "Đã thu"** cho registration đó.
- Audit: lưu `paidAt`, `paidMarkByUid` (ai đánh dấu).
- BTC có thể quay lại `paid → unpaid` (đánh dấu nhầm).
- Khi reject registration: paymentStatus giữ nguyên (nếu đã thu mà reject = BTC tự xử lý hoàn tiền off-system).
- **Approve không yêu cầu paid** — BTC tự chọn policy: có thể approve trước khi thu tiền, hoặc bắt thu trước rồi mới approve.

### Team Photo (Ảnh đội)
- Mỗi `Registration` có `teamPhotoUrl` (nullable).
- **Default (không lưu)**: trang public render composite từ avatar của các VĐV trong registration (đơn: 1 avatar; đôi: 2 avatar ghép).
- BTC có thể upload override `teamPhotoUrl` ở giai đoạn `closed` (trước bốc thăm) hoặc bất kỳ lúc nào.
- Hiển thị: chỗ nào cần ảnh đội → ưu tiên `teamPhotoUrl`, fallback composite avatar.

### Schedule Config (Lịch thi đấu)
- BTC config cho từng category (sau khi bốc thăm xong):
  - **Giờ bắt đầu category** (`scheduleStartAt`): datetime
  - **Thời gian dự kiến mỗi trận** (`estimatedMinPerMatch`): phút (vd 45 phút)
- Hệ thống tính sơ bộ lịch dự kiến cho từng match dựa trên số sân của giải:
  - `matchScheduledAt = scheduleStartAt + (matchIndex / courtCount) * estimatedMinPerMatch`
  - Đây là **soft estimate**, chỉ để UI gợi ý + cảnh báo trùng giờ VĐV.
  - `matchIndex` = **thứ tự thi đấu** (`order`); BTC kéo-thả đổi thứ tự ở trang Lịch & trận → tính lại `scheduledAt`. Trận `completed`/`in_progress` khoá, không đổi.
- **KHÔNG gán sân (`courtId`) ở trang Lịch** — chỉ quản lý thứ tự; gán match→sân thực hiện ở **Vận hành LIVE**.

### Bracket & Match
- Sơ đồ vẽ bằng **React Flow** (canvas pan/zoom, đường nối các vòng). Hỗ trợ 3 thể thức: `single_elim` (cột R1→F), `round_robin` (BXH + danh sách trận), `group_ko` (bảng + KO playoff). Hiển thị đầy đủ tên VĐV (đôi: 2 tên / side).
- BTC nhập seed thủ công (số seed cho mỗi registration đã approved).
- BTC bốc thăm sinh bracket; có thể bốc lại trước khi giải bắt đầu.
- Sau khi bốc, BTC vẫn có thể swap chỗ 2 VĐV (re-arrange) → tạo bracket version mới, lưu version cũ.
- **Seed gán ở phase "Config đội"** (sau khi `closed`, trước bốc thăm): cùng màn upload ảnh đội, BTC chọn registration nào → set `seed = 1, 2, 3...`. Bỏ trống = không seed.
- **2 chế độ bốc thăm AUTO-DETECT khi BTC click "Bốc thăm"**:
  - Nếu có ít nhất 1 registration đã có `seed != null` → mode `seeded` (crossover placement, các reg còn lại random fill seed).
  - Nếu KHÔNG registration nào có seed → mode `random` toàn bộ. Phù hợp giải phong trào / trình độ tương đương.
- BTC không cần chọn mode — chỉ cần quyết định "có gán seed nào không" ở phase config đội. KISS.
- Auto fill bye khi tổng số người không phải luỹ thừa 2. Mode seeded → bye cho top seeds; mode random → bye random.
- Người thắng tự đẩy lên vòng sau.
- **Withdrawal khi giải đang vận hành**:
  - Match đã `completed` của VĐV rút → **giữ nguyên kết quả**, không ảnh hưởng.
  - Match `pending` hoặc `in_progress` của VĐV rút → **walkover loss**, đối thủ tự thắng + đẩy lên vòng sau.
  - Đôi: nếu 1 trong 2 VĐV của cặp rút → cả cặp rút theo, áp rule trên.

### Match operation
- Match có `scheduledAt` (dự kiến từ Schedule Config, không enforce).
- BTC / referee chủ động bấm "Bắt đầu trận" → status `in_progress`.
- Referee nhập điểm các game (best-of-N). **Điểm tự do, không validate range. Bên có điểm cao hơn = thắng game.**
- Referee bấm "Kết thúc trận" → tính winner theo số game thắng → đẩy người thắng lên match tiếp theo + **tự động gỡ match khỏi sân** (court chuyển sang `available`).
- **BTC nhập tỉ số thủ công** (override): từ trang Lịch & trận, mở dialog nhập điểm từng game cho trận chưa xong (pending/in_progress) → tính winner → completed. Dùng khi không qua luồng trọng tài-trên-sân.
- Cảnh báo (không block) khi 2 trận của cùng 1 VĐV trùng giờ dự kiến.

### Operations Console (Bảng điều hành)
Màn hình chuyên biệt cho `organizer` vận hành giải đang diễn ra. Mô hình **2 cấp gán**:

**Cấp 1 — Gán trọng tài vào Court (giữ cố định):**
- BTC chọn 1 trọng tài cho mỗi sân. Trọng tài này **stick với sân** qua nhiều match liên tiếp.
- BTC có thể đổi trọng tài bất kỳ lúc nào (vd: đổi ca, nghỉ giải lao).
- 1 sân chỉ có 1 trọng tài active tại 1 thời điểm.
- 1 trọng tài có thể được gán nhiều sân (linh hoạt nếu sân ít người), nhưng cảnh báo.

**Cấp 2 — Gán Match vào Court:**
- BTC kéo-thả match (pending) vào sân available.
- Match assigned → **tự động snapshot** `match.refereeUid = court.currentRefereeUid` (giữ lịch sử ngay cả khi sau đó đổi trọng tài court).
- Court chuyển sang `busy` với `currentMatchId = matchId`.
- 1 sân chỉ chứa 1 match active.
- Khi match `completed` / `walkover` → court tự release (`currentMatchId = null`, status `available`) sẵn sàng nhận match khác.

**Tính năng khác trong Console:**
- Xem timeline match `pending` / `in_progress` của giải, filter theo category / status / ngày.
- Cảnh báo: VĐV trùng giờ, trọng tài kẹt 2 sân cùng lúc.
- Bắt đầu / kết thúc thủ công (override) khi trọng tài vắng.

**Quy tắc nhập điểm:**
- Match có `refereeUid` (snapshot lúc assign vào court) là **người duy nhất nhập điểm** match đó.
- Đổi trọng tài của Court khi match đang `in_progress`: 2 phương án — (a) trận đó vẫn của trọng tài cũ đến hết (snapshot không đổi); (b) BTC chọn "đổi trọng tài cho match đang chạy". **MVP: chọn (a)** — đơn giản. BTC muốn (b) → endMatch tay + assign lại.

**Quy tắc edit điểm:**
- Trọng tài: chỉ sửa điểm match mình ghi (`userId == match.refereeUserId`), **trong 24h sau `endedAt`**.
- **Organizer: sửa điểm BẤT KỲ match nào, không giới hạn thời gian**. Đổi winner → cascade revert (xem system-arch.md).

### Public view
- Trang chủ: list giải public, sắp xếp theo ngày diễn ra.
- Trang giải: thông tin, danh sách category, danh sách VĐV approved.
- Trang bracket: sơ đồ thi đấu, click match xem chi tiết + score realtime.
- Trang lịch: list match theo ngày + sân.

## 5. Phạm vi sau MVP

| Phase | Tính năng |
|---|---|
| **P4** | Format Round Robin, Group + Playoff. Tăng cường UI bracket. |
| **P5** | Mời trọng tài qua link / email. Re-arrange bracket UI tốt hơn. Conflict detection lịch nâng cao. **Socket.IO Redis adapter** (scale multi-instance). |
| **P6** | ELO/ranking nội bộ. Lịch sử thành tích VĐV. Đề xuất seed tự động. |
| **P7** | Tách bracket/scoring thành microservice riêng (nếu cần scale). Social login (Google) nếu có nhu cầu. |
| **P8** | Payment đăng ký (gateway VNPay/MoMo). Hoá đơn / refund. |
| **P9** | Mobile app (React Native) cho trọng tài + khán giả. |

## 6. Roadmap thời gian (ước lượng)

| Phase | Output | Thời gian |
|---|---|---|
| **P0** | PDR + ERD + Bracket spec single-elim + 5 wireframe core | 3-5 ngày |
| **P1** | Auth + User profile + Tournament + Category CRUD + Registration approve flow | 1-2 tuần |
| **P2** | Bracket generation single-elim + Match + Score + Withdrawal cascade | 2-3 tuần |
| **P3** | Public view + Socket.IO realtime + Demo chạy 1 giải thật | 1 tuần |
| **Gate** | Chạy 1 giải nội bộ thật. Đánh giá feedback. **Quyết định build tiếp P4 hay refine P1-P3.** | — |
| **P4** | Doubles UI hoàn chỉnh + RoundRobin + GroupPlayoff | 2-3 tuần |
| **P5** | Trọng tài invite flow + Re-arrange + Schedule conflict warning | 1-2 tuần |

## 7. Decision Log

| # | Quyết định | Lý do |
|---|---|---|
| D1 | **Stack (v0.2): Next.js (`badminton-web`, deploy Vercel dev+prod) + NestJS (`badminton-api`, deploy Docker+Nginx) + MongoDB + Socket.IO + DigitalOcean Spaces** (v0.1 cũ: Next.js + Firebase) | Self-host BE kiểm soát hạ tầng, realtime chủ động qua Socket.IO, không vendor lock-in, server persistent (không cold start); web giữ Vercel cho tốc độ + edge cache |
| D2 | Domain logic thuần ở `src/domain/` (không import nestjs/mongoose) | Test nhanh, tách hạ tầng, dễ tách microservice sau |
| D2b | Auth session-based (express-session + Passport, cookie `connect.sid` chung REST + Socket.IO); uniqueness `nationalId` bằng Mongo unique index | Thay Firebase Auth; control session + PII chủ động |
| D2c | MongoDB **replica set** (bắt buộc) cho multi-doc transaction; embed sides+games vào Match doc | Bốc thăm/cascade/end-match cần atomic; side(2)+game(≤5) bounded → 1 doc/match |
| D3 | Mode bốc thăm auto-detect từ `Registration.seed`: có ≥1 seed → `seeded`, không có → `random` | KISS, BTC không phải chọn mode. Seed gán ở phase Config đội. |
| D4 | Partner đôi auto-confirm ở MVP | Giảm friction, cải tiến sau |
| D5 | Mixed doubles validate gender | Yêu cầu domain |
| D6 | Gender bắt buộc lúc đăng ký account | Validate ở mọi nơi dễ hơn |
| D7 | Match completion = referee bấm tay | Scoring rule mở, không auto-detect được |
| D8 | Schedule là soft constraint | BTC vận hành thực tế chủ động |
| D9 | Bracket versioned, re-arrange tạo version mới | Audit + an toàn |
| D10 | Không quản lý CLB ở MVP | YAGNI, phong trào tự phát |
| D11 | 1 collection `users` duy nhất, role scoped (`globalRole`: athlete/organizer_capable/admin + tournament-scoped roles) | KISS, mọi user đều là VĐV |
| D12 | `is_public` toggle / tournament | Linh hoạt, BTC kiểm soát |
| D13 | Tiếng Việt only | Đối tượng VN, YAGNI i18n |
| D14 | Withdrawal chỉ ảnh hưởng match chưa completed (pending/in_progress); match đã completed giữ nguyên | Trận cũ là sự kiện đã xảy ra, không sửa lịch sử. Đơn giản, không cần re-bracket. |
| D15 | Operations Console là màn hình riêng cho organizer | Vận hành thực tế khác trang quản lý setup giải |
| D16 | Trọng tài được gán là người duy nhất nhập điểm match đó | Enforcement, audit, tránh nhầm lẫn. Organizer override được. |
| D17 | Organizer sửa được điểm bất kỳ match nào, không giới hạn thời gian | Toàn quyền vận hành. Trọng tài có giới hạn 24h. |
| D18 | CCCD bắt buộc lúc đăng ký, unique toàn hệ thống | Đảm bảo 1 người = 1 tài khoản. Định danh thực tế. |
| D19 | Chỉ chấp nhận CCCD 12 số (post-2021), không nhận CMND 9 số cũ | KISS, format mới đã phổ biến. |
| D20 | MVP không tích hợp KYC government, trust user nhập | YAGNI. Admin verify tay khi nghi ngờ. Có thể tích hợp VNeID sau (P7+). |
| D21 | CCCD chỉ chính chủ + admin xem được | Privacy. Sensitive PII của VN. |
| D22 | Category có 3 trạng thái: `not_open` → `open` → `closed` | KISS. Đóng = công bố danh sách. |
| D23 | Danh sách VĐV chỉ public khi category ở trạng thái `closed` (hoặc sau đó) | BTC đóng đăng ký = công bố. Tránh leak VĐV pending/rejected lúc còn open. |
| D24 | Sau bốc thăm không thay đổi registration bằng flow thông thường | Bảo toàn integrity. Organizer override + audit log nếu cần. |
| D25 | Lệ phí track in-app: `paymentStatus = unpaid/paid`, BTC đánh dấu thủ công | Đơn giản, không tích hợp payment gateway. Đủ cho phong trào. |
| D26 | Lệ phí snapshot vào registration lúc đăng ký (`feeSnapshot`) | Tránh fee category đổi ảnh hưởng người đã đăng ký. |
| D27 | Approve KHÔNG yêu cầu `paid` | BTC tự chọn policy: thu trước approve, hay approve trước thu. Linh hoạt. |
| D28 | Số lượng đội đếm = approved + pending; reject pending → giảm 1 slot | Tránh slot bị "kẹt" với registration sắp bị từ chối. |
| D29 | Category có `code` unique trong tournament (vd `MD19`) | URL gọn, hiển thị compact, BTC tự đặt theo quy ước riêng. |
| D30 | Hạn đăng ký là gate cứng (API reject sau deadline), không auto đóng | KISS, BTC quyết định lúc nào đóng. |
| D31 | Team photo: default composite avatar (không lưu); BTC upload override | Tự động đủ dùng, override khi cần đẹp. |
| D32 | Trọng tài gán vào Court (giữ cố định), Match snapshot referee khi assign | Mô hình thực tế: trọng tài ngồi sân, match đến sân. Snapshot giữ lịch sử. |
| D33 | Match completed → court tự release | Vận hành mượt, BTC không phải clear tay. |
| D34 | Schedule chỉ là estimate tính từ start time + duration + số sân | Soft, không bind logic. Vận hành thực tế BTC quyết. |
| D35 | Drop `locked` state — `closed` đã làm danh sách public | KISS, 3 trạng thái thay vì 4. |
| D36 | Tách `Category.type` thành `playerCount` + `genderRequirement` (2 chiều độc lập) | Linh hoạt: hỗ trợ "đơn/đôi không phân biệt giới tính" cho giải phong trào nhỏ. |
| D37 | Thêm `genderRequirement = unrestricted` — không filter, không validate | Yêu cầu BTC giải nhỏ, trình độ thấp, nam nữ ko quá chênh lệch. |
| D38 | Organizer đăng ký hộ chỉ áp dụng VĐV đã có account | KISS, không cần ghost account model. VĐV phải tự signup trước. |
| D39 | Bulk register: validate từng dòng độc lập, partial commit | Tránh BTC nhập lại 20 dòng vì 1 dòng sai. |
| D40 | Organizer đăng ký hộ → auto `approved` | BTC chủ động = đã duyệt. Tránh thừa bước. |

## 8. Rủi ro & mitigation

| Rủi ro | Khả năng | Tác động | Mitigation |
|---|---|---|---|
| Mongo transaction cần replica set; misconfig → mutation atomic fail | Trung bình | Cao | RS bắt buộc cả dev (docker-compose 1-node) lẫn prod; healthcheck RS trước deploy |
| Cost hạ tầng tự host (VPS + Mongo + Spaces) | Trung bình | Trung bình | Sizing theo tải; index hợp lý; cache RSC ở Nginx/Vercel; monitor disk/bandwidth |
| Re-arrange bracket gây data inconsistency | Trung bình | Cao | Versioning + Mongo transaction; chỉ cho re-arrange trước match đầu tiên `in_progress` |
| Trọng tài nhập sai điểm | Cao | Thấp | Cho phép edit trong 24h; audit log; UI confirm trước khi kết thúc trận |
| Withdrawal cascade phá vỡ bracket giữa giải | Trung bình | Trung bình | Walkover loss giữ nguyên bracket structure; partner đôi rút = cả cặp walkover |
| Session/cookie cross-origin cấu hình sai (web↔api) | Trung bình | Cao | Cùng domain qua Nginx (SameSite=Lax) hoặc CORS credentials + SameSite=None;Secure; test e2e auth |
| Socket.IO multi-instance không share state | Thấp (MVP single) | Trung bình | MVP 1 instance; P5+ Redis adapter |
| User chiếm quyền organizer | Thấp | Cao | Chỉ admin cấp quyền; audit log cấp quyền |

## 9. Out of scope (rõ ràng KHÔNG làm)

- Quản lý CLB / liên đoàn / cấp bậc thành viên.
- Thanh toán phí đăng ký.
- Ranking ELO / hệ số.
- Livestream video.
- Bán vé / đặt sân.
- Quản lý dụng cụ / cầu / áo.
- Đa ngôn ngữ.
- Mobile app native.
- Tích hợp BWF / FIVB / federations.
- AI gợi ý seeding / drafting.

## 10. Acceptance criteria của MVP (P3)

Đến hết P3, hệ thống PHẢI làm được:

1. User A đăng ký account, điền họ tên + CCCD + giới tính + ngày sinh → CCCD chưa tồn tại → đăng ký thành công.
1.1. User B thử đăng ký với CCCD trùng A → hệ thống reject "CCCD này đã được đăng ký".
2. Admin cấp quyền organizer cho User A.
3. User A tạo tournament `isPublic=false` với basic info → vào trang Config thêm banner, thể lệ, 2 nhà tài trợ, ảnh QR + thông tin tài khoản → tạo 3 sân.
4. User A tạo 3 category: `MS` "Đơn nam" (playerCount=1, genderRequirement=`men_only`, best-of-3, deadline 2026-06-15, fee 100k, maxTeams=16), `MX` "Đôi nam-nữ" (playerCount=2, genderRequirement=`mixed_pair`, best-of-1, fee 200k/đội, maxTeams=8), và `OPEN` "Đôi không phân biệt" (playerCount=2, genderRequirement=`unrestricted`, fee 150k/đội, maxTeams=12).
5. User A bật `isPublic=true`, chuyển cả 2 category sang `open`.
6. 10 user đăng ký `MS` (1 user trùng CCCD → reject). 4 cặp đăng ký `MX` (1 cặp mixed sai gender → API reject). 5 cặp đăng ký `OPEN` (không validate gender, đều OK gồm 2 cặp nam-nam, 2 cặp nữ-nữ, 1 cặp mixed).
7. User A duyệt 7/9 `MS`, đánh dấu `paid` cho 5. Reject 1 pending → slot mở; user mới đăng ký vào lấp slot. Approve 3/3 `MX` valid, approve 5/5 `OPEN`, đánh dấu `paid` cho hầu hết.
7.1. User A dùng **bulk register** tạo 6 dòng (5 cho `MS`, 1 cho `MX`): trong đó 1 dòng `MX` chọn 2 user nam → API reject riêng dòng đó; 5 dòng `MS` valid → auto `approved`. UI hiển thị bảng: 5 success + 1 error rõ ràng.
8. User A thử đóng `MS` khi còn 2 pending → API reject "Còn 2 đăng ký pending". User A duyệt nốt → đóng `MS` thành công.
9. Sau khi `closed`: User B (khách lạ) vào trang public, thấy danh sách 8 đội `MS` + 3 cặp `MX` kèm composite avatar.
10. User A upload teamPhotoUrl cho 2 đội `MX` → trang public hiện ảnh override.
11. User A nhập seed, bốc thăm `MS` → bracket sinh ra hợp lệ (có bye vì 8 không phải 2^n... wait 8 = 2^3 OK, không bye). Bốc thăm `MX` (3 cặp) → 1 bye round 1.
12. User A vào Schedule Config: start 2026-06-20 08:00, 45 phút/trận → hệ thống sinh `scheduledAt` dự kiến cho từng match.
13. User A mời User C, User D làm trọng tài.
14. User A vào **Operations Console**: gán User C vào Sân 1, User D vào Sân 2. Kéo match `MS-R1-1` vào Sân 1 → match snapshot `refereeUid = C`. User C đăng nhập, thấy nút "Nhập điểm" chỉ ở match đó.
15. User C nhập điểm, bấm "Kết thúc trận" → winner đẩy lên `MS-QF`, Sân 1 tự release, sẵn sàng nhận match khác.
16. User E đã thắng `MS-R1`, đang chờ `MS-QF` → rút lui → trận R1 giữ nguyên, QF chuyển walkover, đối thủ đẩy lên SF.
17. User A vào edit điểm `MS-R1-2` (đã completed, winner đã advance) → đổi winner → UI hiển thị confirm "Sẽ reset 2 trận: QF#1, SF#1" → User A confirm → cascade revert + re-advance winner mới.
18. Trang public hiện score real-time khi User C nhập (< 3s).

## 11. Unresolved (chuyển vào P4+ hoặc cần quyết sau)

- Cơ chế reset password admin override?
- Có cho VĐV tự sửa profile lúc đang ở trong 1 giải?
- Trọng tài có cần ký xác nhận kết quả không (chữ ký số / signature)?
- Có cần export PDF kết quả giải không?
- Notification policy: email vs in-app vs push?

---

**Next artifact:** [docs/system-architecture.md](system-architecture.md) — ERD, MongoDB schema, NestJS module structure, guards/authz, Socket.IO + Spaces.
