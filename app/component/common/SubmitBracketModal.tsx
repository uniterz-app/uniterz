"use client";

type SubmitBracketModalProps = {
  open: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
};

export default function SubmitBracketModal({
  open,
  onClose,
  onConfirm,
  loading = false,
}: SubmitBracketModalProps) {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center px-4">
      <button
        type="button"
        aria-label="Close modal"
        onClick={onClose}
        className="absolute inset-0 bg-black/70 backdrop-blur-[2px]"
      />

      <div className="relative z-[201] w-full max-w-sm rounded-2xl border border-white/10 bg-[#0d1015] p-5 shadow-[0_20px_60px_rgba(0,0,0,0.45)]">
        <div className="text-[18px] font-semibold text-white">
          Submit Bracket
        </div>

        <div className="mt-4 space-y-2 text-[14px] leading-relaxed text-white/78">
          <p>この内容でブラケットを提出します。</p>
          <p>ブラケットの提出は1人1回です。</p>
          <p>100点満点で採点されます。</p>
        </div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={loading}
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-white/80 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50"
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="rounded-xl bg-[#163a5f] px-4 py-3 text-sm font-semibold text-white transition hover:bg-[#1d4c78] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? "Submitting..." : "Confirm"}
          </button>
        </div>
      </div>
    </div>
  );
}