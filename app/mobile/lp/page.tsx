import { redirect } from "next/navigation";

/** 公式 LP は `/lp`。画面幅でモバイル / デスクトップの配置を切り替える。 */
export default function MobileLPPage() {
  redirect("/lp");
}
