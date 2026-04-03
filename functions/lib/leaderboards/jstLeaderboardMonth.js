"use strict";
/** JST 基準の月キー・日付範囲（UTC サーバーでもリーダーボード月がずれないようにする） */
Object.defineProperty(exports, "__esModule", { value: true });
exports.getLeaderboardLatestMonthKey = getLeaderboardLatestMonthKey;
exports.getJstMonthDateKeyRange = getJstMonthDateKeyRange;
exports.jstMonthBoundaryDates = jstMonthBoundaryDates;
const TIMEZONE_JST = "Asia/Tokyo";
function pad2(n) {
    return String(n).padStart(2, "0");
}
function getZonedYMD(date, timeZone) {
    const parts = new Intl.DateTimeFormat("en-US", {
        timeZone,
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
    }).formatToParts(date);
    const get = (type) => { var _a, _b; return Number((_b = (_a = parts.find((p) => p.type === type)) === null || _a === void 0 ? void 0 : _a.value) !== null && _b !== void 0 ? _b : NaN); };
    return {
        year: get("year"),
        month: get("month"),
        day: get("day"),
    };
}
/** JST の「今日」の直前の暦月 YYYY-MM */
function getLeaderboardLatestMonthKey(now = new Date()) {
    const { year, month } = getZonedYMD(now, TIMEZONE_JST);
    if (month === 1)
        return `${year - 1}-12`;
    return `${year}-${pad2(month - 1)}`;
}
function getJstMonthDateKeyRange(monthKey) {
    const m = /^(\d{4})-(\d{2})$/.exec(monthKey);
    if (!m)
        throw new Error(`invalid monthKey: ${monthKey}`);
    const y = Number(m[1]);
    const mo = Number(m[2]);
    if (mo < 1 || mo > 12)
        throw new Error(`invalid monthKey: ${monthKey}`);
    const startKey = `${monthKey}-01`;
    const lastDay = new Date(y, mo, 0).getDate();
    return { startKey, endKey: `${monthKey}-${pad2(lastDay)}` };
}
function jstMonthBoundaryDates(monthKey) {
    const { startKey, endKey } = getJstMonthDateKeyRange(monthKey);
    return {
        start: new Date(`${startKey}T00:00:00+09:00`),
        end: new Date(`${endKey}T23:59:59.999+09:00`),
    };
}
//# sourceMappingURL=jstLeaderboardMonth.js.map