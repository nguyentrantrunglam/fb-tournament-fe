"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.health = void 0;
const https_1 = require("firebase-functions/v2/https");
exports.health = (0, https_1.onCall)({ region: 'asia-southeast1' }, () => ({ ok: true, ts: Date.now() }));
//# sourceMappingURL=health.js.map