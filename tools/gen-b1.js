// tools/gen-b1.js
import axios from "axios";
import * as cheerio from "cheerio";
import { TEAM_IDS } from "../lib/team-ids.js";
import fs from "fs";

async function fetchHtml(url) {
  const res = await axios.get(url, {
    headers: {
      "User-Agent": "Mozilla/5.0",
    },
  });
  return res.data;
}

// 日付一覧（swiper → data-day）
function extractDays($) {
  const days = [];
  $(".js-schedule-date-slider-item a.js_click_data").each((_, el) => {
    const day = $(el).attr("data-day");
    if (day) days.push(day.padStart(2, "0"));
  });
  return days;
}

function normalizeTeamName(short) {
  // alt の短縮名から TEAM_IDS のフルネームを逆引きする
  // 例：short = "仙台" → TEAM_IDS キーに "仙台89ERS" がある
  const hits = Object.keys(TEAM_IDS).filter((full) =>
    full.includes(short)
  );
  return hits.length > 0 ? hits[0] : short;
}

function toIso(year, month, day, time) {
  const [HH, mm] = time.split(":");
  return `${year}-${month}-${day}T${HH}:${mm}:00+09:00`;
}

async function fetchGamesForDate(year, month, day) {
  const url = `https://www.bleague.jp/schedule/?year=${year}&month=${month}&day=${day}`;
  console.log("Fetch:", url);

  const html = await fetchHtml(url);
  const $ = cheerio.load(html);

  const list = [];

  $("#schedule-b1 li.list-item").each((_, li) => {
    const $li = $(li);

    const roundLabel = $li.find(".info-arena span").eq(0).text().trim();
    const arenaRaw = $li.find(".info-arena span").eq(1).text().trim();
    const time = $li.find(".info-arena span").eq(2).text().trim();

    // 会場名: 「県名 | アリーナ名」 → 後半だけ
    const venue = arenaRaw.includes("|")
      ? arenaRaw.split("|")[1].trim()
      : arenaRaw;

    // チーム名（短縮 → フル変換）
    const homeShort = $li.find(".team.home .team-name").text().trim();
    const awayShort = $li.find(".team.away .team-name").text().trim();

    const homeFull = normalizeTeamName(homeShort);
    const awayFull = normalizeTeamName(awayShort);

    const homeId = TEAM_IDS[homeFull] || null;
    const awayId = TEAM_IDS[awayFull] || null;

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

async function main() {
  const arg = process.argv[2];
  if (!arg || arg.length !== 6) {
    console.error("Usage: node tools/gen-b1.js 202512");
    process.exit(1);
  }

  const year = arg.slice(0, 4);
  const month = arg.slice(4, 6);

  // 月ページから日付一覧取得
  const monthUrl = `https://www.bleague.jp/schedule/?year=${year}&month=${month}`;
  console.log("Fetch:", monthUrl);

  const html = await fetchHtml(monthUrl);
  const $ = cheerio.load(html);
  const days = extractDays($);

  console.log("Days:", days);

  const result = [];

  for (const day of days) {
    const games = await fetchGamesForDate(year, month, day);

    games.forEach((g, idx) => {
      const id = `b1-${year}${month}${day}-${String(idx + 1).padStart(3, "0")}`;

      result.push({
        id,
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

  const savePath = `./tools/b1-${year}${month}.json`;
  fs.writeFileSync(savePath, JSON.stringify(result, null, 2), "utf8");

  console.log("Total games:", result.length);
  console.log("Saved:", savePath);
}

main();
