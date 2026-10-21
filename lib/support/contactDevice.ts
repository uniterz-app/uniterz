/** お問い合わせで必ず選ぶストア */

export const CONTACT_DEVICE_KINDS = ["apple", "google_play"] as const;

export type ContactDeviceKind = (typeof CONTACT_DEVICE_KINDS)[number];

const KIND_LABEL: Record<ContactDeviceKind, string> = {
  apple: "Apple",
  google_play: "Google Play",
};

export function isContactDeviceKind(value: string): value is ContactDeviceKind {
  return (CONTACT_DEVICE_KINDS as readonly string[]).includes(value);
}

export function contactDeviceKindLabel(kind: ContactDeviceKind): string {
  return KIND_LABEL[kind];
}

/** 未選択は null。保存する表示名は Apple / Google Play */
export function resolveContactDeviceModel(
  kind: string
): { deviceKind: ContactDeviceKind; deviceModel: string } | null {
  const value = String(kind ?? "").trim();
  if (!isContactDeviceKind(value)) return null;
  return { deviceKind: value, deviceModel: KIND_LABEL[value] };
}
