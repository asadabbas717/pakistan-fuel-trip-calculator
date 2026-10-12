jest.mock("react-native", () => ({ Platform: { OS: "android" } }));
jest.mock("expo-location", () => ({ reverseGeocodeAsync: jest.fn() }));
jest.mock("../src/services/httpClient", () => ({ fetchJson: jest.fn() }));
import { Platform } from "react-native";
import { reverseGeocodeAsync } from "expo-location";
import { fetchJson } from "../src/services/httpClient";
import { resolveCurrentLocation } from "../src/services/currentLocationService";
const position = { coords: { latitude: 24.8, longitude: 67, accuracy: 12.3 } };
beforeEach(() => {
  jest.clearAllMocks();
  Platform.OS = "android";
});
test("native GPS becomes a readable address while retaining actual routing coordinates", async () => {
  reverseGeocodeAsync.mockResolvedValue([
    { district: "Saddar", city: "Karachi", region: "Sindh" },
  ]);
  expect(await resolveCurrentLocation(position)).toEqual({
    id: "current-location",
    name: "Saddar, Karachi, Sindh",
    lat: 24.8,
    lon: 67,
    accuracyMeters: 12,
  });
});
test("failed address lookup leaves GPS usable", async () => {
  reverseGeocodeAsync.mockRejectedValue(new Error("offline"));
  const value = await resolveCurrentLocation(position);
  expect(value.name).toContain("address unavailable");
  expect(value.lat).toBe(24.8);
});
test("web reverse lookup uses Photon and invalid coordinates never reach providers", async () => {
  Platform.OS = "web";
  fetchJson.mockResolvedValue({
    features: [
      { properties: { name: "Saddar", city: "Karachi", state: "Sindh" } },
    ],
  });
  expect((await resolveCurrentLocation(position)).name).toContain("Karachi");
  fetchJson.mockClear();
  await expect(
    resolveCurrentLocation({ coords: { latitude: 999, longitude: 67 } }),
  ).rejects.toThrow("invalid");
  expect(fetchJson).not.toHaveBeenCalled();
});
