"use client";

type Props = {
  season?: string;
};

const bebas = "Bebas Neue, sans-serif";

export default function PlayoffBracketHeader({ season }: Props) {
  const title = season ? `${season} PLAYOFFS BRACKET` : "PLAYOFFS BRACKET";

  return (
    <div className="mb-1 flex w-full flex-col items-center">
      <div
        className="w-full text-center leading-none"
        style={{
          fontFamily: bebas,
          fontSize: 20,
          letterSpacing: "0.22em",
          color: "#9fb4ff",
        }}
      >
        UNITERZ
      </div>

      <div
        className="mt-2 h-px w-[min(180px,65vw)] max-w-[220px]"
        style={{
          background:
            "linear-gradient(90deg, transparent, rgba(56,189,248,0.5), #5f7cff, rgba(56,189,248,0.5), transparent)",
          boxShadow:
            "0 0 10px rgba(95,124,255,0.65), 0 0 22px rgba(34,211,238,0.3)",
        }}
        aria-hidden
      />

      <div
        className="mt-2 leading-none"
        style={{
          fontFamily: bebas,
          fontSize: 24,
          letterSpacing: "0.06em",
          color: "#f8fbff",
        }}
      >
        {title}
      </div>
    </div>
  );
}
