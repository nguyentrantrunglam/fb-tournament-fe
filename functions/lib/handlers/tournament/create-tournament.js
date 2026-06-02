"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.createTournament = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin_1 = require("../../lib/admin");
const firestore_1 = require("firebase-admin/firestore");
const role_guard_1 = require("../../middleware/role-guard");
function slugify(text) {
    return text
        .toLowerCase()
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .replace(/đ/g, 'd')
        .replace(/[^a-z0-9\s-]/g, '')
        .replace(/\s+/g, '-')
        .replace(/-+/g, '-')
        .replace(/^-|-$/g, '')
        .slice(0, 60);
}
// Tạo giải: organizer/admin. Set ownerUid + roles/{uid}=organizer. Trả {id}.
exports.createTournament = (0, https_1.onCall)({ region: admin_1.REGION }, async (req) => {
    const uid = (0, role_guard_1.assertOrganizer)(req);
    const { name, startDate, endDate, location } = (req.data ?? {});
    if (typeof name !== 'string' || name.trim().length < 3)
        throw new https_1.HttpsError('invalid-argument', 'Tên giải tối thiểu 3 ký tự');
    if (typeof startDate !== 'string' || !startDate)
        throw new https_1.HttpsError('invalid-argument', 'Thiếu ngày bắt đầu');
    if (typeof endDate !== 'string' || !endDate)
        throw new https_1.HttpsError('invalid-argument', 'Thiếu ngày kết thúc');
    if (endDate < startDate)
        throw new https_1.HttpsError('invalid-argument', 'Ngày kết thúc phải sau ngày bắt đầu');
    if (typeof location !== 'string' || location.trim().length < 3)
        throw new https_1.HttpsError('invalid-argument', 'Thiếu địa điểm');
    const ref = admin_1.db.collection('tournaments').doc();
    const slug = `${slugify(name) || 'giai'}-${ref.id.slice(0, 5).toLowerCase()}`;
    const now = firestore_1.FieldValue.serverTimestamp();
    const batch = admin_1.db.batch();
    batch.set(ref, {
        name: name.trim(),
        slug,
        description: '',
        startDate,
        endDate,
        location: location.trim(),
        bannerUrl: null,
        logoUrl: null,
        rulesText: null,
        sponsors: [],
        paymentConfig: null,
        isPublic: false,
        ownerUid: uid,
        status: 'draft',
        createdAt: now,
    });
    batch.set(ref.collection('roles').doc(uid), { role: 'organizer', createdAt: now });
    await batch.commit();
    return { id: ref.id, slug };
});
//# sourceMappingURL=create-tournament.js.map