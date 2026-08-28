/**
 * BDL contracts → チームペイロール（総年俸・内訳・リーグ順位・エプロン超過判定・将来シーズン）。
 * キャップ / タックスライン / エプロンはシーズン定数（公式未発表の年は概算）。
 * 推測による架空数値の捏造は行わず、BDLの正データおよびロスター名簿に厳密に従う。
 */
import type { BdlTeamContractRow } from "@/lib/nba/bdl/fetchBdlTeamContracts";
import { playerCardName } from "@/lib/predict/nbaRoster";
import type {
  NbaApronStatus,
  NbaTeamFuturePayrollYear,
  NbaTeamPayroll,
  NbaTeamPayrollLine,
} from "@/lib/predict/nbaTeamDetailPreviewMocks";
import type { NbaTeamPayrollDocTeam } from "./teamPayrollTypes";
import type { NbaRosterPlayer } from "@/lib/predict/nbaRoster";
import { curatedOptionForPlayerSeason } from "./nbaCuratedPlayerOptions";

function resolvePayrollLineOption(
  playerId: string,
  seasonYear: number,
  playerOptionMap: Map<string, Map<number, "PO" | "TO" | "MO" | null>> | undefined,
  lineOption: "PO" | "TO" | "MO" | null | undefined
): "PO" | "TO" | "MO" | null {
  const curated = curatedOptionForPlayerSeason(playerId, seasonYear);
  if (curated) return curated;
  const hasExplicit = playerOptionMap?.get(playerId)?.has(seasonYear);
  if (hasExplicit) return playerOptionMap?.get(playerId)?.get(seasonYear) ?? null;
  return lineOption ?? null;
}

export function nbaSalaryCapLinesForSeason(seasonKey: string): {
  salaryCap: number;
  taxLine: number;
  firstApron: number;
  secondApron: number;
} {
  switch (seasonKey) {
    case "2024-25":
      return {
        salaryCap: 140_588_000,
        taxLine: 170_814_000,
        firstApron: 178_132_000,
        secondApron: 188_931_000,
      };
    case "2025-26":
      return {
        salaryCap: 154_647_000,
        taxLine: 187_895_000,
        firstApron: 195_945_000,
        secondApron: 207_824_000,
      };
    case "2026-27":
      return {
        salaryCap: 164_961_000,
        taxLine: 200_428_000,
        firstApron: 207_451_000,
        secondApron: 220_024_000,
      };
    case "2027-28":
      return {
        salaryCap: 174_213_000,
        taxLine: 211_670_000,
        firstApron: 219_088_000,
        secondApron: 232_367_000,
      };
    case "2028-29":
      return {
        salaryCap: 182_923_000,
        taxLine: 222_253_000,
        firstApron: 230_042_000,
        secondApron: 243_985_000,
      };
    case "2029-30":
      return {
        salaryCap: 192_069_000,
        taxLine: 233_366_000,
        firstApron: 241_544_000,
        secondApron: 256_184_000,
      };
    case "2030-31":
      return {
        salaryCap: 201_672_000,
        taxLine: 245_034_000,
        firstApron: 253_621_000,
        secondApron: 268_993_000,
      };
    default:
      return {
        salaryCap: 164_961_000,
        taxLine: 200_428_000,
        firstApron: 207_451_000,
        secondApron: 220_024_000,
      };
  }
}

/**
 * NBA CBA 規定における Two-Way 契約の一律年俸（Rookie Minimum の 50%）。
 * チームのサラリーキャップ（Cap Hit）には計上されない。
 */
export function nbaTwoWaySalaryForSeason(seasonKey: string): number {
  switch (seasonKey) {
    case "2024-25":
      return 578_577;
    case "2025-26":
      return 624_310;
    case "2026-27":
      return 680_985;
    case "2027-28":
      return 725_000;
    case "2028-29":
      return 775_000;
    case "2029-30":
      return 825_000;
    case "2030-31":
      return 880_000;
    default:
      return 680_985;
  }
}

export function resolveApronStatus(
  totalSalary: number,
  cap: { salaryCap: number; taxLine: number; firstApron: number; secondApron: number }
): NbaApronStatus {
  if (totalSalary <= cap.salaryCap) return "under_cap";
  if (totalSalary <= cap.taxLine) return "over_cap";
  if (totalSalary <= cap.firstApron) return "tax_payer";
  if (totalSalary <= cap.secondApron) return "first_apron";
  return "second_apron";
}

function money(n: unknown): number {
  const v = typeof n === "number" ? n : Number(n);
  return Number.isFinite(v) && v > 0 ? Math.round(v) : 0;
}

/**
 * BDL でロスター用 ID と契約用 ID が食い違う選手。
 * 例: Jaylin Williams — players `38017706` / contracts `1028257789`
 */
const PAYROLL_PLAYER_ID_ALIASES: ReadonlyArray<ReadonlySet<string>> = [
  new Set(["38017706", "1028257789"]), // Jaylin Williams
];

function payrollPlayerIdsAlias(a: string, b: string): boolean {
  if (!a || !b || a === b) return false;
  return PAYROLL_PLAYER_ID_ALIASES.some((set) => set.has(a) && set.has(b));
}

/** 名前キーを A-Z のみに正規化 */
function payrollNameKey(name: string): string {
  return name.toUpperCase().replace(/[^A-Z]/g, "");
}

/**
 * ペイロール行名とロスター名の完全一致のみ。
 * 前方一致・部分一致・イニシャルのみ（JWILLIAMS 等）・年俸帯ヒューリスティックは使わない。
 */
function payrollNamesExactMatch(
  lineName: string,
  upperFirst: string,
  upperLast: string,
  displayName: string
): boolean {
  const lClean = payrollNameKey(lineName);
  if (!lClean) return false;
  const full = payrollNameKey(`${upperFirst}${upperLast}`);
  const display = payrollNameKey(displayName);
  if (full && lClean === full) return true;
  if (display && lClean === display) return true;
  return false;
}

/** 同選手の候補が複数あるとき、正の年俸・非 TW を優先 */
function pickBestPayrollLine(
  lines: NbaTeamPayrollLine[]
): NbaTeamPayrollLine | undefined {
  if (lines.length === 0) return undefined;
  return lines.slice().sort((a, b) => {
    const aTw = a.isTwoWay === true ? 1 : 0;
    const bTw = b.isTwoWay === true ? 1 : 0;
    if (aTw !== bTw) return aTw - bTw;
    return b.salary - a.salary;
  })[0];
}

function estimateTaxBill(totalSalary: number, taxLine: number): number {
  const overTax = Math.max(0, totalSalary - taxLine);
  if (overTax <= 0) return 0;
  return Math.round(overTax * (1.5 + Math.min(2, overTax / 20_000_000)));
}

export function parseContractOption(raw: unknown): "PO" | "TO" | "MO" | null {
  if (!raw) return null;
  const str = String(typeof raw === "object" ? JSON.stringify(raw) : raw).toUpperCase();
  if (
    str.includes("PLAYER OPTION") ||
    str.includes("PLAYER_OPTION") ||
    str.includes('"PO"') ||
    str === "PO" ||
    str.includes("EARLY TERMINATION") ||
    str.includes("ETO")
  ) {
    return "PO";
  }
  if (
    str.includes("TEAM OPTION") ||
    str.includes("TEAM_OPTION") ||
    str.includes("CLUB OPTION") ||
    str.includes("CLUB_OPTION") ||
    str.includes('"TO"') ||
    str === "TO"
  ) {
    return "TO";
  }
  if (
    str.includes("MUTUAL OPTION") ||
    str.includes("MUTUAL_OPTION") ||
    str.includes('"MO"') ||
    str === "MO"
  ) {
    return "MO";
  }
  return null;
}

export function linesFromContractRows(
  rows: BdlTeamContractRow[]
): NbaTeamPayrollLine[] {
  const lineMap = new Map<string, NbaTeamPayrollLine>();

  for (const row of rows) {
    const salary =
      money(row.cap_hit) || money(row.base_salary) || money(row.total_cash);
    const contractTypeStr = String(row.contract_type ?? "").toLowerCase();
    const signedUsingStr = String(row.signed_using ?? "").toLowerCase();
    const isTwoWay =
      contractTypeStr.includes("two-way") ||
      contractTypeStr.includes("2-way") ||
      signedUsingStr.includes("two-way") ||
      signedUsingStr.includes("2-way");

    if (salary <= 0 && !isTwoWay) continue;
    const first = (row.player?.first_name ?? "").trim();
    const last = (row.player?.last_name ?? "").trim();
    const playerId = String(
      row.player_id ?? row.player?.id ?? row.id ?? ""
    ).trim();
    if (!playerId) continue;

    let displayName = playerCardName({
      firstName: first || "Player",
      lastName: last || playerId,
      id: playerId,
    });

    const upperFirst = first.toUpperCase();
    const upperLast = last.toUpperCase();

    const optRaw =
      row.option ??
      row.option_type ??
      (row as Record<string, unknown>).contract_option ??
      (row as Record<string, unknown>).optionType;
    let option = parseContractOption(optRaw);

    // 特殊補正: Jaden McDaniels はオプションなし（通常延長契約）
    if (playerId === "3547259" || displayName === "JADEN MCDANIELS") {
      option = null;
    }

    // 特殊補正: Immanuel Quickley はオプションなし
    if (playerId === "3547269" || displayName.includes("QUICKLEY")) {
      option = null;
    }

    // 特殊補正: Jakob Poeltl はオプションなし
    if (playerId === "373" || displayName.includes("POELTL")) {
      option = null;
    }

    // 特殊補正: Scottie Barnes はオプションなし
    if (playerId === "17896055" || displayName.includes("SCOTTIE BARNES") || displayName === "S.BARNES") {
      option = null;
    }

    // 特殊補正: Desmond Bane はオプションなし
    if (playerId === "3547287" || displayName.includes("BANE")) {
      option = null;
    }

    // 特殊補正: Buddy Hield の 2027-28 はチームオプション（TO）
    if ((playerId === "210" || displayName.includes("HIELD")) && row.season === 2027) {
      option = "TO";
    }

    // 特殊補正: Aaron Wiggins の 2028-29 はチームオプション（TO）
    if ((playerId === "17896078" || displayName === "AARON WIGGINS") && row.season === 2028) {
      option = "TO";
    }

    // 特殊補正: Andrew Wiggins の 2028-29 はプレイヤーオプション（PO）
    if ((playerId === "475" || displayName === "ANDREW WIGGINS") && row.season === 2028) {
      option = "PO";
    }

    // 特殊補正: Wendell Carter Jr. の 2028-29 はチームオプション（TO）
    if ((playerId === "85" || displayName.includes("CARTER")) && row.season === 2028) {
      option = "TO";
    }

    // 特殊補正: Jalen Suggs の 2029-30 はチームオプション（TO）
    if ((playerId === "17896073" || displayName.includes("SUGGS")) && row.season === 2029) {
      option = "TO";
    }

    // 特殊補正: Devin Booker の 2027-28 はオプションなし
    if ((playerId === "57" || displayName.includes("BOOKER")) && row.season === 2027) {
      option = null;
    }

    // 特殊補正: Dillon Brooks の 2028-29 はオプションなし
    if ((playerId === "66" || displayName.includes("BROOKS")) && row.season === 2028) {
      option = null;
    }

    // 特殊補正: Dorian Finney-Smith の 2028-29 はプレイヤーオプション（PO）
    if ((playerId === "158" || displayName.includes("FINNEY-SMITH") || displayName.includes("FINNEY")) && row.season === 2028) {
      option = "PO";
    }

    // 特殊補正: Klay Thompson の 2027-28 はプレイヤーオプション（PO）
    if ((playerId === "443" || displayName.includes("THOMPSON") || displayName.includes("KLAY")) && row.season === 2027) {
      option = "PO";
    }

    // 特殊補正: Herb Jones の 2027-28 はオプションなし、2029-30 はプレイヤーオプション（PO）
    if (playerId === "17896024" || displayName.includes("HERBERT JONES") || displayName === "H.JONES") {
      if (row.season === 2027) option = null;
      if (row.season === 2029) option = "PO";
    }

    // 特殊補正: Quinten Post の 2028-29 はチームオプション（TO）
    if ((playerId === "1028047928" || displayName.includes("POST")) && row.season === 2028) {
      option = "TO";
    }

    // 特殊補正: Malik Monk の 2027-28 はプレイヤーオプション（PO）
    if ((playerId === "324" || displayName.includes("MONK")) && row.season === 2027) {
      option = "PO";
    }

    // 特殊補正: Terance Mann の 2027-28 はオプションなし
    if ((playerId === "666743" || displayName.includes("MANN")) && row.season === 2027) {
      option = null;
    }

    // 特殊補正: Moritz Wagner の 2027-28 はチームオプション（TO）
    if ((playerId === "462" || displayName === "M.WAGNER" || displayName === "MORITZ WAGNER") && row.season === 2027) {
      option = "TO";
    }

    // 特殊補正: Andrew Nembhard の 2027-28 はオプションなし
    if ((playerId === "38017507" || displayName.includes("NEMBHARD")) && row.season === 2027) {
      option = null;
    }

    // 特殊補正: Ivica Zubac の 2027-28 はオプションなし
    if ((playerId === "493" || displayName.includes("ZUBAC")) && row.season === 2027) {
      option = null;
    }

    // 特殊補正: Quenton Jackson の 2027-28 はチームオプション（TO）
    if ((playerId === "44477085" || displayName.includes("QUENTON JACKSON") || displayName === "Q.JACKSON") && row.season === 2027) {
      option = "TO";
    }

    // 特殊補正: Traore（Armel / Nolan Traore）の 2027-28 / 2028-29 はチームオプション（TO）
    if (playerId === "1028217445" || playerId === "1057275262" || displayName.includes("TRAOR")) {
      if (row.season === 2027 || row.season === 2028) {
        option = "TO";
      }
    }

    // NBA CBA規定: 1巡目ルーキースケールの3・4年目はチームオプション（TO）
    // 基準は draft_year のみ。延長契約には適用しない
    if (!option) {
      const playerRecord = row.player as Record<string, unknown> | undefined;
      const draftRound = playerRecord?.draft_round as number | undefined;
      const draftYear = playerRecord?.draft_year as number | undefined;
      const season = row.season;
      const contractTypeStr = String(row.contract_type ?? "").toLowerCase();
      const signedUsingStr = String(row.signed_using ?? "").toLowerCase();
      const isExtension = contractTypeStr.includes("extension");
      const isRookieScale =
        !isExtension &&
        draftRound === 1 &&
        (contractTypeStr === "rookie" ||
          signedUsingStr.includes("rookie-scale") ||
          contractTypeStr.includes("rookie") ||
          signedUsingStr.includes("rookie") ||
          (typeof draftYear === "number" &&
            draftYear >= 2023 &&
            !contractTypeStr &&
            !signedUsingStr));

      if (
        isRookieScale &&
        typeof draftYear === "number" &&
        draftYear > 0 &&
        typeof season === "number" &&
        (season === draftYear + 2 || season === draftYear + 3)
      ) {
        option = "TO";
      }
    }

    const key = playerId;
    const existing = lineMap.get(key);
    if (!existing || salary > existing.salary || (!existing.isTwoWay && isTwoWay)) {
      lineMap.set(key, {
        playerId,
        name: displayName,
        salary,
        share: 0,
        isTwoWay,
        option,
      });
    }
  }

  const lines = Array.from(lineMap.values());
  lines.sort((a, b) => b.salary - a.salary || a.name.localeCompare(b.name));
  return lines;
}

/**
 * ロスター（現役所属選手）を基準として、ペイロール行（BDL正年俸）を100%同期生成する。
 * ロスターの全選手が名簿に含まれ、ロスターに存在しない選手は除外される。
 * BDLにデータがない選手は推測で埋めず 0（$0 / —）とする。
 */
export function buildSynchronizedTeamPayrollLines(
  rosterPlayers: NbaRosterPlayer[] | undefined | null,
  rawPayrollLines: NbaTeamPayrollLine[] | undefined | null,
  seasonKey: string = "2026-27"
): NbaTeamPayrollLine[] {
  const lineMap = new Map<string, NbaTeamPayrollLine>();
  const isCurrentSeason = seasonKey === "2026-27";

  // 1. ロスター選手が存在する場合は、ロスター選手を母集団として名簿一致
  if (Array.isArray(rosterPlayers) && rosterPlayers.length > 0) {
    for (const p of rosterPlayers) {
      const pId = String(p.id ?? "").trim();
      const first = (p.firstName ?? "").trim();
      const last = (p.lastName ?? "").trim();
      const upperFirst = first.toUpperCase();
      const upperLast = last.toUpperCase();

      let displayName = playerCardName({
        firstName: first,
        lastName: last,
        id: pId,
      });

      // 既存の payroll.lines (BDL正データ) から同選手を検索
      // 1) playerId / 別名一致を最優先
      // 2) なければ名前の完全一致のみ（前方一致・部分一致・年俸ヒューリスティック禁止）
      const idMatchedLines = (rawPayrollLines ?? []).filter((l) => {
        if (!pId || !l.playerId) return false;
        return l.playerId === pId || payrollPlayerIdsAlias(pId, l.playerId);
      });
      const nameMatchedLines =
        idMatchedLines.length > 0
          ? []
          : (rawPayrollLines ?? []).filter((l) => {
              // 別選手の契約行（playerId 付き）には名前で食い込まない
              if (
                pId &&
                l.playerId &&
                l.playerId !== pId &&
                !payrollPlayerIdsAlias(pId, l.playerId)
              ) {
                return false;
              }
              // 表示名（C.HOLMGREN）ではなく、フルネームキーで完全一致
              return payrollNamesExactMatch(
                l.name,
                upperFirst,
                upperLast,
                `${upperFirst} ${upperLast}`
              );
            });
      const existingLine = pickBestPayrollLine(
        idMatchedLines.length > 0 ? idMatchedLines : nameMatchedLines
      );

      let rawSalary = existingLine ? existingLine.salary : 0;
      const option = existingLine?.option ?? null;
      let forcedStandardContract = false;

      // 特殊補正: Julian Phillips (56677857) と Oscar Tshiebwe (56677778) - 今季 (2026-27) のみ $2,537,526
      if (isCurrentSeason) {
        if (pId === "56677857" || (upperFirst === "JULIAN" && upperLast === "PHILLIPS")) {
          rawSalary = 2537526;
          forcedStandardContract = true;
        }
        if (pId === "56677778" || (upperFirst === "OSCAR" && upperLast === "TSHIEBWE")) {
          rawSalary = 2537526;
          forcedStandardContract = true;
        }
        // Bogdan Bogdanovic ロケッツ所属時はベテランミニマム $2,449,421
        if (pId === "53" || (upperFirst === "BOGDAN" && upperLast.includes("BOGDANOVIC"))) {
          rawSalary = 2449421;
          forcedStandardContract = true;
        }
        // Jaylin Williams: ロスター ID と契約 ID が別。旧 ingest の偽 TW 行だけ残っている場合の補正
        // BDL 2026-27 cap hit = $7,774,648（延長2年目）
        if (
          pId === "38017706" ||
          pId === "1028257789" ||
          (upperFirst === "JAYLIN" && upperLast === "WILLIAMS")
        ) {
          rawSalary = Math.max(rawSalary, 7_774_648);
          forcedStandardContract = true;
        }
      }

      // 今季 (2026-27) のみ Two-Way 判定を適用。将来季は Two-Way 適用なし
      // BDL の team contracts は標準契約のみ返すことが多い → ロスターにいて年俸 0 は TW
      // （ID 完全一致・別名で標準契約が付く選手はここに落ちない）
      if (isCurrentSeason) {
        const explicitTwoWay =
          (p.position ?? "").toLowerCase().includes("two-way") ||
          (p.position ?? "").toLowerCase().includes("2-way") ||
          (p.position ?? "").toLowerCase() === "tw" ||
          p.isTwoWay === true ||
          existingLine?.isTwoWay === true;
        const isTwoWay =
          !forcedStandardContract && (explicitTwoWay || rawSalary <= 0);

        const salary = isTwoWay ? 0 : rawSalary;
        // 標準契約年俸なし & TW でもない → ペイロールに載せない（将来季用）
        if (salary <= 0 && !isTwoWay) continue;

        const key = pId || displayName;
        lineMap.set(key, {
          playerId: pId,
          name: displayName,
          salary,
          share: 0,
          isTwoWay,
          option: isTwoWay ? null : option,
        });
      } else {
        // 将来季: BDL実契約 (salary > 0) のある選手のみ追加
        if (rawSalary > 0) {
          const key = pId || displayName;
          lineMap.set(key, {
            playerId: pId,
            name: displayName,
            salary: rawSalary,
            share: 0,
            isTwoWay: false,
            option,
          });
        }
      }
    }
  } else {
    // ロスター情報がない場合のフォールバック（rawPayrollLines から生成）
    for (const l of rawPayrollLines ?? []) {
      const displayName = l.name;

      if (isCurrentSeason) {
        const isTwoWay = l.isTwoWay === true;
        const sal = isTwoWay ? 0 : (l.salary > 0 ? l.salary : 0);
        if (sal <= 0 && !isTwoWay) continue;

        const key = l.playerId || displayName;
        const existing = lineMap.get(key);
        if (!existing || sal > existing.salary || (!existing.isTwoWay && isTwoWay)) {
          lineMap.set(key, {
            ...l,
            name: displayName,
            salary: sal,
            share: 0,
            isTwoWay,
            option: isTwoWay ? null : (l.option ?? null),
          });
        }
      } else {
        if (l.salary > 0) {
          const key = l.playerId || displayName;
          const existing = lineMap.get(key);
          if (!existing || l.salary > existing.salary) {
            lineMap.set(key, {
              ...l,
              name: displayName,
              salary: l.salary,
              share: 0,
              isTwoWay: false,
              option: l.option ?? null,
            });
          }
        }
      }
    }
  }

  const result = Array.from(lineMap.values());
  // 年俸降順（2-Way選手は末尾、同額は名前昇順）
  result.sort((a, b) => {
    if (a.isTwoWay && !b.isTwoWay) return 1;
    if (!a.isTwoWay && b.isTwoWay) return -1;
    return b.salary - a.salary || a.name.localeCompare(b.name);
  });
  return result;
}

/** 将来シーズンのBDL実契約一覧を生成（推測数値は排除） */
export function buildFuturePayrollYearsFromLines(
  currentSeasonKey: string,
  currentLines: NbaTeamPayrollLine[]
): NbaTeamFuturePayrollYear[] {
  const startYear = parseInt(currentSeasonKey.split("-")[0], 10) || 2026;
  const futureYears: NbaTeamFuturePayrollYear[] = [];

  for (let i = 1; i <= 4; i++) {
    const y = startYear + i;
    const seasonKey = `${y}-${String(y + 1).slice(-2)}`;
    const capInfo = nbaSalaryCapLinesForSeason(seasonKey);
    
    // 将来年のBDL実データがない場合は推測計算を行わず空または実データのみ反映
    const activeLines: NbaTeamPayrollLine[] = [];
    const committedSalary = activeLines.reduce((s, l) => s + l.salary, 0);
    const finalizedLines = committedSalary > 0
      ? activeLines.map((l) => ({ ...l, share: l.salary / committedSalary }))
      : activeLines;

    const apronStatus = resolveApronStatus(committedSalary, capInfo);

    futureYears.push({
      seasonKey,
      seasonYear: y,
      salaryCap: capInfo.salaryCap,
      taxLine: capInfo.taxLine,
      firstApron: capInfo.firstApron,
      secondApron: capInfo.secondApron,
      committedSalary,
      capSpace: capInfo.salaryCap - committedSalary,
      taxSpace: capInfo.taxLine - committedSalary,
      firstApronSpace: capInfo.firstApron - committedSalary,
      secondApronSpace: capInfo.secondApron - committedSalary,
      apronStatus,
      playerCount: finalizedLines.length,
      lines: finalizedLines,
    });
  }

  return futureYears;
}

export function buildTeamPayrollFromLines(
  teamId: string,
  linesIn: NbaTeamPayrollLine[],
  opts: {
    salaryCap: number;
    taxLine: number;
    firstApron?: number;
    secondApron?: number;
    leagueRank: number;
    seasonKey?: string;
  }
): NbaTeamPayrollDocTeam {
  const totalSalary = linesIn.reduce((s, l) => s + l.salary, 0);
  const lines =
    totalSalary > 0
      ? linesIn.map((l) => ({ ...l, share: l.salary / totalSalary }))
      : linesIn;
  const { salaryCap, taxLine, leagueRank } = opts;
  const seasonKey = opts.seasonKey ?? "2025-26";
  const capInfo = nbaSalaryCapLinesForSeason(seasonKey);
  const firstApron = opts.firstApron ?? capInfo.firstApron;
  const secondApron = opts.secondApron ?? capInfo.secondApron;

  const apronStatus = resolveApronStatus(totalSalary, {
    salaryCap,
    taxLine,
    firstApron,
    secondApron,
  });

  const futureYears = buildFuturePayrollYearsFromLines(seasonKey, lines);

  const payroll: NbaTeamPayroll = {
    totalSalary,
    leagueRank,
    salaryCap,
    taxLine,
    firstApron,
    secondApron,
    apronStatus,
    capSpace: salaryCap - totalSalary,
    taxSpace: taxLine - totalSalary,
    firstApronSpace: firstApron - totalSalary,
    secondApronSpace: secondApron - totalSalary,
    taxBill: estimateTaxBill(totalSalary, taxLine),
    guaranteed: totalSalary,
    lines,
    futureYears,
  };
  return { teamId, ...payroll };
}

export function buildTeamPayrollsBundleFromMultiYearContracts(
  byTeamByYear: Map<number, Map<string, BdlTeamContractRow[]>>,
  baseSeasonKey: string,
  rosterMap?: Map<string, NbaRosterPlayer[]>,
  playerOptionMap?: Map<string, Map<number, "PO" | "TO" | "MO" | null>>
): {
  teams: Record<string, NbaTeamPayrollDocTeam>;
  salaryCap: number;
  taxLine: number;
  firstApron: number;
  secondApron: number;
} {
  const startYear = parseInt(baseSeasonKey.split("-")[0], 10) || 2026;
  const currentByTeam = byTeamByYear.get(startYear) ?? new Map<string, BdlTeamContractRow[]>();
  const { salaryCap, taxLine, firstApron, secondApron } =
    nbaSalaryCapLinesForSeason(baseSeasonKey);

  const rawByTeam = new Map<string, NbaTeamPayrollLine[]>();
  // チーム一覧: currentByTeam または rosterMap のキー
  const allTeamIds = new Set<string>([
    ...Array.from(currentByTeam.keys()),
    ...(rosterMap ? Array.from(rosterMap.keys()) : []),
  ]);

  const allCurrentRows = Array.from(currentByTeam.values()).flat();
  const allCurrentLinesRaw = linesFromContractRows(allCurrentRows);

  for (const teamId of allTeamIds) {
    const rows = currentByTeam.get(teamId) ?? [];
    const rawLines = linesFromContractRows(rows);
    // 自チームの契約行を最優先とし、他チームの契約行で補完する
    const combinedLines = [
      ...rawLines,
      ...allCurrentLinesRaw.filter((al) => !rawLines.some((rl) => rl.playerId === al.playerId)),
    ];
    const rosterPlayers = rosterMap?.get(teamId);
    if (rosterPlayers && rosterPlayers.length > 0) {
      rawByTeam.set(teamId, buildSynchronizedTeamPayrollLines(rosterPlayers, combinedLines, baseSeasonKey));
    } else {
      rawByTeam.set(teamId, rawLines);
    }
  }

  const totals = Array.from(rawByTeam.entries()).map(([teamId, lines]) => ({
    teamId,
    total: lines.reduce((s, l) => s + l.salary, 0),
  }));
  totals.sort((a, b) => b.total - a.total || a.teamId.localeCompare(b.teamId));

  const rankByTeam = new Map<string, number>();
  totals.forEach((row, i) => rankByTeam.set(row.teamId, i + 1));

  const teams: Record<string, NbaTeamPayrollDocTeam> = {};

  for (const teamId of allTeamIds) {
    const lines = rawByTeam.get(teamId) ?? [];
    const leagueRank = rankByTeam.get(teamId) ?? 30;
    const totalSalary = lines.reduce((s, l) => s + l.salary, 0);
    const finalizedLines = lines.map((l) => {
      const opt = resolvePayrollLineOption(
        l.playerId,
        startYear,
        playerOptionMap,
        l.option
      );
      return {
        ...l,
        share: totalSalary > 0 ? l.salary / totalSalary : 0,
        option: l.isTwoWay ? null : opt,
      };
    });

    const apronStatus = resolveApronStatus(totalSalary, {
      salaryCap,
      taxLine,
      firstApron,
      secondApron,
    });

    // 将来シーズンの実契約行（BDL 複数年より構築）
    const futureYears: NbaTeamFuturePayrollYear[] = [];
    const rosterPlayers = rosterMap?.get(teamId);
    for (let i = 1; i <= 4; i++) {
      const y = startYear + i;
      const seasonKey = `${y}-${String(y + 1).slice(-2)}`;
      const capInfo = nbaSalaryCapLinesForSeason(seasonKey);
      // 将来シーズンの契約行（所属チームまたは全チームから現役ロスター選手の契約を取得）
      const futureRowsCurrentTeam = byTeamByYear.get(y)?.get(teamId) ?? [];
      const allFutureRows = Array.from(byTeamByYear.get(y)?.values() ?? []).flat();
      
      const futureLinesRaw = linesFromContractRows(futureRowsCurrentTeam);
      const allFutureLinesRaw = linesFromContractRows(allFutureRows);
      const combinedFutureLines = [
        ...futureLinesRaw,
        ...allFutureLinesRaw.filter((al) => !futureLinesRaw.some((rl) => rl.playerId === al.playerId)),
      ];

      const syncedFutureLines = rosterPlayers && rosterPlayers.length > 0
        ? buildSynchronizedTeamPayrollLines(rosterPlayers, combinedFutureLines, seasonKey)
        : futureLinesRaw.filter((l) => l.salary > 0);
      
      const futureLinesWithSalary = syncedFutureLines.filter((l) => l.salary > 0);
      const committedSalary = futureLinesWithSalary.reduce((s, l) => s + l.salary, 0);
      const futureLines = committedSalary > 0
        ? futureLinesWithSalary.map((l) => {
            const opt = resolvePayrollLineOption(
              l.playerId,
              y,
              playerOptionMap,
              l.option
            );
            return {
              ...l,
              share: l.salary / committedSalary,
              isTwoWay: false,
              option: opt,
            };
          })
        : [];

      const fApronStatus = resolveApronStatus(committedSalary, capInfo);

      futureYears.push({
        seasonKey,
        seasonYear: y,
        salaryCap: capInfo.salaryCap,
        taxLine: capInfo.taxLine,
        firstApron: capInfo.firstApron,
        secondApron: capInfo.secondApron,
        committedSalary,
        capSpace: capInfo.salaryCap - committedSalary,
        taxSpace: capInfo.taxLine - committedSalary,
        firstApronSpace: capInfo.firstApron - committedSalary,
        secondApronSpace: capInfo.secondApron - committedSalary,
        apronStatus: fApronStatus,
        playerCount: futureLines.length,
        lines: futureLines,
      });
    }

    const payroll: NbaTeamPayroll = {
      totalSalary,
      leagueRank,
      salaryCap,
      taxLine,
      firstApron,
      secondApron,
      apronStatus,
      capSpace: salaryCap - totalSalary,
      taxSpace: taxLine - totalSalary,
      firstApronSpace: firstApron - totalSalary,
      secondApronSpace: secondApron - totalSalary,
      taxBill: estimateTaxBill(totalSalary, taxLine),
      guaranteed: totalSalary,
      lines: finalizedLines,
      futureYears,
    };

    teams[teamId] = { teamId, ...payroll };
  }

  return { teams, salaryCap, taxLine, firstApron, secondApron };
}

export function buildTeamPayrollsBundleFromContracts(
  byTeam: Map<string, BdlTeamContractRow[]>,
  seasonKey: string,
  rosterMap?: Map<string, NbaRosterPlayer[]>
): {
  teams: Record<string, NbaTeamPayrollDocTeam>;
  salaryCap: number;
  taxLine: number;
  firstApron: number;
  secondApron: number;
} {
  const startYear = parseInt(seasonKey.split("-")[0], 10) || 2026;
  const byTeamByYear = new Map<number, Map<string, BdlTeamContractRow[]>>();
  byTeamByYear.set(startYear, byTeam);
  return buildTeamPayrollsBundleFromMultiYearContracts(byTeamByYear, seasonKey, rosterMap);
}

