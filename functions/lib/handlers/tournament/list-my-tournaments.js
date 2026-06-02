"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.listMyTournaments = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin_1 = require("../../lib/admin");
const role_guard_1 = require("../../middleware/role-guard");
// Giải của tôi: organizer thấy giải mình sở hữu; admin thấy tất cả.
exports.listMyTournaments = (0, https_1.onCall)({ region: admin_1.REGION }, async (req) => {
    const uid = (0, role_guard_1.assertOrganizer)(req);
    const col = admin_1.db.collection('tournaments');
    const snap = (0, role_guard_1.isAdmin)(req) ? await col.get() : await col.where('ownerUid', '==', uid).get();
    const tournaments = snap.docs.map((d) => {
        const t = d.data();
        return {
            id: d.id,
            name: t.name ?? '',
            slug: t.slug ?? '',
            status: t.status ?? 'draft',
            startDate: t.startDate ?? null,
            endDate: t.endDate ?? null,
            location: t.location ?? '',
            bannerUrl: t.bannerUrl ?? null,
            logoUrl: t.logoUrl ?? null,
            isOwner: t.ownerUid === uid,
            createdAt: t.createdAt?.toMillis?.() ?? null,
        };
    });
    tournaments.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    return { tournaments };
});
//# sourceMappingURL=list-my-tournaments.js.map