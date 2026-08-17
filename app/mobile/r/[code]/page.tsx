import { redirect } from "next/navigation";
import {
  buildReferralInviteSignupPath,
  normalizeReferralInviteCode,
} from "@/lib/referral/referralInviteCode";

type Props = { params: Promise<{ code: string }> };

/** 招待リンク入口 → サインアップへコード付きリダイレクト */
export default async function MobileReferralLandingPage({ params }: Props) {
  const { code: raw } = await params;
  const code = normalizeReferralInviteCode(decodeURIComponent(raw ?? ""));
  if (!code) redirect("/mobile/signup");
  redirect(buildReferralInviteSignupPath(code, "mobile"));
}
