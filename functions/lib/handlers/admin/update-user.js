"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminUpdateUser = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin_1 = require("../../lib/admin");
const admin_guard_1 = require("../../middleware/admin-guard");
// Sửa thông tin user (displayName, phone). KHÔNG cho sửa CCCD/gender/dob (PII lock). Admin-only.
exports.adminUpdateUser = (0, https_1.onCall)({ region: admin_1.REGION }, async (req) => {
    (0, admin_guard_1.assertAdmin)(req);
    const { uid, displayName, phone } = (req.data ?? {});
    if (typeof uid !== 'string' || !uid)
        throw new https_1.HttpsError('invalid-argument', 'Thiếu uid');
    if (typeof displayName !== 'string' || displayName.trim().length < 2)
        throw new https_1.HttpsError('invalid-argument', 'Họ tên không hợp lệ');
    const phoneVal = typeof phone === 'string' && phone ? phone : null;
    await admin_1.db.doc(`users/${uid}`).set({ displayName: displayName.trim() }, { merge: true });
    await admin_1.db.doc(`users/${uid}/private/identity`).set({ phone: phoneVal }, { merge: true });
    await admin_1.authAdmin.updateUser(uid, { displayName: displayName.trim() });
    return { ok: true };
});
//# sourceMappingURL=update-user.js.map