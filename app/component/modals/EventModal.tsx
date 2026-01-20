// app/component/modals/EventModal.tsx
"use client";

type EventContent = {
  id: string;
  tag?: string;
  title: string;
  description: string;
  period: string;
  target?: string;
  reward?: string;
};

export default function EventModal({
  event,
  onClose,
}: {
  event: EventContent;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md">
      <div
        className="relative w-[340px] max-h-[90vh] overflow-y-auto rounded-2xl"
        style={{
          background:
            "radial-gradient(120% 120% at 50% 0%, #2A0F3A 0%, #120818 55%, #07030A 100%)",
          border: "1px solid rgba(120,180,255,0.35)",
          boxShadow:
            "0 0 40px rgba(120,180,255,0.18), 0 0 80px rgba(120,120,255,0.15)",
        }}
      >
        {/* Header title */}
        <div
          className="px-4 py-3 text-center text-xs tracking-[0.35em]"
          style={{
            color: "#FFFFFF",
            borderBottom: "1px solid rgba(120,180,255,0.25)",
          }}
        >
          INFORMATION
        </div>

        {/* Common Header Image */}
        <div className="relative">
          <img
  src="/event/eventheader.png"
  alt=""
  className="w-full object-cover"
  style={{ height: 160 }}
/>
          <div
            className="absolute inset-0"
            style={{
              background:
                "linear-gradient(180deg, rgba(0,0,0,0.25), rgba(0,0,0,0.6))",
            }}
          />
        </div>

        <div className="p-4 space-y-4">
          {/* Event Tag */}
          {event.tag && (
            <span
              className="inline-block px-3 py-1 text-[10px] rounded-full"
              style={{
                background:
                  "linear-gradient(90deg, #4F8BFF 0%, #5CF0FF 100%)",
                color: "#FFFFFF",
                fontWeight: 700,
                letterSpacing: "0.15em",
              }}
            >
              {event.tag}
            </span>
          )}

          {/* Title */}
          <h2 className="text-lg font-bold text-white leading-snug">
            {event.title}
          </h2>

          {/* Description */}
          <p className="text-sm leading-relaxed text-white/90">
            {event.description}
          </p>

          {/* Info */}
          <div className="space-y-3 text-sm text-white">
            <div>
              <div className="text-[11px] tracking-widest text-white/70">
                PERIOD
              </div>
              <div>{event.period}</div>
            </div>

            {event.target && (
              <div>
                <div className="text-[11px] tracking-widest text-white/70">
                  TARGET
                </div>
                <div>{event.target}</div>
              </div>
            )}

            {event.reward && (
              <div>
                <div className="text-[11px] tracking-widest text-white/70">
                  REWARD
                </div>
                <div>{event.reward}</div>
              </div>
            )}
          </div>
        </div>

        {/* Back */}
        <div
          className="p-4"
          style={{
            borderTop: "1px solid rgba(120,180,255,0.25)",
          }}
        >
          <button
            onClick={onClose}
            className="w-full py-2 rounded-full text-xs tracking-[0.35em] text-white"
            style={{
              border: "1px solid rgba(120,180,255,0.5)",
              background:
                "linear-gradient(180deg, rgba(120,180,255,0.18), rgba(80,120,255,0.1))",
            }}
          >
            BACK
          </button>
        </div>
      </div>
    </div>
  );
}
