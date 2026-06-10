/** PNG をクリップボードにコピー（非対応ブラウザでは false） */
export async function copyImageToClipboard(blob: Blob): Promise<boolean> {
  if (typeof navigator === "undefined" || !navigator.clipboard?.write) {
    return false;
  }
  try {
    const type = blob.type || "image/png";
    await navigator.clipboard.write([
      new ClipboardItem({ [type]: blob }),
    ]);
    return true;
  } catch {
    return false;
  }
}
