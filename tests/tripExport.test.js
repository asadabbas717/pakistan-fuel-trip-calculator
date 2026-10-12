jest.mock("react-native", () => ({
  Platform: { OS: "android" },
  Share: { share: jest.fn() },
}));
jest.mock("expo-print", () => ({
  printToFileAsync: jest.fn(async () => ({ uri: "file:///trip.pdf" })),
}));
jest.mock("expo-sharing", () => ({
  isAvailableAsync: jest.fn(async () => true),
  shareAsync: jest.fn(),
}));
jest.mock("expo-file-system/legacy", () => ({
  cacheDirectory: "file:///cache/",
  deleteAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  readDirectoryAsync: jest.fn(async () => []),
  copyAsync: jest.fn(),
}));
jest.mock("expo-document-picker", () => ({}));
import { tripHtml, exportTripPdf } from "../src/services/tripExportService";
import { shareAsync } from "expo-sharing";
import { deleteAsync } from "expo-file-system/legacy";
import { Platform } from "react-native";
import { createManualTrip } from "../src/services/manualTripService";
const trip = createManualTrip({
  distanceKm: "100",
  startName: '<script>alert("x")</script>',
  destinationName: "کراچی",
  fuelType: "petrol",
  fuelPrice: 300,
  averageKmPerLiter: 10,
  isReturnTrip: true,
});
test("PDF template escapes user labels and contains actual trip assumptions", () => {
  const html = tripHtml(trip);
  expect(html).not.toContain("<script>alert");
  expect(html).toContain("&lt;script&gt;");
  expect(html).toContain("کراچی");
  expect(html).toContain("Return trip");
  expect(html).toContain("200.00 km");
});
test("temporary PDF is cleaned even if sharing fails", async () => {
  shareAsync.mockRejectedValueOnce(new Error("share failed"));
  await expect(exportTripPdf(trip)).rejects.toThrow("share failed");
  expect(deleteAsync).toHaveBeenCalledWith("file:///trip.pdf", {
    idempotent: true,
  });
});
test("web opens and prints a complete document without calling native export", async () => {
  Platform.OS = "web";
  const preview = {
    document: { write: jest.fn(), close: jest.fn() },
    focus: jest.fn(),
    print: jest.fn(),
  };
  global.window = { open: jest.fn(() => preview) };
  await exportTripPdf(trip);
  expect(preview.document.write).toHaveBeenCalledWith(
    expect.stringContaining("FuelTrip PK estimate"),
  );
  expect(preview.document.close).toHaveBeenCalled();
  expect(preview.print).toHaveBeenCalled();
  Platform.OS = "android";
  delete global.window;
});
