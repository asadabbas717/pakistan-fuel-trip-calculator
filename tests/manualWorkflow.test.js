jest.mock("react-native", () => ({
  View: "View",
  Text: "Text",
  TextInput: "TextInput",
  ScrollView: "ScrollView",
  Switch: "Switch",
  TouchableOpacity: "TouchableOpacity",
  ActivityIndicator: "ActivityIndicator",
  Platform: { OS: "web" },
  StyleSheet: { create: (s) => s },
}));
jest.mock("@react-navigation/native", () => ({
  useFocusEffect: (callback) => {
    const React = require("react");
    React.useEffect(callback, [callback]);
  },
}));
jest.mock("expo-location", () => ({
  requestForegroundPermissionsAsync: jest.fn(),
  getCurrentPositionAsync: jest.fn(),
}));
jest.mock("../src/services/routingService", () => ({ getRoute: jest.fn() }));
jest.mock("../src/services/fuelPriceService", () => ({
  getFuelPrices: jest.fn(async () => ({ petrol: 300, diesel: 310 })),
}));
jest.mock("../src/storage/vehicleStorage", () => ({
  getVehicles: jest.fn(async () => []),
}));
jest.mock("../src/storage/tripStorage", () => ({
  saveTrip: jest.fn(async (trip) => trip),
}));
jest.mock("../src/components/LocationInput", () => "LocationInput");
import React from "react";
import { create, act } from "react-test-renderer";
import HomeScreen from "../src/screens/HomeScreen";
import PrimaryButton from "../src/components/PrimaryButton";
import { getRoute } from "../src/services/routingService";
import { requestForegroundPermissionsAsync } from "expo-location";
import { saveTrip } from "../src/storage/tripStorage";
let renderer;
beforeEach(() => {
  jest.clearAllMocks();
  global.alert = jest.fn();
});
afterEach(() => {
  if (renderer) act(() => renderer.unmount());
});
test("manual calculation reaches results and saves history without routing or GPS", async () => {
  const navigation = { navigate: jest.fn() };
  await act(async () => {
    renderer = create(<HomeScreen navigation={navigation} />);
  });
  act(() =>
    renderer.root
      .findByProps({ accessibilityLabel: "Enter distance manually" })
      .props.onValueChange(true),
  );
  act(() =>
    renderer.root
      .findByProps({ accessibilityLabel: "One-way distance in kilometres" })
      .props.onChangeText("120"),
  );
  await act(async () =>
    renderer.root
      .findAllByType(PrimaryButton)
      .find((b) => b.props.title === "Calculate Fuel Cost")
      .props.onPress(),
  );
  expect(getRoute).not.toHaveBeenCalled();
  expect(requestForegroundPermissionsAsync).not.toHaveBeenCalled();
  expect(saveTrip).toHaveBeenCalledWith(
    expect.objectContaining({
      route: expect.objectContaining({ source: "manual" }),
      result: { distanceKm: 120, fuelNeeded: 10, totalCost: 3000 },
    }),
  );
  expect(navigation.navigate).toHaveBeenCalledWith(
    "Result",
    expect.any(Object),
  );
});
test("invalid manual distance never saves or requests a route", async () => {
  const navigation = { navigate: jest.fn() };
  await act(async () => {
    renderer = create(<HomeScreen navigation={navigation} />);
  });
  act(() =>
    renderer.root
      .findByProps({ accessibilityLabel: "Enter distance manually" })
      .props.onValueChange(true),
  );
  act(() =>
    renderer.root
      .findByProps({ accessibilityLabel: "One-way distance in kilometres" })
      .props.onChangeText("-120"),
  );
  await act(async () =>
    renderer.root
      .findAllByType(PrimaryButton)
      .find((b) => b.props.title === "Calculate Fuel Cost")
      .props.onPress(),
  );
  expect(saveTrip).not.toHaveBeenCalled();
  expect(getRoute).not.toHaveBeenCalled();
  expect(navigation.navigate).not.toHaveBeenCalled();
  expect(alert).toHaveBeenCalled();
});
