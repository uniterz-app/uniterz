"use client";

/**
 * 交換申請フォーム
 */
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useMemo, useState } from "react";
import ProfileCyberPage from "@/app/component/profile/ProfileCyberPage";
import { nameOxanium } from "@/lib/fonts";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { createMeRedemption } from "@/lib/api/fetchMeRedemptions";
import {
  REDEMPTION_CATALOG,
  normalizeRedemptionProductKind,
  redemptionPriceCapShort,
} from "@/lib/redemption/redemptionCatalog";
import { redemptionBatchScheduleCopy } from "@/lib/redemption/redemptionBatchScheduleCopy";
import type { RedemptionProductKind } from "@/lib/redemption/redemptionTypes";

function pathBase() {
  if (typeof window === "undefined") return "/mobile";
  return window.location.pathname.startsWith("/web") ? "/web" : "/mobile";
}

const fieldClass =
  "w-full rounded-[2px] border border-white/15 bg-black/40 px-3 py-2 text-[13px] text-white outline-none focus:border-cyan-300/40";

export default function RedemptionApplyPage() {
  const router = useRouter();
  const search = useSearchParams();
  const { fUser: user } = useFirebaseUser();
  const { language } = useUserLanguage(user?.uid ?? null);
  const isJa = language === "ja";
  const base = pathBase();
  const batch = redemptionBatchScheduleCopy(isJa ? "ja" : "en");

  const initialKind =
    normalizeRedemptionProductKind(search.get("kind")) ?? "tshirt";

  const [productKind, setProductKind] =
    useState<RedemptionProductKind>(initialKind);
  const [productName, setProductName] = useState("");
  const [productUrl, setProductUrl] = useState("");
  const [storeName, setStoreName] = useState("");
  const [size, setSize] = useState("");
  const [color, setColor] = useState("");
  const [notes, setNotes] = useState("");
  const [shippingName, setShippingName] = useState("");
  const [shippingPostalCode, setShippingPostalCode] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingCountry, setShippingCountry] = useState("JP");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selected = useMemo(
    () => REDEMPTION_CATALOG.find((x) => x.kind === productKind),
    [productKind]
  );

  async function submit(asDraft: boolean) {
    setBusy(true);
    setError(null);
    try {
      const req = await createMeRedemption(
        {
          productKind,
          productName,
          productUrl,
          storeName,
          size,
          color,
          notes,
          shippingName,
          shippingPostalCode,
          shippingAddress,
          shippingPhone,
          shippingCountry,
        },
        { asDraft }
      );
      router.push(`${base}/redeem/${req.id}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "error");
    } finally {
      setBusy(false);
    }
  }

  return (
    <ProfileCyberPage
      title="APPLY"
      eyebrow="UNIT EXCHANGE"
      subtitle={
        isJa
          ? "希望商品と配送先を入力。購入は月末まとめ（おおよそ25日前後）です。"
          : "Enter product and shipping details. Purchase is batched near month-end (~25th)."
      }
      contentClassName="max-w-lg space-y-4"
    >
      <Link
        href={`${base}/redeem`}
        className="text-[11px] text-cyan-300/80 hover:underline"
      >
        ← {isJa ? "カタログに戻る" : "Back to catalog"}
      </Link>

      <div className="rounded-[2px] border border-cyan-300/25 bg-cyan-400/5 px-3 py-3 text-[12px] leading-relaxed text-cyan-50/85">
        <p
          className={[
            nameOxanium.className,
            "text-[10px] font-bold uppercase tracking-[0.14em] text-cyan-200/80",
          ].join(" ")}
        >
          {batch.short}
        </p>
        <p className="mt-1.5">{batch.detail}</p>
      </div>

      <label className="block space-y-1">
        <span className="text-[11px] text-white/50">
          {isJa ? "商品区分" : "Product tier"}
        </span>
        <select
          className={fieldClass}
          value={productKind}
          onChange={(e) =>
            setProductKind(
              normalizeRedemptionProductKind(e.target.value) ?? "tshirt"
            )
          }
        >
          {REDEMPTION_CATALOG.map((item) => (
            <option key={item.kind} value={item.kind}>
              {isJa ? item.titleJa : item.titleEn} ({item.unitsRequired} Unit)
            </option>
          ))}
        </select>
        {selected ? (
          <p className="text-[11px] text-white/40">
            {isJa
              ? `必要 ${selected.unitsRequired} Unit · 価格上限 ${redemptionPriceCapShort(selected, "ja")}`
              : `${selected.unitsRequired} Units · Cap ${redemptionPriceCapShort(selected, "en")}`}
          </p>
        ) : null}
      </label>

      {(
        [
          [isJa ? "商品名" : "Product name", productName, setProductName],
          [isJa ? "商品ページ URL" : "Product URL", productUrl, setProductUrl],
          [isJa ? "販売店" : "Store", storeName, setStoreName],
          [isJa ? "サイズ" : "Size", size, setSize],
          [isJa ? "カラー" : "Color", color, setColor],
        ] as const
      ).map(([label, value, set]) => (
        <label key={label} className="block space-y-1">
          <span className="text-[11px] text-white/50">{label}</span>
          <input
            className={fieldClass}
            value={value}
            onChange={(e) => set(e.target.value)}
          />
        </label>
      ))}

      <label className="block space-y-1">
        <span className="text-[11px] text-white/50">
          {isJa ? "補足" : "Notes"}
        </span>
        <textarea
          className={fieldClass}
          rows={3}
          value={notes}
          onChange={(e) => setNotes(e.target.value)}
        />
      </label>

      <h2
        className={[
          nameOxanium.className,
          "pt-2 text-[11px] font-bold uppercase tracking-[0.16em] text-white/55",
        ].join(" ")}
      >
        {isJa ? "配送先" : "Shipping"}
      </h2>

      {(
        [
          [isJa ? "氏名" : "Full name", shippingName, setShippingName],
          [
            isJa ? "郵便番号" : "Postal code",
            shippingPostalCode,
            setShippingPostalCode,
          ],
          [isJa ? "住所" : "Address", shippingAddress, setShippingAddress],
          [isJa ? "電話" : "Phone", shippingPhone, setShippingPhone],
          [isJa ? "国コード" : "Country", shippingCountry, setShippingCountry],
        ] as const
      ).map(([label, value, set]) => (
        <label key={label} className="block space-y-1">
          <span className="text-[11px] text-white/50">{label}</span>
          <input
            className={fieldClass}
            value={value}
            onChange={(e) => set(e.target.value)}
          />
        </label>
      ))}

      {error ? (
        <p className="text-[13px] text-rose-300/80">{error}</p>
      ) : null}

      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="button"
          disabled={busy}
          onClick={() => void submit(false)}
          className={[
            nameOxanium.className,
            "border border-cyan-300/40 bg-cyan-400/15 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-cyan-50 disabled:opacity-50",
          ].join(" ")}
        >
          {isJa ? "申請する" : "Submit"}
        </button>
        <button
          type="button"
          disabled={busy}
          onClick={() => void submit(true)}
          className={[
            nameOxanium.className,
            "border border-white/20 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-white/70 disabled:opacity-50",
          ].join(" ")}
        >
          {isJa ? "下書き保存" : "Save draft"}
        </button>
      </div>
    </ProfileCyberPage>
  );
}
