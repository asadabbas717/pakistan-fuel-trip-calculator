jest.mock("react-native", () => ({
  View: "View",
  StatusBar: "StatusBar",
  Platform: { OS: "android" },
}));
jest.mock("expo-navigation-bar", () => ({ NavigationBar: "NavigationBar" }));
jest.mock("expo-system-ui", () => ({
  setBackgroundColorAsync: jest.fn(async () => {}),
}));
jest.mock("../src/theme/ThemeContext", () => ({ useTheme: jest.fn() }));
import React from "react";
import { act, create } from "react-test-renderer";
import { Platform } from "react-native";
import { setBackgroundColorAsync } from "expo-system-ui";
import { useTheme } from "../src/theme/ThemeContext";
import AppChrome from "../src/components/AppChrome";
let renderer;
beforeEach(() => {
  renderer = undefined;
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
  Platform.OS = "android";
});
afterEach(() => {
  if (renderer) act(() => renderer.unmount());
});
test("system bar icons and exposed window follow manual theme changes", async () => {
  useTheme.mockReturnValue({ colors: { dark: true, background: "#111A20" } });
  await act(async () => {
    renderer = create(<AppChrome />);
  });
  expect(renderer.root.findByType("StatusBar").props.barStyle).toBe(
    "light-content",
  );
  expect(renderer.root.findByType("NavigationBar").props.style).toBe("light");
  expect(renderer.root.findByType("View").props.style.backgroundColor).toBe(
    "#111A20",
  );
  expect(setBackgroundColorAsync).toHaveBeenLastCalledWith("#111A20");
  useTheme.mockReturnValue({ colors: { dark: false, background: "#F5F6F2" } });
  await act(async () => {
    renderer.update(<AppChrome />);
  });
  expect(renderer.root.findByType("StatusBar").props.barStyle).toBe(
    "dark-content",
  );
  expect(renderer.root.findByType("NavigationBar").props.style).toBe("dark");
  expect(setBackgroundColorAsync).toHaveBeenLastCalledWith("#F5F6F2");
});
test("iOS and web do not mount Android navigation-bar controls", async () => {
  useTheme.mockReturnValue({ colors: { dark: true, background: "#111A20" } });
  for (const platform of ["ios", "web"]) {
    Platform.OS = platform;
    await act(async () => {
      if (renderer) renderer.update(<AppChrome />);
      else renderer = create(<AppChrome />);
    });
    expect(renderer.root.findAllByType("NavigationBar")).toHaveLength(0);
  }
});
