module.exports = function (api) {
  api.cache(true);
  return {
    presets: ["babel-preset-expo"],
    plugins: ["./babel/themeColorLiteralsPlugin", "react-native-reanimated/plugin"],
  };
};
