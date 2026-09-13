"use client";

/**
 * 交換申請フォーム
 */
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useEffect, useMemo, useState } from "react";
import ProfileCyberPage from "@/app/component/profile/ProfileCyberPage";
import { nameOxanium } from "@/lib/fonts";
import { storage } from "@/lib/firebase";
import { useFirebaseUser } from "@/lib/useFirebaseUser";
import { useUserLanguage } from "@/lib/hooks/useUserLanguage";
import { L, resolveLocalizedLang } from "@/lib/i18n/localize";
import {
  createMeRedemption,
  fetchMeRedemptions,
} from "@/lib/api/fetchMeRedemptions";
import {
  REDEMPTION_CATALOG,
  normalizeRedemptionProductKind,
  redemptionCatalogTitle,
  redemptionPriceCapShort,
} from "@/lib/redemption/redemptionCatalog";
import type { RedemptionProductKind } from "@/lib/redemption/redemptionTypes";
import { REDEMPTION_APPLY_CONSENT } from "@/lib/legal/unitRedemptionLegalCopy";
import {
  canAffordRedemption,
  redemptionApplyErrorMessage,
  redemptionAvailableUnits,
} from "@/lib/redemption/redemptionApplyGate";
import {
  REDEMPTION_PRODUCT_IMAGE_MAX_BYTES,
  uploadRedemptionProductImage,
} from "@/lib/redemption/uploadRedemptionProductImage";
import { redemptionApplyFlowCopy } from "@/lib/redemption/redemptionApplyFlowCopy";
import { redemptionApplyUiCopy } from "@/lib/redemption/redemptionUiCopy";
import RedemptionApplyFlowModal from "@/app/component/redemption/RedemptionApplyFlowModal";

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
  const lang = resolveLocalizedLang(language);
  const ui = redemptionApplyUiCopy(lang);
  const base = pathBase();
  const flowCopy = redemptionApplyFlowCopy(lang);

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
  const [imageFile, setImageFile] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [shippingName, setShippingName] = useState("");
  const [shippingPostalCode, setShippingPostalCode] = useState("");
  const [shippingAddress, setShippingAddress] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [shippingCountry, setShippingCountry] = useState("JP");
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [balance, setBalance] = useState(0);
  const [reservedUnits, setReservedUnits] = useState(0);
  const [seasonUnitsUsed, setSeasonUnitsUsed] = useState(0);
  const [seasonCap, setSeasonCap] = useState(2000);
  const [walletReady, setWalletReady] = useState(false);
  const [flowOpen, setFlowOpen] = useState(true);

  const selected = useMemo(
    () => REDEMPTION_CATALOG.find((x) => x.kind === productKind),
    [productKind]
  );

  const available = redemptionAvailableUnits(balance, reservedUnits);
  const afford = selected
    ? canAffordRedemption({
        balance,
        reservedUnits,
        unitsRequired: selected.unitsRequired,
        seasonUnitsUsed,
        seasonCap,
      })
    : { ok: false as const, reason: "insufficient_units" as const };
  const submitBlocked = walletReady && !afford.ok;

  useEffect(() => {
    if (!user?.uid) return;
    let alive = true;
    void fetchMeRedemptions()
      .then((data) => {
        if (!alive) return;
        setBalance(data.balance ?? 0);
        setReservedUnits(data.reservedUnits ?? 0);
        setSeasonUnitsUsed(data.seasonUnitsUsed ?? 0);
        setSeasonCap(data.seasonCap ?? 2000);
        setWalletReady(true);
      })
      .catch(() => {
        if (!alive) return;
        setWalletReady(true);
      });
    return () => {
      alive = false;
    };
  }, [user?.uid]);

  useEffect(() => {
    return () => {
      if (imagePreview) URL.revokeObjectURL(imagePreview);
    };
  }, [imagePreview]);

  function onPickImage(file: File | null) {
    if (imagePreview) URL.revokeObjectURL(imagePreview);
    if (!file) {
      setImageFile(null);
      setImagePreview(null);
      return;
    }
    if (!file.type.startsWith("image/")) {
      setError(ui.needImageFile);
      return;
    }
    if (file.size > REDEMPTION_PRODUCT_IMAGE_MAX_BYTES) {
      setError(ui.imageTooLarge);
      return;
    }
    setError(null);
    setImageFile(file);
    setImagePreview(URL.createObjectURL(file));
  }

  async function submit(asDraft: boolean) {
    if (!asDraft && !consent) {
      setError(redemptionApplyErrorMessage("consent_required", lang));
      return;
    }
    if (!asDraft && !imageFile) {
      setError(redemptionApplyErrorMessage("image_required", lang));
      return;
    }
    if (!asDraft && selected) {
      const gate = canAffordRedemption({
        balance,
        reservedUnits,
        unitsRequired: selected.unitsRequired,
        seasonUnitsUsed,
        seasonCap,
      });
      if (!gate.ok) {
        setError(redemptionApplyErrorMessage(gate.reason, lang));
        return;
      }
    }
    if (!user?.uid) {
      setError(redemptionApplyErrorMessage("error", lang));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      let imageUrl: string | undefined;
      if (imageFile) {
        imageUrl = await uploadRedemptionProductImage({
          storage,
          uid: user.uid,
          data: imageFile,
          contentType: imageFile.type || "image/jpeg",
        });
      }
      const req = await createMeRedemption(
        {
          productKind,
          productName,
          productUrl,
          storeName,
          size,
          color,
          notes,
          imageUrl,
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
      const raw = e instanceof Error ? e.message : "error";
      setError(redemptionApplyErrorMessage(raw, lang));
    } finally {
      setBusy(false);
    }
  }

  return (
    <ProfileCyberPage
      title="APPLY"
      eyebrow="UNIT EXCHANGE"
      subtitle={ui.subtitle}
      contentClassName="max-w-lg space-y-4"
    >
      <RedemptionApplyFlowModal
        open={flowOpen}
        language={lang}
        onClose={() => setFlowOpen(false)}
      />

      <div className="flex flex-wrap items-center justify-between gap-2">
        <Link
          href={`${base}/redeem`}
          className="text-[11px] text-cyan-300/80 hover:underline"
        >
          ← {ui.backCatalog}
        </Link>
        <button
          type="button"
          onClick={() => setFlowOpen(true)}
          className="text-[11px] text-cyan-200/75 underline-offset-2 hover:underline"
        >
          {flowCopy.reopen}
        </button>
      </div>

      <div className="rounded-[2px] border border-white/10 bg-black/30 px-3 py-2.5 text-[12px] text-white/70">
        <p>{ui.available(available, balance, reservedUnits)}</p>
        <p className="mt-1 text-white/45">
          {ui.seasonUsed(seasonUnitsUsed, seasonCap)}
        </p>
        {submitBlocked ? (
          <p className="mt-2 text-[12px] text-rose-300/90">
            {redemptionApplyErrorMessage(afford.reason, lang)}
          </p>
        ) : null}
      </div>

      <label className="block space-y-1">
        <span className="text-[11px] text-white/50">{ui.productTier}</span>
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
              {redemptionCatalogTitle(item, lang)} ({item.unitsRequired} Unit)
            </option>
          ))}
        </select>
        {selected ? (
          <p className="text-[11px] text-white/40">
            {ui.needUnits(
              selected.unitsRequired,
              redemptionPriceCapShort(selected, lang)
            )}
          </p>
        ) : null}
      </label>

      {(
        [
          [ui.productName, productName, setProductName],
          [ui.productUrl, productUrl, setProductUrl],
          [ui.store, storeName, setStoreName],
          [ui.size, size, setSize],
          [ui.color, color, setColor],
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

      <div className="space-y-2">
        <span className="text-[11px] text-white/50">{ui.productImage}</span>
        <input
          type="file"
          accept="image/*"
          className="block w-full text-[12px] text-white/70 file:mr-3 file:rounded-[2px] file:border file:border-cyan-300/35 file:bg-cyan-400/10 file:px-3 file:py-1.5 file:text-[11px] file:font-semibold file:text-cyan-100"
          onChange={(e) => onPickImage(e.target.files?.[0] ?? null)}
        />
        {imagePreview ? (
          <div className="relative h-40 w-full overflow-hidden rounded-[2px] border border-white/15 bg-black/40">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={imagePreview}
              alt=""
              className="h-full w-full object-contain"
            />
            <button
              type="button"
              onClick={() => onPickImage(null)}
              className="absolute right-2 top-2 border border-white/25 bg-black/70 px-2 py-1 text-[10px] text-white/80"
            >
              {ui.removeImage}
            </button>
          </div>
        ) : (
          <p className="text-[11px] text-white/40">{ui.productImageHint}</p>
        )}
      </div>

      <label className="block space-y-1">
        <span className="text-[11px] text-white/50">{ui.notes}</span>
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
        {ui.shipping}
      </h2>

      {(
        [
          [ui.fullName, shippingName, setShippingName],
          [ui.postalCode, shippingPostalCode, setShippingPostalCode],
          [ui.address, shippingAddress, setShippingAddress],
          [ui.phone, shippingPhone, setShippingPhone],
          [ui.country, shippingCountry, setShippingCountry],
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

      <label className="flex items-start gap-2 pt-1 text-[12px] leading-relaxed text-white/70">
        <input
          type="checkbox"
          className="mt-1"
          checked={consent}
          onChange={(e) => setConsent(e.target.checked)}
        />
        <span>
          {L(lang, REDEMPTION_APPLY_CONSENT.label)}{" "}
          <Link href={`${base}/terms`} className="text-cyan-200/90 underline">
            {ui.terms}
          </Link>
          {" / "}
          <Link href={`${base}/privacy`} className="text-cyan-200/90 underline">
            {ui.privacy}
          </Link>
        </span>
      </label>

      {error ? (
        <p className="text-[13px] text-rose-300/80">{error}</p>
      ) : null}

      <div className="flex flex-wrap gap-2 pt-2">
        <button
          type="button"
          disabled={busy || submitBlocked}
          onClick={() => void submit(false)}
          className={[
            nameOxanium.className,
            "border border-cyan-300/40 bg-cyan-400/15 px-4 py-2 text-[11px] font-bold uppercase tracking-[0.12em] text-cyan-50 disabled:opacity-50",
          ].join(" ")}
        >
          {busy ? ui.submitting : ui.submit}
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
          {ui.draft}
        </button>
      </div>
    </ProfileCyberPage>
  );
}
