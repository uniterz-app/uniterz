import {
  TOKUSHOHO_ROWS,
} from "@/lib/legal/tokushohoCopy";

/** 特定商取引法に基づく表記の本文（Web / Mobile 共通） */
export default function TokushohoDocument() {
  return (
    <dl className="space-y-5">
      {TOKUSHOHO_ROWS.map((row) => (
        <div key={row.label}>
          <dt className="text-sm font-semibold text-white">{row.label}</dt>
          <dd className="mt-1 whitespace-pre-line text-sm leading-relaxed text-white/80">
            {row.label === "メールアドレス" ? (
              <a
                href={`mailto:${row.value}`}
                className="text-cyan-300 underline-offset-2 hover:underline"
              >
                {row.value}
              </a>
            ) : (
              row.value
            )}
          </dd>
        </div>
      ))}
    </dl>
  );
}
