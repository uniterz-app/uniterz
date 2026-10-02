"use client";

/**
 * チュートリアル本文 — `**強調**` とブランド語（Pick Up / PRO LEAGUE）を表示
 */
import { nameOxanium } from "@/lib/fonts";
import { parseTutorialRichText } from "@/lib/tutorial/tutorialRichText";

type Props = {
  text: string;
  className?: string;
  boldClassName?: string;
  /** タイトル向け（行間・余白なしのインライン） */
  as?: "p" | "span";
};

function BrandSpan({
  text,
  bold,
  boldClassName,
}: {
  text: string;
  bold?: boolean;
  boldClassName: string;
}) {
  return (
    <span
      className={[
        nameOxanium.className,
        "inline font-bold uppercase tracking-[0.14em]",
        bold ? boldClassName : "",
      ]
        .filter(Boolean)
        .join(" ")}
    >
      {text}
    </span>
  );
}

export default function TutorialRichBody({
  text,
  className,
  boldClassName = "font-bold text-white/95",
  as = "p",
}: Props) {
  const parts = parseTutorialRichText(text);
  const Tag = as;
  return (
    <Tag
      className={className}
      style={as === "p" ? { whiteSpace: "pre-line" } : undefined}
    >
      {parts.map((p, i) => {
        if (p.brand) {
          return (
            <BrandSpan
              key={i}
              text={p.text}
              bold={p.bold}
              boldClassName={boldClassName}
            />
          );
        }
        if (p.bold) {
          return (
            <strong key={i} className={boldClassName}>
              {p.text}
            </strong>
          );
        }
        return <span key={i}>{p.text}</span>;
      })}
    </Tag>
  );
}
