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
