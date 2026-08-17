"use client";

/**
 * チュートリアル本文 — `**強調**` を太字で表示
 */
import { parseTutorialRichText } from "@/lib/tutorial/tutorialRichText";

type Props = {
  text: string;
  className?: string;
  boldClassName?: string;
};

export default function TutorialRichBody({
  text,
  className,
  boldClassName = "font-bold text-white/95",
}: Props) {
  const parts = parseTutorialRichText(text);
  return (
    <p className={className} style={{ whiteSpace: "pre-line" }}>
      {parts.map((p, i) =>
        p.bold ? (
          <strong key={i} className={boldClassName}>
            {p.text}
          </strong>
        ) : (
          <span key={i}>{p.text}</span>
        )
      )}
    </p>
  );
}
