"use client";

type Props = {
  size?: "sm" | "md" | "lg";
  onClick?: () => void;
};

export default function BecomeMemberButton({ size = "md", onClick }: Props) {
  const clsBase =
    size === "sm"
      ? "h-9 px-3 rounded-lg text-xs font-bold transition"
      : size === "lg"
      ? "h-11 px-5 rounded-xl text-base font-bold transition"
      : "h-10 px-4 rounded-xl text-sm font-bold transition";

  // ▼ FollowButton と同じ構造で “theme” を作る
  const theme = {
    base: "text-white border border-white/20",
    normal: "bg-[#b5b5b5] hover:bg-[#c6c6c6]",
  };

  const cls = `${theme.base} ${theme.normal}`;

  return (
    <button
      onClick={onClick}
      className={`${clsBase} ${cls}`}
    >
      メンバーになる
    </button>
  );
}
