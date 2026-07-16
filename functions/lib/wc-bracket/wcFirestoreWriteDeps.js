"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultWcFirestoreWriteDeps = void 0;
const firestore_1 = require("firebase-admin/firestore");
const defaultWcFirestoreWriteDeps = () => ({
    serverTimestamp: () => firestore_1.FieldValue.serverTimestamp(),
});
exports.defaultWcFirestoreWriteDeps = defaultWcFirestoreWriteDeps;
//# sourceMappingURL=wcFirestoreWriteDeps.js.map