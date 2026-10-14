// SDK 56+ installs a lazy native fetch bridge; unit tests use explicit HTTP fakes.
Object.defineProperty(globalThis, "fetch", {
  configurable: true,
  writable: true,
  value: jest.fn(),
});

jest.mock("react-native-keyboard-controller", () => {
  const React = require("react");
  const { ScrollView } = require("react-native");
  return {
    KeyboardAwareScrollView: (props) => React.createElement(ScrollView, props),
    KeyboardProvider: ({ children }) => children,
  };
});

jest.mock("../src/components/MotionPressable", () => {
  const React = require("react");
  const { TouchableOpacity } = require("react-native");
  return ({ children, ...props }) =>
    React.createElement(TouchableOpacity, props, children);
});
jest.mock("../src/components/RouteArtwork", () => () => null);
jest.mock(
  "../src/components/PageTransition",
  () =>
    ({ children }) =>
      children,
);
