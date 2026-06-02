"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminSetGlobalRole = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin_1 = require("../../lib/admin");
const admin_guard_1 = require("../../middleware/admin-guard");
// Cấp/thu hồi quyền admin: set custom claim + users/{uid}.globalRole. Admin-only.
exports.adminSetGlobalRole = (0, https_1.onCall)({ region: admin_1.REGION }, async (req) => {
    const callerUid = (0, admin_guard_1.assertAdmin)(req);
    const { uid, role } = (req.data ?? {});
    if (typeof uid !== 'string' || !uid)
        throw new https_1.HttpsError('invalid-argument', 'Thiếu uid');
    if (role !== 'admin' && role !== 'organizer' && role !== 'user')
        throw new https_1.HttpsError('invalid-argument', 'Quyền không hợp lệ');
    if (uid === callerUid && role !== 'admin')
        throw new https_1.HttpsError('failed-precondition', 'Không thể tự thu hồi quyền admin của chính mình');
    await admin_1.authAdmin.setCustomUserClaims(uid, { globalRole: role });
    await admin_1.db.doc(`users/${uid}`).set({ globalRole: role }, { merge: true });
    return { ok: true };
});
//# sourceMappingURL=set-global-role.js.map