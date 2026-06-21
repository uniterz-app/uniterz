"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.sendExpoPushToUids = sendExpoPushToUids;
exports.markGamePushNotified = markGamePushNotified;
exports.uniqueAuthorTargetsFromPosts = uniqueAuthorTargetsFromPosts;
const expo_server_sdk_1 = require("expo-server-sdk");
const firestore_1 = require("firebase-admin/firestore");
const pushNotificationCopy_1 = require("./pushNotificationCopy");
const expo = new expo_server_sdk_1.Expo();
async function loadTokensForUids(uids) {
    var _a;
    const firestore = (0, firestore_1.getFirestore)();
    const unique = [...new Set(uids.filter(Boolean))];
    if (unique.length === 0)
        return [];
    const out = [];
    const chunkSize = 10;
    for (let i = 0; i < unique.length; i += chunkSize) {
        const chunk = unique.slice(i, i + chunkSize);
        const snaps = await Promise.all(chunk.map((uid) => firestore.collection(`users/${uid}/pushTokens`).get()));
        for (let j = 0; j < chunk.length; j++) {
            const uid = chunk[j];
            for (const doc of snaps[j].docs) {
                const token = (_a = doc.data()) === null || _a === void 0 ? void 0 : _a.expoPushToken;
                if (typeof token === "string" && expo_server_sdk_1.Expo.isExpoPushToken(token)) {
                    out.push({ uid, tokenId: doc.id, expoPushToken: token });
                }
            }
        }
    }
    return out;
}
async function loadLanguages(uids) {
    var _a;
    const firestore = (0, firestore_1.getFirestore)();
    const unique = [...new Set(uids.filter(Boolean))];
    const map = new Map();
    const chunkSize = 30;
    for (let i = 0; i < unique.length; i += chunkSize) {
        const chunk = unique.slice(i, i + chunkSize);
        const refs = chunk.map((uid) => firestore.doc(`users/${uid}`));
        const snaps = await firestore.getAll(...refs);
        for (const snap of snaps) {
            map.set(snap.id, (0, pushNotificationCopy_1.normalizePushLanguage)((_a = snap.data()) === null || _a === void 0 ? void 0 : _a.language));
        }
    }
    return map;
}
async function deleteInvalidTokens(records) {
    const firestore = (0, firestore_1.getFirestore)();
    const batch = firestore.batch();
    let ops = 0;
    for (const rec of records) {
        batch.delete(firestore.doc(`users/${rec.uid}/pushTokens/${rec.tokenId}`));
        ops++;
        if (ops >= 400) {
            await batch.commit();
            ops = 0;
        }
    }
    if (ops > 0)
        await batch.commit();
}
async function sendExpoPushToUids(input) {
    var _a, _b, _c;
    const uids = input.targets.map((t) => t.uid);
    const [tokens, languages] = await Promise.all([
        loadTokensForUids(uids),
        loadLanguages(uids),
    ]);
    if (tokens.length === 0) {
        return { sent: 0, skipped: input.targets.length };
    }
    const dataByUid = new Map(input.targets.map((t) => [t.uid, t.data]));
    const messages = [];
    for (const rec of tokens) {
        const lang = (_a = languages.get(rec.uid)) !== null && _a !== void 0 ? _a : "ja";
        const copy = (0, pushNotificationCopy_1.buildPushNotificationCopy)(input.type, lang, input.matchup);
        const data = (_b = dataByUid.get(rec.uid)) !== null && _b !== void 0 ? _b : { type: input.type };
        messages.push({
            to: rec.expoPushToken,
            sound: "default",
            title: copy.title,
            subtitle: copy.subtitle,
            body: copy.body,
            data: data,
        });
    }
    const chunks = expo.chunkPushNotifications(messages);
    const invalid = [];
    let sent = 0;
    let offset = 0;
    for (const chunk of chunks) {
        const tickets = await expo.sendPushNotificationsAsync(chunk);
        for (let i = 0; i < tickets.length; i++) {
            const ticket = tickets[i];
            const rec = tokens[offset + i];
            if (!rec)
                continue;
            if (ticket.status === "ok") {
                sent++;
                continue;
            }
            const detail = (_c = ticket.details) === null || _c === void 0 ? void 0 : _c.error;
            if (detail === "DeviceNotRegistered") {
                invalid.push(rec);
            }
        }
        offset += chunk.length;
    }
    if (invalid.length > 0) {
        await deleteInvalidTokens(invalid);
    }
    return { sent, skipped: Math.max(0, input.targets.length - sent) };
}
async function markGamePushNotified(gameId, field) {
    await (0, firestore_1.getFirestore)()
        .doc(`games/${gameId}`)
        .set({ [field]: firestore_1.FieldValue.serverTimestamp() }, { merge: true });
}
function uniqueAuthorTargetsFromPosts(docs, type, gameId) {
    var _a;
    const byUid = new Map();
    for (const doc of docs) {
        const uid = (_a = doc.data()) === null || _a === void 0 ? void 0 : _a.authorUid;
        if (typeof uid !== "string" || !uid)
            continue;
        if (!byUid.has(uid)) {
            byUid.set(uid, {
                uid,
                data: { type, gameId, postId: doc.id },
            });
        }
    }
    return [...byUid.values()];
}
//# sourceMappingURL=sendExpoPush.js.map