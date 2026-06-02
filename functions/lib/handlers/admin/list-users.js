"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminListUsers = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin_1 = require("../../lib/admin");
const admin_guard_1 = require("../../middleware/admin-guard");
// Danh sách user cho admin: merge Auth (email) + Firestore users (profile). Admin-only.
exports.adminListUsers = (0, https_1.onCall)({ region: admin_1.REGION }, async (req) => {
    (0, admin_guard_1.assertAdmin)(req);
    const [authList, snap] = await Promise.all([admin_1.authAdmin.listUsers(1000), admin_1.db.collection('users').get()]);
    const docs = new Map(snap.docs.map((d) => [d.id, d.data()]));
    const users = authList.users.map((u) => {
        const d = docs.get(u.uid) ?? {};
        const role = u.customClaims?.['globalRole'] ?? d.globalRole ?? 'user';
        return {
            uid: u.uid,
            email: u.email ?? null,
            displayName: d.displayName ?? u.displayName ?? '',
            gender: d.gender ?? null,
            dob: d.dob ?? null,
            globalRole: role,
            disabled: u.disabled,
            createdAt: d.createdAt?.toMillis?.() ?? null,
        };
    });
    users.sort((a, b) => (b.createdAt ?? 0) - (a.createdAt ?? 0));
    return { users };
});
//# sourceMappingURL=list-users.js.map