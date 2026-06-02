"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertTournamentAccess = assertTournamentAccess;
exports.assertOrganizer = assertOrganizer;
exports.isAdmin = isAdmin;
const https_1 = require("firebase-functions/v2/https");
const admin_1 = require("../lib/admin");
// Caller phải là owner của giải (hoặc admin). Trả uid caller.
async function assertTournamentAccess(req, tid) {
    if (!req.auth)
        throw new https_1.HttpsError('unauthenticated', 'Cần đăng nhập');
    if (typeof tid !== 'string' || !tid)
        throw new https_1.HttpsError('invalid-argument', 'Thiếu tournamentId');
    const snap = await admin_1.db.doc(`tournaments/${tid}`).get();
    if (!snap.exists)
        throw new https_1.HttpsError('not-found', 'Giải không tồn tại');
    const isAdminRole = req.auth.token['globalRole'] === 'admin';
    if (!isAdminRole && snap.data()?.['ownerUid'] !== req.auth.uid)
        throw new https_1.HttpsError('permission-denied', 'Bạn không có quyền với giải này');
    return req.auth.uid;
}
// Organizer hoặc admin mới được tạo/quản lý giải. Trả uid caller.
function assertOrganizer(req) {
    if (!req.auth)
        throw new https_1.HttpsError('unauthenticated', 'Cần đăng nhập');
    const role = req.auth.token['globalRole'];
    if (role !== 'organizer' && role !== 'admin')
        throw new https_1.HttpsError('permission-denied', 'Cần quyền Tổ chức để quản lý giải');
    return req.auth.uid;
}
function isAdmin(req) {
    return req.auth?.token['globalRole'] === 'admin';
}
//# sourceMappingURL=role-guard.js.map