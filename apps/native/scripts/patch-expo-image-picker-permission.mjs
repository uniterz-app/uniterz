/**
 * 写真変更でフォルダ／写真の許可を一度拒否すると、以後ピッカーが「許可してください」のままになる。
 * - iOS: PHPickerConfiguration(photoLibrary:) は拒否後にライブラリを出せない。権限不要の初期化にする。
 * - Android: フォトピッカーが無いときの OPEN_DOCUMENT は、拒否したフォルダを開き直す。ギャラリー選択にする。
 */
import { existsSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import path from "node:path";

const root = path.join(path.dirname(fileURLToPath(import.meta.url)), "..");
const pickerRoot = path.join(root, "node_modules/expo-image-picker");
const MARKER = "uniterz: permissionless image picker";

function patchIos() {
  const file = path.join(pickerRoot, "ios/ImagePickerModule.swift");
  if (!existsSync(file)) return;
  const src = readFileSync(file, "utf8");
  if (src.includes(MARKER)) return;
  const needle = "var configuration = PHPickerConfiguration(photoLibrary: PHPhotoLibrary.shared())";
  if (!src.includes(needle)) {
    throw new Error("[patch-expo-image-picker-permission] iOS の PHPicker 初期化が見つかりません");
  }
  const next = src.replace(
    needle,
    `// ${MARKER}
    var configuration = PHPickerConfiguration()`
  );
  writeFileSync(file, next);
}

function patchAndroid() {
  const file = path.join(
    pickerRoot,
    "android/src/main/java/expo/modules/imagepicker/contracts/ImageLibraryContract.kt"
  );
  if (!existsSync(file)) return;
  let src = readFileSync(file, "utf8");
  if (src.includes(MARKER)) return;

  const legacyGate = `    if (input.options.legacy) {
      return createLegacyIntent(input.options)
    }`;
  if (!src.includes(legacyGate)) {
    throw new Error("[patch-expo-image-picker-permission] Android の createIntent が見つかりません");
  }
  src = src.replace(
    legacyGate,
    `${legacyGate}

    // ${MARKER}
    // フォトピッカーが無い端末は ACTION_OPEN_DOCUMENT に落ち、フォルダ許可の拒否が次回以降も残る。
    if (!PickVisualMedia.isPhotoPickerAvailable(context)) {
      return createGalleryPickIntent(input.options)
    }`
  );

  const fn = `
  /** メディアストアの画像一覧。フォルダの永続許可を取らない。 */
  private fun createGalleryPickIntent(options: ImagePickerOptions): Intent {
    val collection = when (options.nativeMediaTypes) {
      MediaTypes.VIDEOS -> android.provider.MediaStore.Video.Media.EXTERNAL_CONTENT_URI
      else -> android.provider.MediaStore.Images.Media.EXTERNAL_CONTENT_URI
    }
    return Intent(Intent.ACTION_PICK, collection).apply {
      type = when (options.nativeMediaTypes) {
        MediaTypes.VIDEOS -> "video/*"
        else -> "image/*"
      }
      if (options.allowsMultipleSelection) {
        putExtra(Intent.EXTRA_ALLOW_MULTIPLE, true)
      }
    }
  }
`;
  const anchor = "\n  private fun createLegacyIntent";
  if (!src.includes(anchor)) {
    throw new Error("[patch-expo-image-picker-permission] createLegacyIntent が見つかりません");
  }
  src = src.replace(anchor, `${fn}${anchor}`);
  writeFileSync(file, src);
}

patchIos();
patchAndroid();
