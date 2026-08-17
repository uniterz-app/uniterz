import Image from "next/image";

type OfficialLpShotProps = {
  src: string;
  alt: string;
  priority?: boolean;
  className?: string;
  sizes?: string;
};

/** LP 用スクショ。iPhone 風の外枠で切り出す。 */
export default function OfficialLpShot({
  src,
  alt,
  priority = false,
  className,
  sizes = "(max-width: 720px) 42vw, 220px",
}: OfficialLpShotProps) {
  return (
    <div className={["olp-iphone", className].filter(Boolean).join(" ")}>
      <span className="olp-iphone-btn olp-iphone-silent" aria-hidden />
      <span className="olp-iphone-btn olp-iphone-vol-up" aria-hidden />
      <span className="olp-iphone-btn olp-iphone-vol-down" aria-hidden />
      <span className="olp-iphone-btn olp-iphone-power" aria-hidden />
      <div className="olp-iphone-shell">
        <div className="olp-shot">
          <Image
            src={src}
            alt={alt}
            fill
            priority={priority}
            sizes={sizes}
            className="object-cover object-top"
          />
        </div>
      </div>
    </div>
  );
}
