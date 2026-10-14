jest.unmock("../src/components/PageTransition");
jest.unmock("../src/components/MotionPressable");
jest.mock("../src/theme/ThemeContext", () => ({ useTheme: jest.fn() }));
jest.mock("@react-navigation/native", () => ({
  NavigationContext: require("react").createContext(undefined),
}));
import React, { useEffect, useState } from "react";
import { act, create } from "react-test-renderer";
import { Animated, Platform, Text } from "react-native";
import { NavigationContext } from "@react-navigation/native";
import { useTheme } from "../src/theme/ThemeContext";
import PageTransition from "../src/components/PageTransition";
const MotionPressable = jest.requireActual(
  "../src/components/MotionPressable",
).default;
let renderer;
let timing;
let spring;
let start;
let stop;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  renderer = undefined;
  start = jest.fn();
  stop = jest.fn();
  timing = jest.spyOn(Animated, "timing").mockReturnValue({ start, stop });
  spring = jest.spyOn(Animated, "spring").mockReturnValue({ start, stop });
  useTheme.mockReturnValue({
    reduceMotion: false,
    colors: { primary: "#14634B" },
  });
});
afterEach(() => {
  if (renderer) act(() => renderer.unmount());
  jest.restoreAllMocks();
});
test("web Back focus animates the existing page and preserves its form state", () => {
  jest.replaceProperty(Platform, "OS", "web");
  let focus;
  let change;
  const mounted = jest.fn();
  function Form() {
    const [value, setValue] = useState("Karachi");
    change = setValue;
    useEffect(mounted, []);
    return <Text>{value}</Text>;
  }
  const navigation = {
    addListener: jest.fn((event, listener) => {
      focus = listener;
      return jest.fn();
    }),
  };
  act(() => {
    renderer = create(
      <NavigationContext.Provider value={navigation}>
        <PageTransition>
          <Form />
        </PageTransition>
      </NavigationContext.Provider>,
    );
  });
  act(() => change("Lahore"));
  act(() => focus());
  expect(timing).toHaveBeenCalledTimes(2);
  expect(mounted).toHaveBeenCalledTimes(1);
  expect(renderer.root.findByType(Text).props.children).toBe("Lahore");
});
test("Reduce Motion keeps page and button interactions available without animation", () => {
  jest.replaceProperty(Platform, "OS", "web");
  useTheme.mockReturnValue({
    reduceMotion: true,
    colors: { primary: "#14634B" },
  });
  const action = jest.fn();
  act(() => {
    renderer = create(
      <PageTransition>
        <MotionPressable accessibilityRole="button" onPress={action}>
          <Text>Calculate</Text>
        </MotionPressable>
      </PageTransition>,
    );
  });
  const button = renderer.root.find(
    (node) =>
      node.props.accessibilityRole === "button" &&
      typeof node.props.onPressIn === "function" &&
      typeof node.props.onPressOut === "function",
  );
  act(() => {
    button.props.onPressIn({});
    button.props.onPress({});
    button.props.onPressOut({});
  });
  expect(action).toHaveBeenCalledTimes(1);
  expect(timing).not.toHaveBeenCalled();
  expect(spring).not.toHaveBeenCalled();
});
