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
});
afterEach(() => {
  if (renderer) act(() => renderer.unmount());
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
test("old search response cannot replace edited input results", async () => {
  let resolve;
  searchPlace.mockReturnValue(
    new Promise((done) => {
      resolve = done;
    }),
  );
  act(() => {
    renderer = create(
      <LocationInput
        label="Origin"
        value={{ name: "Karachi" }}
        onSelect={jest.fn()}
      />,
    );
  });
  let request;
  await act(async () => {
    request = renderer.root
      .findAll(
        (node) =>
          node.props.accessibilityLabel === "Search Origin" &&
          typeof node.props.onPress === "function",
      )[0]
      .props.onPress();
  });
  act(() => {
    renderer.root.findByType(TextInput).props.onChangeText("Hyderabad");
  });
  await act(async () => {
    resolve([{ id: "1", name: "OLD RESULT", lat: 24, lon: 67 }]);
    await request;
  });
  expect(JSON.stringify(renderer.toJSON())).not.toContain("OLD RESULT");
});
