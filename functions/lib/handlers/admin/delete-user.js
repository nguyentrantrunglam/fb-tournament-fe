"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.adminDeleteUser = void 0;
const https_1 = require("firebase-functions/v2/https");
const admin_1 = require("../../lib/admin");
const admin_guard_1 = require("../../middleware/admin-guard");
// Xoá user: Auth + users/{uid} + private/identity + cccdIndex. Admin-only, không tự xoá mình.
exports.adminDeleteUser = (0, https_1.onCall)({ region: admin_1.REGION }, async (req) => {
    const callerUid = (0, admin_guard_1.assertAdmin)(req);
    const { uid } = (req.data ?? {});
    if (typeof uid !== 'string' || !uid)
        throw new https_1.HttpsError('invalid-argument', 'Thiếu uid');
    if (uid === callerUid)
        throw new https_1.HttpsError('failed-precondition', 'Không thể tự xoá tài khoản của chính mình');
    // Lấy cccd để dọn cccdIndex
    const identitySnap = await admin_1.db.doc(`users/${uid}/private/identity`).get();
    const cccd = identitySnap.data()?.['cccd'];
    const batch = admin_1.db.batch();
    batch.delete(admin_1.db.doc(`users/${uid}/private/identity`));
    batch.delete(admin_1.db.doc(`users/${uid}`));
    if (cccd)
        batch.delete(admin_1.db.doc(`cccdIndex/${cccd}`));
    await batch.commit();
    await admin_1.authAdmin.deleteUser(uid).catch(() => {
        /* user Auth có thể đã bị xoá — bỏ qua */
    });
    return { ok: true };
});
//# sourceMappingURL=delete-user.js.map