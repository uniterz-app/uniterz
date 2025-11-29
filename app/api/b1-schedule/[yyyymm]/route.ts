import axios from "axios";
import * as cheerio from "cheerio";
import { TEAM_IDS } from "@/lib/team-ids";
import { NextResponse } from "next/server";

// HTML取得
async function fetchHtml(url: string) {
  const res = await axios.get(url, {
    headers: { "User-Agent": "Mozilla/5.0" },
  });
  return res.data;
}

// 日付一覧を取る
function extractDays($: cheerio.CheerioAPI): string[] {
  const days: string[] = [];
  $(".js-schedule-date-slider-item a.js_click_data").each((_, el) => {
    const day = $(el).attr("data-day");
    if (day) days.push(day.padStart(2, "0"));
  });
  return days;
}

// 短縮名 → フルネーム（TEAM_IDSキー）
function normalizeTeamName(short: string): string {
  const full = Object.keys(TEAM_IDS).find((f) => f.includes(short));
  return full ?? short;
}

function toIso(year: string, month: string, day: string, time: string) {
  const [HH, mm] = time.split(":");
  return `${year}-${month}-${day}T${HH}:${mm}:00+09:00`;
}

// 1日分を取る
async function fetchGamesForDate(year: string, month: string, day: string) {
  const url = `https://www.bleague.jp/schedule/?year=${year}&month=${month}&day=${day}`;
  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  const list: any[] = [];

  $("#schedule-b1 li.list-item").each((_, li) => {
    const $li = $(li);

    const roundLabel = $li.find(".info-arena span").eq(0).text().trim();
    const arenaRaw = $li.find(".info-arena span").eq(1).text().trim();
    const time = $li.find(".info-arena span").eq(2).text().trim();

    const venue = arenaRaw.includes("|")
      ? arenaRaw.split("|")[1].trim()
      : arenaRaw;

    const homeShort = $li.find(".team.home .team-name").text().trim();
    const awayShort = $li.find(".team.away .team-name").text().trim();

    const homeFull = normalizeTeamName(homeShort);
    const awayFull = normalizeTeamName(awayShort);

    const homeId = TEAM_IDS[homeFull] ?? null;
    const awayId = TEAM_IDS[awayFull] ?? null;

    list.push({
      roundLabel,
      venue,
      time,
      homeFull,
      awayFull,
      homeId,
      awayId,
    });
  });

  return list;
}

export async function GET(
  req: Request,
  { params }: { params: { yyyymm: string } }
) {
  const { yyyymm } = params;
  const year = yyyymm.slice(0, 4);
  const month = yyyymm.slice(4, 6);

  // 月ページ
  const monthUrl = `https://www.bleague.jp/schedule/?year=${year}&month=${month}`;
  const html = await fetchHtml(monthUrl);
  const $ = cheerio.load(html);
  const days = extractDays($);

  const result: any[] = [];

  for (const day of days) {
    const games = await fetchGamesForDate(year, month, day);

    games.forEach((g, idx) => {
      result.push({
        id: `b1-${year}${month}${day}-${String(idx + 1).padStart(3, "0")}`,
        league: "b1",
        season: "2025-26",
        roundLabel: g.roundLabel,
        startAtJstIso: toIso(year, month, day, g.time),
        venue: g.venue,
        home: {
          name: g.homeFull,
          teamId: g.homeId,
        },
        away: {
          name: g.awayFull,
          teamId: g.awayId,
        },
        status: "scheduled",
      });
    });
  }

  return NextResponse.json(result);
}
