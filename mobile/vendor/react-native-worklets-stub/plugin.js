// No-op Babel plugin. This project pins react-native-reanimated@3.x (see
// mobile/package.json's "overrides"), which doesn't use the worklets/plugin
// transform - that's only needed by reanimated 4+, per react-native-css-interop's
// own babel.js source comment ("Use this plugin in reanimated 4 and later").
// nativewind's babel preset unconditionally lists "react-native-worklets/plugin"
// as a required plugin regardless of the installed reanimated version, so
// without a real resolvable module at this path, every single Babel transform
// in this project (Jest, Metro, everything) fails at plugin-resolution time
// before any file is even compiled - not something that can be worked around
// per-file. This stub package (wired in via package.json's "react-native-worklets"
// dependency, pointed at this local folder) satisfies that resolution with a
// deliberate no-op, safe because this project's reanimated version never emits
// the AST nodes this plugin would otherwise need to transform.
module.exports = function () {
  return { visitor: {} };
};
