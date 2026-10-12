jest.mock("react-native", () => ({
  Platform: { OS: "android" },
  View: "View",
  Text: "Text",
  ActivityIndicator: "ActivityIndicator",
  TouchableOpacity: "TouchableOpacity",
  Linking: { openURL: jest.fn(async () => {}) },
  StyleSheet: { create: (value) => value },
}));
jest.mock("react-native-webview", () => ({ WebView: "WebView" }));
jest.mock("expo-file-system/legacy", () => ({}));
import React from "react";
import { create, act } from "react-test-renderer";
import { WebView } from "react-native-webview";
import MapViewWeb from "../src/components/MapViewWeb";
import { mapPreviewHtml } from "../src/services/mapPreviewService";
const start = { name: "Karachi", lat: 24.8, lon: 67 };
const destination = { name: "Hyderabad", lat: 25.4, lon: 68.3 };
const routeCoordinates = [
  [24.8, 67],
  [25.4, 68.3],
];
let renderer;
beforeEach(() => {
  jest.useFakeTimers();
  global.IS_REACT_ACT_ENVIRONMENT = true;
});
afterEach(() => {
  if (renderer) act(() => renderer.unmount());
  jest.useRealTimers();
});
test("preview bundles map code and preserves attribution without remote bootstrap scripts", () => {
  const html = mapPreviewHtml(start, destination, routeCoordinates);
  expect(html).not.toMatch(/<script[^>]+src=/);
  expect(html).not.toContain("unpkg.com");
  expect(html).toContain("https://tile.openstreetmap.org/");
  expect(html).toContain("https://www.openstreetmap.org/copyright");
  expect(html).toContain("map-ready");
  expect(() =>
    mapPreviewHtml({ ...start, lat: 999 }, destination, routeCoordinates),
  ).toThrow("coordinates");
});
test("tile timeout offers retry and successful readiness clears the timeout", async () => {
  act(() => {
    renderer = create(
      <MapViewWeb
        start={start}
        destination={destination}
        routeCoordinates={routeCoordinates}
      />,
    );
  });
  const source = renderer.root.findByType(WebView).props.source;
  act(() => {
    renderer.root.findByType(WebView).props.onMessage({
      nativeEvent: { data: JSON.stringify({ type: "map-ready" }) },
    });
  });
  expect(JSON.stringify(renderer.toJSON())).toContain("loading map tiles");
  expect(renderer.root.findByType(WebView).props.source).toBe(source);
  await act(async () => {
    await jest.advanceTimersByTimeAsync(12000);
  });
  act(() => {
    renderer.root
      .findByProps({ accessibilityLabel: "Retry map preview" })
      .props.onPress();
  });
  expect(JSON.stringify(renderer.toJSON())).toContain("Preparing map");
  act(() => {
    renderer.root.findByType(WebView).props.onMessage({
      nativeEvent: { data: JSON.stringify({ type: "tiles-ready" }) },
    });
  });
  expect(jest.getTimerCount()).toBe(0);
  expect(JSON.stringify(renderer.toJSON())).not.toContain("Preparing map");
});
test("tile failures remain visible and malformed bridge messages are harmless", () => {
  act(() => {
    renderer = create(
      <MapViewWeb
        start={start}
        destination={destination}
        routeCoordinates={routeCoordinates}
      />,
    );
  });
  act(() => {
    renderer.root
      .findByType(WebView)
      .props.onMessage({ nativeEvent: { data: "bad JSON" } });
  });
  act(() => {
    renderer.root.findByType(WebView).props.onMessage({
      nativeEvent: { data: JSON.stringify({ type: "tiles-error" }) },
    });
  });
  expect(JSON.stringify(renderer.toJSON())).toContain(
    "estimate is still ready",
  );
  expect(jest.getTimerCount()).toBe(0);
});
