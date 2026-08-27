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
    });

    const upperFirst = first.toUpperCase();
    const upperLast = last.toUpperCase();
    if (
      (upperFirst === "SHAI" && upperLast.includes("GILGEOUS-ALEXANDER")) ||
      upperLast === "GILGEOUS-ALEXANDER" ||
      (upperFirst === "SHAI" && upperLast === "ALEXANDER")
    ) {
      displayName = "SGA";
    } else if (upperLast === "WILLIAMS") {
      if (upperFirst === "JALEN") {
        displayName = "JALEN WILLIAMS";
      } else if (upperFirst === "JAYLIN") {
        displayName = "JAYLIN WILLIAMS";
      } else if (upperFirst === "KENRICH") {
        displayName = "KENRICH WILLIAMS";
      } else if (upperFirst === "PATRICK") {
        displayName = "PATRICK WILLIAMS";
      } else if (upperFirst === "GRANT") {
        displayName = "GRANT WILLIAMS";
      } else if (upperFirst === "MARK") {
        displayName = "MARK WILLIAMS";
      } else if (upperFirst === "ZIAIRE") {
        displayName = "ZIAIRE WILLIAMS";
      }
    } else if (upperLast === "BROWN" && upperFirst === "JAYLEN") {
      displayName = "JAYLEN BROWN";
    } else if (upperLast === "JOHNSON" && upperFirst === "JALEN") {
      displayName = "JALEN JOHNSON";
    }

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

    // NBA CBA規定: 1巡目ルーキースケール契約（4年契約）の3年目・4年目はチームオプション（TO）
    // ※ルーキー契約期間中（ドラフト年+0〜3）のみ適用。延長契約（Extension）期間には適用しない
    if (!option) {
      const playerRecord = row.player as Record<string, unknown> | undefined;
      const draftRound = playerRecord?.draft_round as number | undefined;
      const draftYear = playerRecord?.draft_year as number | undefined;
      const season = row.season;
      const contractTypeStr = String(row.contract_type ?? "").toLowerCase();
      const signedUsingStr = String(row.signed_using ?? "").toLowerCase();
      const isExtension = contractTypeStr.includes("extension");
      // 2026年以降のドラフト1巡目ルーキー、または明示的に1巡目ルーキー契約と記載されている場合
      const isRookieScale =
        !isExtension &&
        draftRound === 1 &&
        (contractTypeStr === "rookie" ||
          signedUsingStr.includes("rookie-scale") ||
          (typeof draftYear === "number" && draftYear >= 2025 && !contractTypeStr && !signedUsingStr) ||
          contractTypeStr.includes("rookie") ||
          signedUsingStr.includes("rookie"));

      if (
        isRookieScale &&
        typeof draftYear === "number" &&
        draftYear > 0 &&
        typeof season === "number" &&
        season > 0
      ) {
        // ドラフトから3年目・4年目（例: 2026ドラフトなら2028, 2029。ドラフト4年を超えるシーズンには適用しない）
        if (season === draftYear + 2 || season === draftYear + 3) {
          option = "TO";
        }
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

      let displayName = playerCardName({ firstName: first, lastName: last });
      if (
        (upperFirst === "SHAI" && upperLast.includes("GILGEOUS-ALEXANDER")) ||
        upperLast === "GILGEOUS-ALEXANDER" ||
        (upperFirst === "SHAI" && upperLast === "ALEXANDER")
      ) {
        displayName = "SGA";
      } else if (upperLast === "WILLIAMS") {
        if (upperFirst === "JALEN") displayName = "JALEN WILLIAMS";
        else if (upperFirst === "JAYLIN") displayName = "JAYLIN WILLIAMS";
        else if (upperFirst === "KENRICH") displayName = "KENRICH WILLIAMS";
      }

      // 既存の payroll.lines (BDL正データ) から同選手を検索
      // まず所属チームの契約行を最優先、次に全体から検索
      const existingLine = (rawPayrollLines ?? []).find((l) => {
        if (pId && l.playerId) {
          return l.playerId === pId;
        }
        const lClean = l.name.toUpperCase().replace(/[^A-Z]/g, "");
        const pClean = `${upperFirst}${upperLast}`.replace(/[^A-Z]/g, "");
        if (lClean === pClean) return true;
        
        // Williams 姓の精密判定
        if (upperLast === "WILLIAMS") {
          if (upperFirst === "JALEN") {
            return lClean.includes("JALEN") || (lClean === "JWILLIAMS" && l.salary >= 3_500_000);
          }
          if (upperFirst === "JAYLIN") {
            return lClean.includes("JAYLIN") || (lClean === "JWILLIAMS" && l.salary < 3_500_000);
          }
          if (upperFirst === "KENRICH") {
            return lClean.includes("KENRICH") || lClean.startsWith("KW");
          }
        }

        // Mitchell 姓の精密判定（Davion Mitchell と Donovan Mitchell の混同防止）
        if (upperLast === "MITCHELL") {
          if (upperFirst === "DAVION") {
            return l.playerId === "17553994" || lClean.includes("DAVION");
          }
          if (upperFirst === "DONOVAN") {
            return l.playerId === "322" || lClean.includes("DONOVAN");
          }
        }

        // Wiggins 姓の精密判定（Aaron Wiggins と Andrew Wiggins の混同防止）
        if (upperLast === "WIGGINS") {
          if (upperFirst === "AARON") {
            return l.playerId === "17896078" || lClean.includes("AARON");
          }
          if (upperFirst === "ANDREW") {
            return l.playerId === "475" || lClean.includes("ANDREW");
          }
        }

        // Wagner 姓の精密判定（Moritz Wagner と Franz Wagner の混同防止）
        if (upperLast === "WAGNER") {
          if (upperFirst === "MORITZ" || upperFirst === "MO") {
            return l.playerId === "462" || lClean.includes("MORITZ") || lClean.startsWith("MW");
          }
          if (upperFirst === "FRANZ") {
            return l.playerId === "17896026" || lClean.includes("FRANZ") || lClean.startsWith("FW");
          }
        }

        // Green 姓の精密判定（Jeff Green と Jalen Green の混同防止）
        if (upperLast === "GREEN") {
          if (upperFirst === "JEFF") {
            return lClean === "JGREEN" && l.salary < 5_000_000;
          }
          if (upperFirst === "JALEN") {
            return lClean === "JGREEN" && l.salary >= 30_000_000;
          }
        }

        // Bogdanovic (HOU ミニマム $2.45M)
        if (upperLast.includes("BOGDANOVIC") && upperFirst.startsWith("B")) {
          return lClean.includes("BOGDANOVIC");
        }

        // Traore 姓（BKN Nolan / Armel のマッチング）
        if (upperLast.includes("TRAOR") || lClean.includes("TRAOR")) {
          return lClean.includes("TRAOR");
        }

        if (upperLast && lClean.includes(upperLast) && (lClean.startsWith(upperFirst.charAt(0)) || lClean.includes(upperFirst))) return true;
        return false;
      });

      let rawSalary = existingLine ? existingLine.salary : 0;
      const option = existingLine?.option ?? null;

      // 特殊補正: Julian Phillips (56677857) と Oscar Tshiebwe (56677778) - 今季 (2026-27) のみ $2,537,526
      if (isCurrentSeason) {
        if (pId === "56677857" || (upperFirst === "JULIAN" && upperLast === "PHILLIPS")) {
          rawSalary = 2537526;
        }
        if (pId === "56677778" || (upperFirst === "OSCAR" && upperLast === "TSHIEBWE")) {
          rawSalary = 2537526;
        }
        // Bogdan Bogdanovic ロケッツ所属時はベテランミニマム $2,449,421
        if (pId === "53" || (upperFirst === "BOGDAN" && upperLast.includes("BOGDANOVIC"))) {
          rawSalary = 2449421;
        }
      }

      // 今季 (2026-27) のみ Two-Way 判定を適用。将来季は Two-Way 適用なし
      if (isCurrentSeason) {
        const isTwoWay =
          rawSalary <= 0 ||
          (p.position ?? "").toLowerCase().includes("two-way") ||
          (p.position ?? "").toLowerCase().includes("2-way") ||
          (p.position ?? "").toLowerCase() === "tw" ||
          p.isTwoWay === true ||
          existingLine?.isTwoWay === true;

        const salary = isTwoWay ? 0 : rawSalary;
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
      let displayName = l.name;
      const clean = l.name.toUpperCase().replace(/[^A-Z]/g, "");
      if (clean === "JWILLIAMS" || clean.startsWith("JWILLIAMS") || clean.includes("JALENWILLIAMS") || clean.includes("JAYLINWILLIAMS")) {
        if (l.salary < 3_500_000 || clean.includes("JAYLIN")) {
          displayName = "JAYLIN WILLIAMS";
        } else {
          displayName = "JALEN WILLIAMS";
        }
      }

      if (isCurrentSeason) {
        const isTwoWay = l.isTwoWay === true || l.salary <= 0;
        const sal = isTwoWay ? 0 : (l.salary > 0 ? l.salary : 0);

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
      const hasExplicitOpt = playerOptionMap?.get(l.playerId)?.has(startYear);
      const opt = hasExplicitOpt
        ? (playerOptionMap?.get(l.playerId)?.get(startYear) ?? null)
        : (l.option ?? null);
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
            const hasExplicitOpt = playerOptionMap?.get(l.playerId)?.has(y);
            const opt = hasExplicitOpt
              ? (playerOptionMap?.get(l.playerId)?.get(y) ?? null)
              : (l.option ?? null);
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

