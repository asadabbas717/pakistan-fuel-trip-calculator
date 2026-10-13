jest.mock("react-native", () => ({
  Modal: "Modal",
  View: "View",
  Text: "Text",
  ScrollView: "ScrollView",
  Pressable: "Pressable",
  Platform: { OS: "android" },
  Keyboard: { dismiss: jest.fn() },
  findNodeHandle: () => null,
  AccessibilityInfo: { setAccessibilityFocus: jest.fn() },
  StyleSheet: { create: (s) => s },
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ top: 0, bottom: 24 }),
}));
jest.mock("../src/theme/ThemeContext", () => ({
  useTheme: () => ({
    colors: {
      card: "#1D282F",
      text: "#F0F4F5",
      dangerSurface: "#44252C",
      danger: "#FFA8A8",
    },
  }),
}));
import React from "react";
import { act, create } from "react-test-renderer";
import DialogHost from "../src/components/DialogHost";
import {
  confirmAction,
  dismissDialog,
  getDialogs,
  showMessage,
} from "../src/utils/confirmAction";
let renderer;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  act(() => {
    renderer = create(<DialogHost />);
  });
});
afterEach(() => {
  act(() => {
    renderer.unmount();
    while (getDialogs().length) dismissDialog(getDialogs()[0]);
  });
});
function press(label) {
  return renderer.root
    .findAllByType("Pressable")
    .find((node) =>
      node.findAllByType("Text").some((text) => text.props.children === label),
    ).props.onPress;
}
test("Cancel and Android Back dismiss without executing deletion", () => {
  const action = jest.fn();
  act(() => confirmAction("Delete all trips?", action));
  act(() => press("Cancel")());
  expect(action).not.toHaveBeenCalled();
  act(() => confirmAction("Delete all trips?", action));
  act(() => renderer.root.findByType("Modal").props.onRequestClose());
  expect(action).not.toHaveBeenCalled();
  expect(getDialogs()).toHaveLength(0);
});
test("confirmation executes once despite repeated taps and queues themed feedback", async () => {
  const action = jest.fn(async () => {
    throw new Error("Unable to delete");
  });
  act(() => confirmAction("Delete?", action));
  const onPress = press("Delete");
  await act(async () => {
    onPress();
    onPress();
  });
  expect(action).toHaveBeenCalledTimes(1);
  expect(getDialogs()[0].message).toBe("Unable to delete");
  expect(
    renderer.root
      .findAllByType("Text")
      .find((node) => node.props.children === "FuelTrip PK").props.style[1]
      .color,
  ).toBe("#F0F4F5");
});
test("queued notifications retain order and non-destructive confirmations retain their label", () => {
  act(() => {
    showMessage("First");
    confirmAction("Restore backup?", jest.fn(), {
      title: "Restore backup",
      label: "Restore",
      destructive: false,
    });
  });
  act(() => press("OK")());
  expect(getDialogs()[0].title).toBe("Restore backup");
  expect(press("Restore")).toBeDefined();
});
