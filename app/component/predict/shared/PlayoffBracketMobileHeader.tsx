"use client";

type Props = {
  season?: string;
};

export default function PlayoffBracketHeader({ season }: Props) {
  return (
    <div className="flex flex-col items-center mb-1">
      {/* UNITERZ */}
      <div
        style={{
          fontFamily: "Bebas Neue",
          fontSize: 23,
          letterSpacing: "0.22em",
          color: "#9fb4ff",
        }}
      >
        UNITERZ
      </div>

      {/* divider line */}
      <div
        style={{
          width: 160,
          height: 1,
          marginTop: 2,
          marginBottom: 4,
          background:
            "linear-gradient(90deg, transparent, #5f7cff, transparent)",
          opacity: 0.6,
        }}
      />

      {/* season */}
      {season && (
        <div
          style={{
            fontFamily: "Bebas Neue",
            fontSize: 16,
            letterSpacing: "0.14em",
            color: "#9fb4ff",
            marginBottom: 2,
          }}
        >
          {season}
        </div>
      )}

      {/* title */}
      <div
        style={{
          fontFamily: "Bebas Neue",
          fontSize: 28,
          letterSpacing: "0.06em",
          color: "#f8fbff",
        }}
      >
        PLAYOFF BRACKET
      </div>
    </div>
  );
}