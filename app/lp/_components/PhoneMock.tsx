import Image from "next/image";

type Props = {
  src: string;
  alt: string;
  widthClassName?: string;
  glowClassName?: string;
  imageClassName?: string;
  tiltClassName?: string;
  hideStatusBar?: boolean;
  priority?: boolean;
};

export default function PhoneMock({
  src,
  alt,
  widthClassName = "w-[320px]",
  glowClassName = "from-cyan-400/10 via-sky-400/6 to-emerald-300/8",
  imageClassName = "",
  tiltClassName = "",
  hideStatusBar = false,
  priority = false,
}: Props) {
  return (
    <div className={`relative mx-auto ${widthClassName}`}>
      <div
        className={`pointer-events-none absolute -inset-3 rounded-[54px] bg-gradient-to-br ${glowClassName} blur-3xl opacity-60`}
      />

      <div
        className={[
          "relative overflow-hidden rounded-[38px] p-[8px]",
          "bg-[linear-gradient(180deg,#1a2029_0%,#0c1016_36%,#020304_100%)]",
          "shadow-[0_30px_80px_rgba(0,0,0,0.52),0_8px_22px_rgba(0,0,0,0.26)]",
          "ring-1 ring-white/[0.08]",
          tiltClassName,
        ].join(" ")}
      >
        <div className="pointer-events-none absolute inset-[1px] rounded-[37px] border border-white/[0.06]" />
        <div className="pointer-events-none absolute inset-x-[3px] top-[3px] h-[13%] rounded-t-[34px] bg-[linear-gradient(180deg,rgba(255,255,255,0.08)_0%,rgba(255,255,255,0.02)_38%,rgba(255,255,255,0)_82%)]" />
        <div className="pointer-events-none absolute left-[5px] top-[12px] bottom-[12px] w-[1px] bg-gradient-to-b from-white/16 via-white/5 to-transparent" />
        <div className="pointer-events-none absolute right-[5px] top-[12px] bottom-[12px] w-[1px] bg-gradient-to-b from-white/10 via-white/4 to-transparent" />

        <div className="relative overflow-hidden rounded-[29px] bg-black ring-1 ring-white/[0.05]">
          <div
            className={[
              "relative w-full overflow-hidden",
              hideStatusBar ? "translate-y-[0.8%] scale-[1.01]" : "",
            ].join(" ")}
          >
            <Image
              src={src}
              alt={alt}
              width={900}
              height={1800}
              priority={priority}
              className={`relative z-0 h-auto w-full object-cover ${imageClassName}`}
            />
          </div>

          {hideStatusBar && (
            <>
              <div className="pointer-events-none absolute inset-x-0 top-0 z-20 h-[8.8%] bg-[linear-gradient(180deg,rgba(0,0,0,0.98)_0%,rgba(0,0,0,0.92)_62%,rgba(0,0,0,0.18)_100%)]" />

              <div className="pointer-events-none absolute left-[4.3%] top-[1.2%] z-30 h-[5.1%] w-[19%] rounded-[10px] bg-[linear-gradient(180deg,rgba(0,0,0,0.98)_0%,rgba(0,0,0,0.90)_76%,rgba(0,0,0,0)_100%)]" />

              <div className="pointer-events-none absolute right-[4.3%] top-[1.2%] z-30 h-[5.1%] w-[19%] rounded-[10px] bg-[linear-gradient(180deg,rgba(0,0,0,0.98)_0%,rgba(0,0,0,0.90)_76%,rgba(0,0,0,0)_100%)]" />

              <div className="pointer-events-none absolute left-1/2 top-[0.95%] z-40 h-[5.9%] w-[40.5%] -translate-x-1/2 rounded-b-[15px] rounded-t-[13px] bg-black shadow-[0_8px_16px_rgba(0,0,0,0.4)]" />
            </>
          )}

          <div className="pointer-events-none absolute inset-x-0 top-0 z-10 h-[17%] bg-[linear-gradient(180deg,rgba(255,255,255,0.04)_0%,rgba(255,255,255,0.014)_24%,rgba(255,255,255,0)_56%)]" />
          <div className="pointer-events-none absolute left-0 top-0 z-10 h-full w-[9%] bg-[linear-gradient(90deg,rgba(255,255,255,0.015)_0%,rgba(255,255,255,0.005)_36%,rgba(255,255,255,0)_100%)]" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 z-10 h-[10%] bg-gradient-to-t from-black/12 to-transparent" />
        </div>

        <div className="pointer-events-none absolute left-1/2 top-[6px] z-30 h-[22px] w-[39%] -translate-x-1/2 rounded-b-[15px] bg-black shadow-[0_6px_14px_rgba(0,0,0,0.36)]" />
      </div>
    </div>
  );
}