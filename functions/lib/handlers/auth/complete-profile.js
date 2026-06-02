"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.completeProfile = void 0;
const https_1 = require("firebase-functions/v2/https");
const app_1 = require("firebase-admin/app");
const firestore_1 = require("firebase-admin/firestore");
if ((0, app_1.getApps)().length === 0)
    (0, app_1.initializeApp)();
const db = (0, firestore_1.getFirestore)();
const CCCD_RE = /^\d{12}$/;
// Signup bước 2: validate CCCD + transaction tạo users/{uid} + private/identity + cccdIndex/{cccd}.
// CCCD unique toàn hệ thống (transaction check cccdIndex).
exports.completeProfile = (0, https_1.onCall)({ region: 'asia-southeast1' }, async (req) => {
    const uid = req.auth?.uid;
    if (!uid)
        throw new https_1.HttpsError('unauthenticated', 'Cần đăng nhập');
    const { fullName, cccd, gender, dob, phone } = (req.data ?? {});
    if (typeof fullName !== 'string' || fullName.trim().length < 2)
        throw new https_1.HttpsError('invalid-argument', 'Họ tên không hợp lệ');
    if (typeof cccd !== 'string' || !CCCD_RE.test(cccd))
        throw new https_1.HttpsError('invalid-argument', 'CCCD phải gồm đúng 12 chữ số');
    if (gender !== 'male' && gender !== 'female')
        throw new https_1.HttpsError('invalid-argument', 'Giới tính không hợp lệ');
    if (typeof dob !== 'string' || !dob)
        throw new https_1.HttpsError('invalid-argument', 'Ngày sinh không hợp lệ');
    const phoneVal = typeof phone === 'string' && phone ? phone : null;
    const userRef = db.doc(`users/${uid}`);
    const identityRef = db.doc(`users/${uid}/private/identity`);
    const cccdRef = db.doc(`cccdIndex/${cccd}`);
    await db.runTransaction(async (tx) => {
        const [cccdSnap, userSnap] = await Promise.all([tx.get(cccdRef), tx.get(userRef)]);
        if (cccdSnap.exists)
            throw new https_1.HttpsError('already-exists', 'CCCD đã được đăng ký');
        if (userSnap.exists)
            throw new https_1.HttpsError('already-exists', 'Hồ sơ đã tồn tại');
        const now = firestore_1.FieldValue.serverTimestamp();
        tx.set(userRef, {
            displayName: fullName.trim(),
            gender,
            dob,
            avatarUrl: null,
            globalRole: 'user',
            createdAt: now,
        });
        tx.set(identityRef, { cccd, phone: phoneVal, email: req.auth?.token.email ?? null });
        tx.set(cccdRef, { userId: uid, createdAt: now });
    });
    return { ok: true };
});
//# sourceMappingURL=complete-profile.js.map