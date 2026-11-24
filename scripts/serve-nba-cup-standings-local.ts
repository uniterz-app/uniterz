/**
 * ローカル確認用: Cup 順位は Firestore、それ以外は本番 API へプロキシ。
 *
 *   npx tsx scripts/serve-nba-cup-standings-local.ts
 *
 * Native `.env.development.local` を http://127.0.0.1:3000 にして Metro 再起動。
 */
import fs from "fs";
import http from "http";
import https from "https";
import path from "path";
import { URL } from "url";

const PORT = Number(process.env.CUP_LOCAL_PORT ?? 3000);
const UPSTREAM = (
  process.env.CUP_LOCAL_UPSTREAM ?? "https://www.uniterz.app"
).replace(/\/$/, "");

function loadEnvLocal(): void {
  const envPath = path.join(process.cwd(), ".env.local");
  if (!fs.existsSync(envPath)) return;
  for (const raw of fs.readFileSync(envPath, "utf8").split(/\r?\n/)) {
    const line = raw.trim();
    if (!line || line.startsWith("#")) continue;
    const i = line.indexOf("=");
    if (i <= 0) continue;
    const key = line.slice(0, i).trim();
    let val = line.slice(i + 1).trim();
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1);
    }
    if (process.env[key] == null) process.env[key] = val;
  }
}

function sendJson(res: http.ServerResponse, status: number, body: unknown) {
  const raw = JSON.stringify(body);
  res.writeHead(status, {
    "content-type": "application/json; charset=utf-8",
    "access-control-allow-origin": "*",
    "cache-control": "no-store",
  });
  res.end(raw);
}

function proxyToUpstream(req: http.IncomingMessage, res: http.ServerResponse) {
  const target = new URL(req.url ?? "/", UPSTREAM);
  const lib = target.protocol === "http:" ? http : https;
  const headers = { ...req.headers, host: target.host };
  delete headers["accept-encoding"];
  let settled = false;

  const fail = (e: unknown) => {
    console.error("[cup-local] proxy", e);
    if (settled || res.headersSent || res.writableEnded) return;
    settled = true;
    sendJson(res, 502, { ok: false, error: "upstream_failed" });
  };

  const upstream = lib.request(
    target,
    { method: req.method, headers },
    (upRes) => {
      if (settled || res.headersSent) return;
      settled = true;
      res.writeHead(upRes.statusCode ?? 502, upRes.headers);
      upRes.pipe(res);
    }
  );
  upstream.on("error", fail);
  req.on("error", fail);
  req.pipe(upstream);
}

async function main() {
  loadEnvLocal();
  const { getAdminDb } = await import("../lib/firebaseAdmin");
  const { loadNbaCupStandings } = await import(
    "../lib/nba/cupStandings/loadNbaCupStandings"
  );
  const db = getAdminDb();

  const server = http.createServer(async (req, res) => {
    const url = new URL(req.url ?? "/", `http://127.0.0.1:${PORT}`);

    if (req.method === "OPTIONS") {
      res.writeHead(204, {
        "access-control-allow-origin": "*",
        "access-control-allow-methods": "GET,POST,OPTIONS",
        "access-control-allow-headers": "*",
      });
      res.end();
      return;
    }

    if (url.pathname === "/api/nba/cup-standings") {
      try {
        const payload = await loadNbaCupStandings(
          db,
          url.searchParams.get("season")
        );
        console.log(
          `[cup-local] cup-standings season=${payload.season} teams=${payload.board.groups.reduce((n, g) => n + g.rows.length, 0)}`
        );
        sendJson(res, 200, payload);
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e);
        console.error("[cup-local]", e);
        sendJson(res, 500, { ok: false, error: msg });
      }
      return;
    }

    proxyToUpstream(req, res);
  });

  server.listen(PORT, "127.0.0.1", () => {
    console.log(`[cup-local] listening http://127.0.0.1:${PORT}`);
    console.log(
      `[cup-local] cup  → Firestore  /api/nba/cup-standings`
    );
    console.log(`[cup-local] else → ${UPSTREAM}`);
  });
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
