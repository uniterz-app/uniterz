/** `lib/nba/ask/nbaAskClient` を Native の API ベース URL・Firebase トークンで呼ぶ */
import { auth } from "../../../lib/firebase";
import { getUniterzApiBaseUrl } from "../submitPredictionApi";
import {
  fetchNbaAskStatus,
  postNbaAsk,
  type NbaAskReply,
  type NbaAskStatus,
  type NbaAskTurnClient,
} from "../../../../../../lib/nba/ask/nbaAskClient";

export async function loadNbaAskStatusNative(): Promise<NbaAskStatus | null> {
  const user = auth.currentUser;
  const apiBaseUrl = getUniterzApiBaseUrl();
  if (!user || !apiBaseUrl) return null;
  return fetchNbaAskStatus({ apiBaseUrl, token: await user.getIdToken() });
}

export async function askNbaStatsNative(
  turns: NbaAskTurnClient[],
  language: string,
  timeZone: string
): Promise<NbaAskReply> {
  const user = auth.currentUser;
  const apiBaseUrl = getUniterzApiBaseUrl();
  if (!user) return { ok: false, error: "auth" };
  if (!apiBaseUrl) return { ok: false, error: "failed" };
  return postNbaAsk({
    apiBaseUrl,
    token: await user.getIdToken(),
    turns,
    language,
    timeZone,
  });
}
