/**
 * アプリ側コードの `react-native` はここに差し替わる（metro.config.js）。
 * iOS / Android の文字サイズ設定でアプリの文字を拡大しない（Text / TextInput 一律）。
 * React 19 では Text.defaultProps が効かないため、ラップして固定する。
 */
const React = require("react");
const RN = require("react-native");

function withFixedFontScale(Base, displayName) {
  const Wrapped = React.forwardRef(function FixedFontScale(props, ref) {
    return React.createElement(Base, {
      ...props,
      allowFontScaling: false,
      ref,
    });
  });
  Wrapped.displayName = displayName;
  return Wrapped;
}

const Text = withFixedFontScale(RN.Text, "Text");
const TextInput = withFixedFontScale(RN.TextInput, "TextInput");
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
