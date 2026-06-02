"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.assertAdmin = assertAdmin;
const https_1 = require("firebase-functions/v2/https");
// Chặn nếu caller không phải admin (custom claim globalRole=admin). Trả uid admin.
function assertAdmin(req) {
    if (!req.auth)
        throw new https_1.HttpsError('unauthenticated', 'Cần đăng nhập');
    if (req.auth.token['globalRole'] !== 'admin')
        throw new https_1.HttpsError('permission-denied', 'Chỉ admin được phép');
    return req.auth.uid;
}
//# sourceMappingURL=admin-guard.js.map