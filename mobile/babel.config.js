module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      [
        'babel-preset-expo',
        {
          jsxImportSource: 'nativewind',
          // This repo pins react-native-reanimated@3.x and has no real
          // react-native-worklets package - vendor/react-native-worklets-stub
          // is a deliberate no-op that exists only so nativewind's babel
          // preset (react-native-css-interop/babel.js) can resolve the
          // "react-native-worklets/plugin" string it unconditionally lists.
          // Without `worklets: false` here, babel-preset-expo's own reanimated
          // plugin selection sees that same resolvable stub and picks the
          // no-op react-native-worklets/plugin INSTEAD of the real
          // react-native-reanimated/plugin - silently skipping the Babel
          // transform that injects __initData onto every 'worklet' directive
          // function (including reanimated's own internal valueUnpacker).
          // That produced a real, confirmed crash: `getValueUnpackerCode()`
          // read `.code` off an undefined __initData and threw a JS TypeError
          // that aborted the app (SIGABRT) on every cold launch. Forcing
          // `worklets: false` makes babel-preset-expo use the real
          // react-native-reanimated/plugin regardless of the stub's presence.
          worklets: false,
        },
      ],
      'nativewind/babel',
    ],
    plugins: [
      [
        'module-resolver',
        {
          root: ['.'],
          alias: { '@': './src' },
          extensions: ['.ts', '.tsx', '.js', '.jsx', '.json'],
        },
      ],
    ],
  };
};
