/**
 * アプリ側コードの `react-native` はここに差し替わる（metro.config.js）。
 * iOS / Android の文字サイズ設定でアプリの文字を拡大しない（Text / TextInput 一律）。
 * React 19 では Text.defaultProps が効かないため、ラップして固定する。
 * 繁体字ユーザーには Text の文字列 children / TextInput の placeholder / Alert を繁体字に変換する。
 */
const React = require("react");
const RN = require("react-native");
const {
  ChineseScriptContext,
  convertForChineseScript,
  getActiveChineseScript,
} = require("../i18n/chineseScriptNative");

function convertChildren(children, script) {
  if (script !== "hant") return children;
  if (typeof children === "string") return convertForChineseScript(children, script);
  if (Array.isArray(children)) {
    return children.map((c) =>
      typeof c === "string" ? convertForChineseScript(c, script) : c
    );
  }
  return children;
}

const Text = React.forwardRef(function FixedFontScaleText(props, ref) {
  const script = React.useContext(ChineseScriptContext);
  return React.createElement(RN.Text, {
    ...props,
    children: convertChildren(props.children, script),
    allowFontScaling: false,
    ref,
  });
});
Text.displayName = "Text";

const TextInput = React.forwardRef(function FixedFontScaleTextInput(props, ref) {
  const script = React.useContext(ChineseScriptContext);
  return React.createElement(RN.TextInput, {
    ...props,
    placeholder:
      typeof props.placeholder === "string"
        ? convertForChineseScript(props.placeholder, script)
        : props.placeholder,
    allowFontScaling: false,
    ref,
  });
});
TextInput.displayName = "TextInput";
if (RN.TextInput && RN.TextInput.State) TextInput.State = RN.TextInput.State;

function convertAlertText(v) {
  return typeof v === "string" ? convertForChineseScript(v, getActiveChineseScript()) : v;
}

const Alert = {
  alert(title, message, buttons, options) {
    const converted = Array.isArray(buttons)
      ? buttons.map((b) => (b && typeof b.text === "string" ? { ...b, text: convertAlertText(b.text) } : b))
      : buttons;
    return RN.Alert.alert(convertAlertText(title), convertAlertText(message), converted, options);
  },
  prompt(title, message, ...rest) {
    return RN.Alert.prompt(convertAlertText(title), convertAlertText(message), ...rest);
  },
};

const out = {};
for (const key of Object.keys(RN)) {
  if (key === "Text" || key === "TextInput" || key === "Alert") continue;
  Object.defineProperty(out, key, {
    enumerable: true,
    get: () => RN[key],
  });
}
out.Text = Text;
out.TextInput = TextInput;
out.Alert = Alert;

module.exports = out;
