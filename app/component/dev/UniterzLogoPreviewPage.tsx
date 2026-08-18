"use client";

/**
 * /mobile/uniterz-logo · /dev/uniterz-logo
 * 確定版 UNITERZ ロゴ（線＋線グロー）プレビュー。
 */
import Link from "next/link";
import { usePathname } from "next/navigation";
import { nameOxanium } from "@/lib/fonts";
import UniterzLogo from "@/app/component/units/UniterzLogo";

export default function UniterzLogoPreviewPage() {
  const pathname = usePathname();
  const prefix = pathname.startsWith("/dev") ? "/dev" : "/mobile";

  return (
    <main className="min-h-screen bg-[#03070b] px-4 py-8 text-white">
      <div className="mx-auto w-full max-w-[480px]">
        <section className="mt-2 border border-white/10 bg-black px-3 py-8">
          <UniterzLogo width="100%" className="mx-auto max-w-[420px]" />
        </section>

        <section className="mt-4 border border-white/10 bg-black px-4 py-6">
          <p
            className={[
              nameOxanium.className,
              "mb-3 text-[10px] font-bold uppercase tracking-[0.18em] text-white/35",
            ].join(" ")}
          >
            Narrow
          </p>
          <div className="mx-auto w-[220px]">
            <UniterzLogo width="100%" />
          </div>
        </section>

        <Link
          href={`${prefix}/uniterz-logo-flat`}
          className={[
            nameOxanium.className,
            "mt-4 inline-flex border border-white/15 px-3 py-2 text-[10px] font-bold uppercase tracking-[0.16em] text-white/55",
          ].join(" ")}
        >
          アーチなし版
        </Link>
      </div>
    </main>
  );
}
