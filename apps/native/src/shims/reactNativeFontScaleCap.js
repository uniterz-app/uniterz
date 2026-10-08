/**
 * アプリ側コードの `react-native` はここに差し替わる（metro.config.js）。
 * iOS の文字サイズ設定による拡大を Text / TextInput 既定で最大 1.2 倍に抑える。
 * React 19 では Text.defaultProps が効かないため、ラップして既定値を入れる。
 */
const React = require("react");
const RN = require("react-native");

const DEFAULT_MAX_FONT_SIZE_MULTIPLIER = 1.2;

function withFontScaleCap(Base, displayName) {
  const Wrapped = React.forwardRef(function FontScaleCapped(props, ref) {
    return React.createElement(Base, {
      ...props,
      maxFontSizeMultiplier:
        props.maxFontSizeMultiplier ?? DEFAULT_MAX_FONT_SIZE_MULTIPLIER,
      ref,
    });
  });
  Wrapped.displayName = displayName;
  return Wrapped;
}

const Text = withFontScaleCap(RN.Text, "Text");
const TextInput = withFontScaleCap(RN.TextInput, "TextInput");
if (RN.TextInput && RN.TextInput.State) TextInput.State = RN.TextInput.State;

const out = {};
for (const key of Object.keys(RN)) {
  if (key === "Text" || key === "TextInput") continue;
  Object.defineProperty(out, key, {
    enumerable: true,
    get: () => RN[key],
  });
}
out.Text = Text;
out.TextInput = TextInput;

module.exports = out;
