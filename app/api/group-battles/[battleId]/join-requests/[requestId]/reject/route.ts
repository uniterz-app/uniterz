import { resolveJoinRequest } from "@/lib/groupBattles/server/resolveJoinRequest";
import { jsonErr, mapAuthError } from "@/lib/groupBattles/server/http";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Ctx = {
  params: Promise<{ battleId: string; requestId: string }>;
};

function mapJoinError(e: unknown) {
  const msg = e instanceof Error ? e.message : String(e);
  if (msg === "forbidden") return jsonErr("forbidden", 403);
  if (
    msg === "request_not_found" ||
    msg === "squad_not_found" ||
    msg === "not_pending" ||
    msg === "squad_full" ||
    msg === "applicant_already_in_squad"
  ) {
    return jsonErr(
      msg,
      msg === "request_not_found" || msg === "squad_not_found" ? 404 : 409
    );
  }
  return mapAuthError(e);
}

export async function POST(req: Request, ctx: Ctx) {
  try {
    const { battleId, requestId } = await ctx.params;
    return await resolveJoinRequest(req, battleId, requestId, "rejected");
  } catch (e) {
    return mapJoinError(e);
  }
}
