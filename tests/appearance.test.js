jest.mock("react-native", () => ({
  ScrollView: "ScrollView",
  Platform: { OS: "android" },
  StyleSheet: { create: (s) => s },
  useColorScheme: () => "dark",
  AccessibilityInfo: {
    isReduceMotionEnabled: async () => true,
    addEventListener: () => ({ remove() {} }),
  },
}));
jest.mock("react-native-safe-area-context", () => ({
  useSafeAreaInsets: () => ({ bottom: 48, left: 0, right: 0 }),
}));
jest.mock("../src/storage/appStorage", () => ({
  getStoredItem: jest.fn(async () => null),
  setStoredItem: jest.fn(async () => true),
}));
import React from "react";
import { create, act } from "react-test-renderer";
import { Platform, ScrollView } from "react-native";
import Screen, { screenPadding } from "../src/components/Screen";
import {
  ThemeProvider,
  useTheme,
  themeColors,
  palettes,
} from "../src/theme/ThemeContext";
import { getStoredItem, setStoredItem } from "../src/storage/appStorage";
let renderer;
let current;
function Probe() {
  current = useTheme();
  return <Screen />;
}
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
  Platform.OS = "android";
});
afterEach(() => {
  if (renderer) act(() => renderer.unmount());
});
test("system dark mode and theme choices persist while actions clear system navigation", async () => {
  await act(async () => {
    renderer = create(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
  });
  expect(current.colors.dark).toBe(true);
  const style =
    renderer.root.findByType(ScrollView).props.contentContainerStyle;
  expect(style[style.length - 1].paddingBottom).toBe(72);
  expect(screenPadding({ bottom: 0, left: 40, right: 0 })).toEqual({
    paddingBottom: 40,
    paddingLeft: 40,
    paddingRight: 20,
  });
  await act(async () => {
    current.update({ mode: "light", palette: "ocean" });
  });
  expect(current.colors.dark).toBe(false);
  expect(current.colors.primary).toBe("#4357B2");
  expect(JSON.parse(setStoredItem.mock.calls[0][1])).toEqual({
    mode: "light",
    palette: "ocean",
  });
});
test("slow preference load cannot overwrite a choice made during startup", async () => {
  let resolve;
  getStoredItem.mockReturnValueOnce(
    new Promise((done) => {
      resolve = done;
    }),
  );
  await act(async () => {
    renderer = create(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
  });
  await act(async () => {
    current.update({ palette: "sunset" });
  });
  await act(async () => {
    resolve(JSON.stringify({ mode: "light", palette: "forest" }));
  });
  expect(current.palette).toBe("sunset");
});
test("failed persistence leaves the chosen theme usable with an honest error", async () => {
  setStoredItem.mockRejectedValueOnce(new Error("full"));
  await act(async () => {
    renderer = create(
      <ThemeProvider>
        <Probe />
      </ThemeProvider>,
    );
  });
  await act(async () => {
    current.update({ mode: "light" });
  });
  expect(current.colors.dark).toBe(false);
  expect(current.error).toContain("saving failed");
});

function luminance(hex) {
  const rgb = hex
    .slice(1)
    .match(/../g)
    .map((part) => parseInt(part, 16) / 255)
    .map((value) =>
      value <= 0.04045 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4,
    );
  return rgb[0] * 0.2126 + rgb[1] * 0.7152 + rgb[2] * 0.0722;
}
test("destructive text remains readable in every palette and appearance", () => {
  for (const palette of Object.keys(palettes))
    for (const dark of [false, true]) {
      const colors = themeColors(palette, dark);
      const values = [
        luminance(colors.danger),
        luminance(colors.dangerSurface),
      ].sort((a, b) => b - a);
      expect((values[0] + 0.05) / (values[1] + 0.05)).toBeGreaterThanOrEqual(
        4.5,
      );
    }
});
test("native forms use focus-aware scrolling without duplicate keyboard insets; web retains ordinary scrolling", async () => {
  await act(async () => {
    renderer = create(<Screen />);
  });
  let props = renderer.root.findByType(ScrollView).props;
  expect(props.bottomOffset).toBe(24);
  expect(props.automaticallyAdjustKeyboardInsets).toBe(false);
  Platform.OS = "web";
  act(() => renderer.update(<Screen />));
  props = renderer.root.findByType(ScrollView).props;
  expect(props.bottomOffset).toBeUndefined();
  expect(props.keyboardShouldPersistTaps).toBe("handled");
});
