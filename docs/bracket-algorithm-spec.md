# Bracket Algorithm Spec — Single Elimination + Crossover Seeding

> **Status:** Draft v0.1
> **Ngày:** 2026-05-28
> **Scope:** 3 thể thức — `single_elim` (đặc tả đầy đủ dưới đây), `round_robin`, `group_ko`. Thuật toán RR/Group tóm tắt ở §11; chi tiết sinh match RR/Group sẽ hoàn thiện khi implement P5.
> **Kèm:** [system-architecture.md](system-architecture.md) §3 (ERD Match/Bracket), [project-overview-pdr.md](project-overview-pdr.md) §4 (Category lifecycle).

---

## 1. Mục tiêu

Định nghĩa thuật toán **deterministic** để:
1. Nhận danh sách `Registration` đã `approved` + seed map (manual của BTC) → sinh ra `Bracket` + tập `Match` đầy đủ liên kết `nextMatchId`.
2. Xử lý số người không phải luỹ thừa 2 → tự động tạo "bye" (vé miễn vào vòng sau cho top seeds).
3. Hỗ trợ **crossover seeding** (sơ đồ chuẩn): top seeds gặp nhau ở vòng càng muộn càng tốt.
4. Hỗ trợ **re-arrange** (swap 2 slot) sau khi đã bốc thăm, tạo bracket version mới.

**Không thuộc spec này:** Double Elimination. (Round Robin & Group + KO: xem §11.)

---

## 2. Thuật ngữ

| Tên | Ý nghĩa |
|---|---|
| **Seed** | Số thứ tự xếp hạng do BTC gán cho 1 Registration. Seed 1 = mạnh nhất. |
| **Bracket size** | Tổng số slot = luỹ thừa 2 gần nhất ≥ số người đăng ký. |
| **Bye** | Slot trống. Người ghép với bye tự động thắng vòng đó. |
| **Crossover seeding** | Cách xếp seed sao cho s1 vs s2 chỉ gặp nhau ở chung kết, s1 vs s4 ở bán kết, v.v. |
| **Slot index** | Vị trí 0-based trong bracket. Match round 1 ghép (slot 0, slot 1), (slot 2, slot 3), ... |
| **Round 1 / R1** | Vòng đầu tiên (nhiều match nhất). |
| **Final / R_max** | Vòng cuối (1 match). |
| **slot.position** | (round, slotIndex) — vị trí của 1 match trong sơ đồ. |
| **nextMatchId** | Match mà winner sẽ đẩy lên. Final.nextMatchId = null. |

---

## 3. Inputs & Outputs

### Input (callable `drawBracket`)

```ts
{
  categoryId: string
}
```

**Chỉ cần `categoryId`** — seed đã được gán trước đó trên từng `Registration.seed` (ở phase Config đội). CF tự đọc và quyết định mode.

**Mode auto-detect:**

```ts
const seededCount = registrations.filter(r => r.seed != null).length
const mode: 'seeded' | 'random' = seededCount > 0 ? 'seeded' : 'random'
```

| Mode | Khi nào | Logic |
|---|---|---|
| `seeded` | Có ≥1 reg có `seed != null` | Validate các seed đã gán, các reg unseeded random fill seed. Crossover placement. |
| `random` | Không reg nào có seed | Tất cả gán seed random 1..N, crossover placement (effectively random pairing + random bye). |

**Tiền điều kiện:**
- `category.registrationStatus == 'closed'` (đã chốt danh sách).
- Tổng số registration `status == 'approved'` ≥ 2.
- Mode `seeded`: seed values (non-null) đã gán **unique** và trong khoảng `[1, N]`.
- BTC chỉnh `Registration.seed` qua endpoint riêng `setRegistrationSeed({registrationId, seed})` ở phase config đội — KHÔNG truyền seed lúc drawBracket.

### Output (atomic Firestore batch)

1. **1 Bracket doc** mới (version = max+1, isActive=true; bracket cũ nếu có thì set isActive=false).
2. **N Match docs** với:
   - `round`, `slotIndex`
   - `sideAId`, `sideBId` (link tới `MatchSide` docs)
   - `nextMatchId`
   - `isBye` flag
   - `status`: `pending` cho match thường, `completed` cho match có bye (auto-resolved)
3. **2N MatchSide docs** (mỗi match 2 side, 1 số side là phantom cho bye).
4. **Audit log doc** ghi: ai bốc, lúc nào, version, seedAssignments snapshot.

---

## 4. Thuật toán tổng quan

```
Step 1: Tính bracket size + số bye
Step 2: Resolve seed (gán seed cho unseeded)
Step 3: Tính slot order theo crossover seeding
Step 4: Đặt registration vào slot (slot > registrationCount = bye phantom)
Step 5: Sinh Match cho từng round
Step 6: Liên kết nextMatchId
Step 7: Resolve bye matches (auto-advance)
```

---

## 5. Step 1 — Bracket size + byes

```ts
const N = registrations.length              // số người/đội thật
const bracketSize = nextPowerOf2(N)         // 2, 4, 8, 16, 32, 64, ...
const byes = bracketSize - N                // số slot trống
const rounds = log2(bracketSize)            // số vòng đấu
```

**Edge cases:**
- N = 1: không tổ chức được giải. CF reject "Category cần ≥ 2 người".
- N = 2: bracketSize=2, byes=0, rounds=1. Chỉ 1 trận chung kết.
- N = 3: bracketSize=4, byes=1.
- N = 16: bracketSize=16, byes=0. Đẹp nhất.
- N > 128: cảnh báo BTC (bracket sâu, batch Firestore có thể vượt 500 ops, cần chunked).

---

## 6. Step 2 — Resolve seed

Đọc `Registration.seed` của tất cả approved regs trong category. Phân tách seeded vs unseeded:

```ts
const seeded = registrations.filter(r => r.seed != null)
const unseeded = registrations.filter(r => r.seed == null)
const mode = seeded.length > 0 ? 'seeded' : 'random'

// Mode 'random' = seeded rỗng → tất cả unseeded → random fill 1..N
// Mode 'seeded' = validate seeded values, unseeded random fill các seed còn trống

// Validate seeded
- seed values phải unique
- seed values phải nằm trong [1, N]
- Nếu vi phạm: reject

// Tính dải seed còn trống cho unseeded
const usedSeeds = new Set(seeded.map(s => s.seed))
const freeSeeds = range(1, N).filter(s => !usedSeeds.has(s))

// Random shuffle freeSeeds, gán cho unseeded theo thứ tự
shuffle(freeSeeds)            // Fisher-Yates
unseeded.forEach((u, i) => u.seed = freeSeeds[i])

// Kết quả: seedToRegistration: Map<number, registrationId>
```

**Lưu ý random:**
- Random seed phải deterministic-on-rerun **trong scope 1 lần draw** (nếu user click nhiều lần): dùng Crypto.randomUUID() + Math.random() đều OK ở MVP.
- Mỗi lần BTC bấm "Bốc lại" = bracket version mới, random lại từ đầu.

---

## 7. Step 3 — Crossover seed order

**Mục đích:** Tính một mảng `slotToSeed[slotIndex] = seed` sao cho seed nhỏ (mạnh) gặp nhau càng muộn càng tốt.

**Thuật toán đệ quy (chuẩn knockout bracket):**

```ts
function buildCrossoverSeedOrder(rounds: number): number[] {
  if (rounds === 0) return [1]
  const prev = buildCrossoverSeedOrder(rounds - 1)
  const n = prev.length * 2 + 1
  const result: number[] = []
  for (const s of prev) {
    result.push(s)
    result.push(n - s)
  }
  return result
}
```

**Mẫu kết quả:**

| Rounds | Bracket size | seedOrder |
|---|---|---|
| 1 | 2 | `[1, 2]` |
| 2 | 4 | `[1, 4, 2, 3]` |
| 3 | 8 | `[1, 8, 4, 5, 2, 7, 3, 6]` |
| 4 | 16 | `[1, 16, 8, 9, 4, 13, 5, 12, 2, 15, 7, 10, 3, 14, 6, 11]` |
| 5 | 32 | (32 phần tử) |

**Diễn giải bracket size 8** (`[1, 8, 4, 5, 2, 7, 3, 6]`):
- R1 matches:
  - Slot 0 (seed 1) vs Slot 1 (seed 8)
  - Slot 2 (seed 4) vs Slot 3 (seed 5)
  - Slot 4 (seed 2) vs Slot 5 (seed 7)
  - Slot 6 (seed 3) vs Slot 7 (seed 6)
- R2 (semis):
  - Winner(M0) vs Winner(M1) → seed 1 hoặc 8 gặp 4 hoặc 5
  - Winner(M2) vs Winner(M3) → seed 2 hoặc 7 gặp 3 hoặc 6
- R3 (final): seed 1 vs seed 2 (nếu top seeds thắng hết)

Đây chính là **crossover** mà BTC mong muốn.

---

## 8. Step 4 — Đặt registration vào slot

```ts
const slotToRegistration: (string | 'BYE')[] = new Array(bracketSize)
for (let slotIdx = 0; slotIdx < bracketSize; slotIdx++) {
  const seed = seedOrder[slotIdx]
  if (seed > N) {
    slotToRegistration[slotIdx] = 'BYE'    // phantom
  } else {
    slotToRegistration[slotIdx] = seedToRegistration.get(seed)!
  }
}
```

**Quy tắc bye:** Vì seed cao nhất (N+1..bracketSize) không có registration thật → top seeds (1, 2, 3...) ghép với bye → tự thắng → vào R2.

**Ví dụ N=6, bracketSize=8:**
- seedOrder = `[1, 8, 4, 5, 2, 7, 3, 6]`
- slot 0: seed 1 (reg)
- slot 1: seed 8 (BYE) — slot 0 thắng walkover
- slot 2: seed 4 (reg)
- slot 3: seed 5 (reg)
- slot 4: seed 2 (reg)
- slot 5: seed 7 (BYE) — slot 4 thắng walkover
- slot 6: seed 3 (reg)
- slot 7: seed 6 (reg)

Kết quả: seed 1 và seed 2 được bye, R1 có 2 trận thật, R2 có 4 người (auto-2 + 2 winners).

---

## 9. Step 5 — Sinh Match docs

**Cấu trúc id quy ước:** `matchId = "{categoryId}-R{round}-{slotIndex}"`. Vd: `MS-R1-0`, `MS-R2-1`.

**Round 1:**

```ts
const matches: MatchDoc[] = []
const r1Count = bracketSize / 2

for (let i = 0; i < r1Count; i++) {
  const slotA = i * 2
  const slotB = i * 2 + 1
  const regA = slotToRegistration[slotA]
  const regB = slotToRegistration[slotB]

  const isBye = (regA === 'BYE' || regB === 'BYE')
  const winnerSide = isBye
    ? (regA === 'BYE' ? 'B' : 'A')
    : null
  const status = isBye ? 'completed' : 'pending'

  matches.push({
    id: matchId(categoryId, 1, i),
    bracketId, categoryId,
    round: 1,
    slotIndex: i,
    sideAId: regA === 'BYE' ? null : sideId('A', regA, registrations),
    sideBId: regB === 'BYE' ? null : sideId('B', regB, registrations),
    isBye,
    status,
    winnerSideId: winnerSide,
    nextMatchId: null,   // set ở Step 6
    // ...other fields default null
  })
}
```

**Round 2 và sau:**

```ts
for (let r = 2; r <= rounds; r++) {
  const matchCount = bracketSize / (2 ** r)
  for (let i = 0; i < matchCount; i++) {
    matches.push({
      id: matchId(categoryId, r, i),
      bracketId, categoryId,
      round: r,
      slotIndex: i,
      sideAId: null,       // chờ winner round trước
      sideBId: null,
      status: 'pending',
      // ...
    })
  }
}
```

**MatchSide docs:** Mỗi side của R1 có sẵn registrationId(s). R2+ side bắt đầu null → fill khi advance winner.

```ts
// Side document cho R1
{
  id: sideId,
  matchId,
  registrationIdPrimary: regId,
  registrationIdPartner: registration.partnerUserId ? ... : null,
  gamesWon: 0,
  // denormalize userIds: [primaryUid, partnerUid?]
  userIds: [...] 
}
```

---

## 10. Step 6 — Liên kết nextMatchId

**Quy tắc:** Match `(round=r, slot=i)` của round `r` đẩy winner lên match `(round=r+1, slot=floor(i/2))`. Side đẩy lên:
- Nếu `i % 2 == 0` → side A
- Nếu `i % 2 == 1` → side B

```ts
for (const m of matches) {
  if (m.round === rounds) {
    m.nextMatchId = null   // final
  } else {
    const nextSlot = Math.floor(m.slotIndex / 2)
    const nextSide = m.slotIndex % 2 === 0 ? 'A' : 'B'
    m.nextMatchId = matchId(categoryId, m.round + 1, nextSlot)
    m.nextSide = nextSide   // hint, không lưu — compute on advance
  }
}
```

**Lưu ý:** `nextSide` không cần lưu vào doc vì có thể compute từ `slotIndex`. Save bytes Firestore.

---

## 11. Step 7 — Resolve bye matches (auto-advance)

Các match `isBye=true` ở R1 phải tự đẩy người thắng lên R2 ngay trong batch tạo bracket — KHÔNG để dạng `completed` chưa advance.

```ts
for (const m of matches.filter(x => x.isBye)) {
  const winnerSideRegId = m.winnerSideId === 'A'
    ? m.sideARegistration
    : m.sideBRegistration
  const nextM = matches.find(x => x.id === m.nextMatchId)
  const nextSide = m.slotIndex % 2 === 0 ? 'A' : 'B'
  // Set nextM.sideA hoặc sideB = winner
  if (nextSide === 'A') {
    nextM.sideAId = createOrLinkSide(nextM, winnerSideRegId)
  } else {
    nextM.sideBId = createOrLinkSide(nextM, winnerSideRegId)
  }
}
```

**Edge case 2 byes ghép nhau:** Không xảy ra với thuật toán seed này (byes luôn cao seed, ghép với top seeds). Vẫn nên defensive check.

**Edge case nextMatch cũng có cả 2 bye:** Nếu R1 có 2 match bye liền kề (slot 0 và slot 1) đẩy winner lên slot 0 R2, thì R2-0 sẽ có 2 side đều là người thật từ bye → trận R2-0 thường (không bye).

---

## 12. Re-arrange (swap 2 slot)

**Use case:** Sau bốc thăm, BTC muốn đổi vị trí 2 VĐV (vd: trùng CLB không nên gặp R1).

**Input:** `rearrangeBracket({categoryId, swap: [slotA, slotB]})`.

**Constraint:**
- Cả 2 slot phải ở **Round 1** (MVP).
- Match R1 chứa 2 slot này phải `status == pending` (chưa start). Nếu đã start hoặc completed → CF reject.
- Không cho swap nếu R2 đã có match nào start.

**Algorithm:**
1. Đọc bracket active hiện tại.
2. Clone toàn bộ matches của bracket.
3. Trên clone: swap `slotToRegistration[slotA]` và `slotToRegistration[slotB]`.
4. Re-build R1 matches chỉ cho 2 match bị ảnh hưởng (1 hoặc 2 match tuỳ slot).
5. Re-resolve bye cho 2 match đó (nếu có).
6. Re-advance lên R2 nếu match bị bye-resolve.
7. Tạo bracket version mới (`version = current+1, isActive=true`).
8. Set bracket cũ `isActive=false`.
9. Audit log: `swap`, `oldVersion`, `newVersion`.

**Lưu ý:** R2+ matches sideA/sideB có thể đổi do bye resolve khác — phải clone toàn bộ và re-link.

**Phiên bản nâng cao (P5+):** swap match khác round, swap nhiều cặp cùng lúc. MVP: 1 cặp R1.

---

## 13. Worked Example đầy đủ

**Setup:** Category `MS`, 6 VĐV approved, BTC seed manual `[A=1, B=2, C=3]`, các VĐV D/E/F không seed.

**Step 1:** N=6, bracketSize=8, byes=2, rounds=3.

**Step 2:** Resolve seed
- Seeded: A=1, B=2, C=3
- Unseeded: D, E, F
- freeSeeds = [4, 5, 6]
- Shuffle → say [5, 4, 6] → D=5, E=4, F=6
- seedToReg = {1:A, 2:B, 3:C, 4:E, 5:D, 6:F}

**Step 3:** seedOrder = `[1, 8, 4, 5, 2, 7, 3, 6]`.

**Step 4:** slotToReg
| slot | seed | reg |
|---|---|---|
| 0 | 1 | A |
| 1 | 8 | BYE |
| 2 | 4 | E |
| 3 | 5 | D |
| 4 | 2 | B |
| 5 | 7 | BYE |
| 6 | 3 | C |
| 7 | 6 | F |

**Step 5:** R1 matches
| Match | Side A | Side B | isBye | status | winner |
|---|---|---|---|---|---|
| MS-R1-0 | A | BYE | true | completed | A |
| MS-R1-1 | E | D | false | pending | — |
| MS-R1-2 | B | BYE | true | completed | B |
| MS-R1-3 | C | F | false | pending | — |

R2 matches (chưa có side):
- MS-R2-0
- MS-R2-1

R3: MS-R3-0 (final).

**Step 6:** nextMatchId
| Match | nextMatchId | nextSide |
|---|---|---|
| MS-R1-0 | MS-R2-0 | A |
| MS-R1-1 | MS-R2-0 | B |
| MS-R1-2 | MS-R2-1 | A |
| MS-R1-3 | MS-R2-1 | B |
| MS-R2-0 | MS-R3-0 | A |
| MS-R2-1 | MS-R3-0 | B |
| MS-R3-0 | null | — |

**Step 7:** Resolve bye
- MS-R1-0 (winner A) → fill MS-R2-0.sideA = A
- MS-R1-2 (winner B) → fill MS-R2-1.sideA = B

**Bracket sau khi tạo xong:**
```
R1:
  A vs -        → A (bye)
  E vs D        → ?
  B vs -        → B (bye)
  C vs F        → ?

R2:
  A vs winner(E,D)
  B vs winner(C,F)

R3:
  winner(R2-0) vs winner(R2-1)
```

✓ Đẹp: nếu seed đúng, A vs B (seed 1 vs 2) gặp ở final.

---

## 14. Pseudocode tổng

```ts
async function drawBracket(categoryId): Promise<Bracket> {
  // 0. Auth & validation
  await assertOrganizer(ctx.auth, categoryId)
  const category = await readCategory(categoryId)
  if (category.registrationStatus !== 'closed') throw 'CATEGORY_NOT_CLOSED'
  const regs = await readApprovedRegistrations(categoryId)
  // Đọc seed từ Registration.seed (đã set qua setRegistrationSeed trước đó)
  const seededRegs = regs.filter(r => r.seed != null)
  const mode = seededRegs.length > 0 ? 'seeded' : 'random'
  validateSeeds(seededRegs, regs.length)

  // 1. Bracket size
  const N = regs.length
  if (N < 2) throw 'NOT_ENOUGH_PARTICIPANTS'
  const bracketSize = nextPowerOf2(N)
  const byes = bracketSize - N
  const rounds = Math.log2(bracketSize)

  // 2. Resolve seeds
  const seedToReg = resolveSeeds(seedAssignments, regs)

  // 3. Slot order
  const seedOrder = buildCrossoverSeedOrder(rounds)

  // 4. Place registrations
  const slotToReg = new Array(bracketSize)
  for (let i = 0; i < bracketSize; i++) {
    const s = seedOrder[i]
    slotToReg[i] = s > N ? 'BYE' : seedToReg.get(s)
  }

  // 5. Create bracket doc
  const bracketId = uuid()
  const newVersion = await getNextBracketVersion(categoryId)
  const bracketDoc = {
    id: bracketId, categoryId, version: newVersion,
    isActive: true,
    drawnAt: now(), drawnByUid: ctx.auth.uid,
  }

  // 6. Build R1 matches + sides
  const matches: MatchDoc[] = []
  const sides: MatchSideDoc[] = []
  for (let i = 0; i < bracketSize / 2; i++) {
    const slotA = i * 2, slotB = i * 2 + 1
    const regA = slotToReg[slotA], regB = slotToReg[slotB]
    const isBye = regA === 'BYE' || regB === 'BYE'

    const sideAId = regA !== 'BYE' ? uuid() : null
    const sideBId = regB !== 'BYE' ? uuid() : null
    if (sideAId) sides.push(buildSide(sideAId, regA))
    if (sideBId) sides.push(buildSide(sideBId, regB))

    const winnerSideId = isBye
      ? (regA === 'BYE' ? sideBId : sideAId)
      : null

    matches.push({
      id: matchId(categoryId, 1, i),
      bracketId, categoryId,
      round: 1, slotIndex: i,
      sideAId, sideBId,
      isBye,
      status: isBye ? 'completed' : 'pending',
      winnerSideId,
      nextMatchId: rounds > 1
        ? matchId(categoryId, 2, Math.floor(i / 2))
        : null,
    })
  }

  // 7. Build R2..Rmax (empty sides)
  for (let r = 2; r <= rounds; r++) {
    const count = bracketSize / 2 ** r
    for (let i = 0; i < count; i++) {
      matches.push({
        id: matchId(categoryId, r, i),
        bracketId, categoryId,
        round: r, slotIndex: i,
        sideAId: null, sideBId: null,
        status: 'pending', isBye: false, winnerSideId: null,
        nextMatchId: r < rounds
          ? matchId(categoryId, r + 1, Math.floor(i / 2))
          : null,
      })
    }
  }

  // 8. Apply bye → advance to R2
  for (const m of matches.filter(x => x.round === 1 && x.isBye)) {
    const winnerSide = sides.find(s => s.id === m.winnerSideId)
    const nextM = matches.find(x => x.id === m.nextMatchId)
    const newNextSide = createAdvancedSide(nextM, winnerSide)
    sides.push(newNextSide)
    if (m.slotIndex % 2 === 0) nextM.sideAId = newNextSide.id
    else nextM.sideBId = newNextSide.id
  }

  // 9. Firestore batch write
  await runInTransaction(async tx => {
    // mark old bracket inactive
    const oldActive = await readActiveBracket(categoryId)
    if (oldActive) tx.update(oldActive.ref, { isActive: false })

    tx.set(bracketRef(bracketId), bracketDoc)
    for (const m of matches) tx.set(matchRef(m.id), m)
    for (const s of sides) tx.set(sideRef(s.id), s)
    tx.set(auditRef(), {
      type: 'BRACKET_DRAWN',
      bracketId, categoryId, version: newVersion,
      drawnByUid: ctx.auth.uid,
      seedSnapshot: seedAssignments,
      at: now(),
    })
  })

  return bracketDoc
}
```

---

## 15. Test cases bắt buộc

| # | Input | Expected |
|---|---|---|
| T1 | N=2, không seed | 1 match, R=1, không bye |
| T2 | N=3, không seed | 4 slot, 1 bye, 2 R1 match (1 bye + 1 normal), 1 R2 |
| T3 | N=4, seed [1,2,3,4] | seedOrder [1,4,2,3] → R1: (1v4, 2v3); R2: final 1v2 (nếu top thắng) |
| T4 | N=8, seed 1-8 | R1: (1v8, 4v5, 2v7, 3v6); R2: (1v4, 2v3); Final: 1v2 |
| T5 | N=6, manual seed [A=1,B=2,C=3], rest random | 2 byes cho A và B; D/E/F random vào seed 4,5,6 |
| T6 | N=16, all seeded | R4 (final). 4 rounds. 15 matches. |
| T7 | N=1 | CF reject NOT_ENOUGH_PARTICIPANTS |
| T8 | Seed duplicate (2 reg cùng seed=1) | CF reject INVALID_SEED |
| T9 | Seed out of range (seed=10 khi N=6) | CF reject INVALID_SEED |
| T10 | Re-draw (call drawBracket lần 2) | version mới = max+1, bracket cũ isActive=false |
| T10a | Mode `random` với N=6 | Bracket sinh, byes random rơi vào 2 người ngẫu nhiên, seed gán 1..6 random |
| T10b | Mode `random` chạy 2 lần liên tiếp | 2 bracket version khác nhau (random reseed mỗi lần), bracket cũ isActive=false |
| T11 | N=64 (bracket lớn) | 6 rounds, 63 matches, batch < 500 ops ✓ |
| T12 | N=128 | 7 rounds, 127 matches. Cần chunked transaction. |

---

## 16. Constraints & Limits

| Item | Limit |
|---|---|
| Số người tối thiểu (N) | 2 |
| Số người tối đa MVP | 128 (256 doc match + 256 side + 1 bracket = 513 < 500 batch) → cần chunked |
| Re-arrange chỉ ở R1 | ✓ MVP |
| Số bracket version giữ lại | Tất cả (audit). Có thể prune ở P6+ |

**Chunked transaction cho N>64:**
- Firestore batch giới hạn 500 ops. N=128 → 127 matches + 254 sides + 1 bracket = 382 < 500 OK.
- N=256 → 255 + 510 + 1 = 766 > 500 → chia 2 batch.

---

## 17. Open questions

- Có cần thuật toán **anti-clustering** không (vd: tránh CLB X gặp CLB X ở R1)? Hiện không có khái niệm CLB ở MVP, bỏ qua.
- Re-arrange P5+ có cho swap khác round không? Nếu có, cascade revert toàn bộ?
- Có cần hiển thị "Path to final" cho từng VĐV (highlight 1 path) không? UI nice-to-have.
- Có support "skip seed" (vd seed 1, 2, không có seed 3, seed 4 = D)? Hiện validate phải liên tục 1..K — strict hơn, dễ debug.

---

## 11. Round Robin & Group + KO (tóm tắt)

> Bổ sung khi mở rộng 3 thể thức. Chi tiết sinh match sẽ chốt lúc implement P5.

### 11.1 Round Robin (`round_robin`)
- Mọi đội gặp nhau 1 lượt: `C(n,2)` trận. Sinh cặp bằng circle method (round-robin scheduling) để rải đều lượt nghỉ.
- Không có `nextMatchId` (không loại trực tiếp). Mỗi trận độc lập.
- **Xếp hạng**: điểm (thắng=2, thua=0 — hoặc cấu hình) → tie-break theo hiệu số game (`gameDiff`) → đối đầu trực tiếp.
- UI: bảng xếp hạng (TR/T/B/+−/Điểm) + danh sách trận.

### 11.2 Group + KO (`group_ko`)
- `formatConfig = { groupCount, qualifyPerGroup }`.
- **Vòng bảng**: chia đội vào `groupCount` bảng (rải seed theo bảng), mỗi bảng đá round-robin (§11.1) → xếp hạng nội bảng.
- **Vòng trong (KO)**: lấy `qualifyPerGroup` đội đầu mỗi bảng → seed vào bracket loại trực tiếp (§3–§10), thường ghép nhất-bảng-A vs nhì-bảng-B chéo nhau.
- UI: lưới bảng (đội qualified tô sáng) + KO bracket (tái dùng renderer single-elim).

### 11.3 Match.order & lịch
- Mọi thể thức: match có `order` (thứ tự thi đấu). BTC kéo đổi ở trang Lịch → tính lại `scheduledAt`. Gán sân ở Vận hành LIVE.
