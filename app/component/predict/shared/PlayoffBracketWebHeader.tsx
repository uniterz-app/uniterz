"use client";

type Props = {
  season?: string;
};

export default function PlayoffBracketWebHeader({ season }: Props) {
  const title = season ? `${season} PLAYOFFS BRACKET` : "PLAYOFFS BRACKET";

  return (
    <div className="flex flex-col items-center mb-2">
      {/* UNITERZ */}
      <div
        style={{
          fontFamily: "Bebas Neue",
          fontSize: 24,
          letterSpacing: "0.22em",
          color: "#9fb4ff",
          lineHeight: 1,
        }}
      >
        UNITERZ
      </div>

      {/* divider line */}
      <div
        style={{
          width: 240,
          height: 1,
          marginTop: 9,
          marginBottom: 9,
          background:
            "linear-gradient(90deg, transparent, #5f7cff, transparent)",
          opacity: 0.75,
          boxShadow: "0 0 10px rgba(95,124,255,0.28)",
        }}
      />

      <div
        style={{
          fontFamily: "Bebas Neue",
          fontSize: 38,
          letterSpacing: "0.08em",
          color: "#f8fbff",
          lineHeight: 1,
          textShadow: `
            0 0 8px rgba(255,255,255,0.08),
            0 0 18px rgba(95,124,255,0.16)
          `,
        }}
      >
        {title}
      </div>
    </div>
  );
}