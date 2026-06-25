"use client";

type Props = {
  disabled?: boolean;
  onClick: () => void;
  className?: string;
  label?: string;
};

/** WC ブラケット提出 — 角切りサイバー HUD ボタン */
export default function WcBracketSubmitButton({
  disabled = false,
  onClick,
  className = "",
  label = "BRACKET SUBMIT",
}: Props) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      className={["wc-bracket-submit-btn", className].filter(Boolean).join(" ")}
    >
      <span className="wc-bracket-submit-btn__tick-left" aria-hidden />
      <span className="wc-bracket-submit-btn__tick-top" aria-hidden />
      <span className="wc-bracket-submit-btn__label">{label}</span>
      <span className="wc-bracket-submit-btn__code" aria-hidden>
        R-77
      </span>
    </button>
  );
}
