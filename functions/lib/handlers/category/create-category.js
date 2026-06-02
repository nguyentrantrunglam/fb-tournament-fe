"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createCategory = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin_1 = require("../../lib/admin");
const firestore_1 = require("firebase-admin/firestore");
const role_guard_1 = require("../../middleware/role-guard");
const GENDERS = ['men_only', 'women_only', 'mixed_pair', 'unrestricted'];
// Tạo hạng mục thuộc 1 giải. Owner/admin. format mặc định single_elim (đổi sau).
exports.createCategory = (0, https_1.onCall)({ region: admin_1.REGION }, async (req) => {
    const d = (req.data ?? {});
    const tid = String(d.tournamentId ?? '');
    await (0, role_guard_1.assertTournamentAccess)(req, tid);
    const code = String(d.code ?? '').trim().toUpperCase();
    const name = String(d.name ?? '').trim();
    const playerCount = d.playerCount === 2 ? 2 : 1;
    const gender = String(d.genderRequirement ?? '');
    const bestOf = [1, 3, 5].includes(d.bestOf) ? d.bestOf : 3;
    const fee = Math.max(0, Math.floor(Number(d.fee) || 0));
    const maxTeams = Math.max(2, Math.min(256, Math.floor(Number(d.maxTeams) || 2)));
    const deadline = String(d.registrationDeadline ?? '');
    if (!/^[A-Z0-9_-]{2,12}$/.test(code))
        throw new https_1.HttpsError('invalid-argument', 'Mã hạng mục không hợp lệ');
    if (name.length < 1)
        throw new https_1.HttpsError('invalid-argument', 'Thiếu tên hạng mục');
    if (!GENDERS.includes(gender))
        throw new https_1.HttpsError('invalid-argument', 'Giới tính không hợp lệ');
    if (gender === 'mixed_pair' && playerCount === 1)
        throw new https_1.HttpsError('invalid-argument', 'Nam-nữ chỉ áp dụng nội dung đôi');
    if (!deadline)
        throw new https_1.HttpsError('invalid-argument', 'Thiếu hạn đăng ký');
    const ref = admin_1.db.collection(`tournaments/${tid}/categories`).doc();
    await ref.set({
        code,
        name,
        playerCount,
        genderRequirement: gender,
        format: 'single_elim',
        bestOf,
        fee,
        maxTeams,
        registrationDeadline: deadline,
        registrationStatus: 'not_open',
        createdAt: firestore_1.FieldValue.serverTimestamp(),
    });
    return { id: ref.id };
});
//# sourceMappingURL=create-category.js.map