jest.mock("react-native", () => ({
  View: "View",
  Text: "Text",
  TextInput: "TextInput",
  TouchableOpacity: "TouchableOpacity",
  ActivityIndicator: "ActivityIndicator",
  StyleSheet: { create: (styles) => styles },
}));
import React from "react";
import { act, create } from "react-test-renderer";
import { TextInput } from "react-native";
import LocationInput from "../src/components/LocationInput";
import { searchPlace } from "../src/services/geocodingService";
jest.mock("../src/services/geocodingService", () => ({
  searchPlace: jest.fn(),
}));
let renderer;
beforeEach(() => {
  global.IS_REACT_ACT_ENVIRONMENT = true;
  jest.clearAllMocks();
  searchPlace.mockResolvedValue([]);
});
afterEach(() => {
  if (renderer) act(() => renderer.unmount());
  jest.useRealTimers();
});
test("external location selection is displayed and editing clears the selection", async () => {
  const onSelect = jest.fn();
  act(() => {
    renderer = create(
      <LocationInput label="Origin" value={null} onSelect={onSelect} />,
    );
  });
  act(() => {
    renderer.update(
      <LocationInput
        label="Origin"
        value={{ name: "Current Location" }}
        onSelect={onSelect}
      />,
    );
  });
  expect(renderer.root.findByType(TextInput).props.value).toBe(
    "Current Location",
  );
  act(() => {
    renderer.root.findByType(TextInput).props.onChangeText("New place");
  });
  expect(onSelect).toHaveBeenCalledWith(null);
});
test("automatic search is debounced and stale responses cannot replace edited results", async () => {
  jest.useFakeTimers();
  let resolve;
  searchPlace.mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  act(() => {
    renderer = create(
      <LocationInput label="Origin" value={null} onSelect={jest.fn()} />,
    );
  });
  act(() => {
    renderer.root.findByType(TextInput).props.onChangeText("Ka");
  });
  await act(async () => {
    await jest.advanceTimersByTimeAsync(800);
  });
  expect(searchPlace).not.toHaveBeenCalled();
  act(() => {
    renderer.root.findByType(TextInput).props.onChangeText("Karachi");
  });
  await act(async () => {
    await jest.advanceTimersByTimeAsync(750);
  });
  expect(searchPlace).toHaveBeenCalledTimes(1);
  expect(JSON.stringify(renderer.toJSON())).not.toContain("Search Origin");
  const signal = searchPlace.mock.calls[0][1].signal;
  act(() => {
    renderer.root.findByType(TextInput).props.onChangeText("Hyderabad");
  });
  expect(signal.aborted).toBe(true);
  await act(async () => {
    resolve([{ id: "1", name: "OLD RESULT", lat: 24, lon: 67 }]);
  });
  expect(JSON.stringify(renderer.toJSON())).not.toContain("OLD RESULT");
});
test("selecting an automatic suggestion clears results and does not repeat search", async () => {
  jest.useFakeTimers();
  const place = { id: "1", name: "Karachi", lat: 24, lon: 67 };
  searchPlace.mockResolvedValue([place]);
  const onSelect = jest.fn();
  act(() => {
    renderer = create(
      <LocationInput label="Destination" value={null} onSelect={onSelect} />,
    );
  });
  act(() => {
    renderer.root.findByType(TextInput).props.onChangeText("Karachi");
  });
  await act(async () => {
    await jest.advanceTimersByTimeAsync(750);
  });
  act(() => {
    renderer.root
      .findByProps({ accessibilityLabel: "Select Karachi" })
      .props.onPress();
    renderer.update(
      <LocationInput label="Destination" value={place} onSelect={onSelect} />,
    );
  });
  await act(async () => {
    await jest.advanceTimersByTimeAsync(1500);
  });
  expect(onSelect).toHaveBeenCalledWith(place);
  expect(searchPlace).toHaveBeenCalledTimes(1);
  expect(renderer.root.findByType(TextInput).props.value).toBe("Karachi");
});
