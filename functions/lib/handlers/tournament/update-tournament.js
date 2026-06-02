"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateTournament = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin_1 = require("../../lib/admin");
const role_guard_1 = require("../../middleware/role-guard");
const TIERS = ['diamond', 'gold', 'silver', 'operator', 'media'];
// Cập nhật 1 phần thông tin giải (các tab). Owner/admin. Chỉ nhận field hợp lệ.
exports.updateTournament = (0, https_1.onCall)({ region: admin_1.REGION }, async (req) => {
    const d = (req.data ?? {});
    const id = String(d['id'] ?? '');
    await (0, role_guard_1.assertTournamentAccess)(req, id);
    const patch = {};
    if ('name' in d) {
        const name = String(d['name'] ?? '').trim();
        if (name.length < 3)
            throw new https_1.HttpsError('invalid-argument', 'Tên giải tối thiểu 3 ký tự');
        patch['name'] = name;
    }
    if ('slug' in d) {
        const slug = String(d['slug'] ?? '').trim();
        if (!/^[a-z0-9-]{3,80}$/.test(slug))
            throw new https_1.HttpsError('invalid-argument', 'Slug không hợp lệ');
        patch['slug'] = slug;
    }
    if ('description' in d)
        patch['description'] = String(d['description'] ?? '').slice(0, 1000);
    if ('startDate' in d)
        patch['startDate'] = String(d['startDate'] ?? '');
    if ('endDate' in d)
        patch['endDate'] = String(d['endDate'] ?? '');
    if (patch['startDate'] && patch['endDate'] && patch['endDate'] < patch['startDate'])
        throw new https_1.HttpsError('invalid-argument', 'Ngày kết thúc phải sau ngày bắt đầu');
    if ('location' in d)
        patch['location'] = String(d['location'] ?? '').trim();
    if ('rulesText' in d)
        patch['rulesText'] = d['rulesText'] ? String(d['rulesText']).slice(0, 20000) : null;
    if ('bannerUrl' in d)
        patch['bannerUrl'] = d['bannerUrl'] ? String(d['bannerUrl']) : null;
    if ('logoUrl' in d)
        patch['logoUrl'] = d['logoUrl'] ? String(d['logoUrl']) : null;
    if ('isPublic' in d)
        patch['isPublic'] = d['isPublic'] === true;
    if ('sponsors' in d) {
        if (!Array.isArray(d['sponsors']))
            throw new https_1.HttpsError('invalid-argument', 'sponsors phải là mảng');
        patch['sponsors'] = d['sponsors'].map((s, i) => {
            const tier = String(s.tier ?? '');
            if (!TIERS.includes(tier))
                throw new https_1.HttpsError('invalid-argument', 'Bậc tài trợ không hợp lệ');
            return {
                id: String(s.id ?? `s${i}`),
                tier,
                name: String(s.name ?? '').slice(0, 120),
                logoUrl: s.logoUrl ? String(s.logoUrl) : null,
                link: String(s.link ?? '').slice(0, 300),
                description: String(s.description ?? '').slice(0, 300),
            };
        });
    }
    if (Object.keys(patch).length === 0)
        return { ok: true };
    await admin_1.db.doc(`tournaments/${id}`).set(patch, { merge: true });
    return { ok: true };
});
//# sourceMappingURL=update-tournament.js.map