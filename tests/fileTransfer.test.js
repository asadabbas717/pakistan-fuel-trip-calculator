jest.mock("react-native", () => ({ Platform: { OS: "web" } }));
jest.mock("expo-document-picker", () => ({ getDocumentAsync: jest.fn() }));
jest.mock("expo-sharing", () => ({}));
jest.mock("expo-file-system/legacy", () => ({
  cacheDirectory: "file:///cache/",
  getInfoAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));
import { Platform } from "react-native";
import { getDocumentAsync } from "expo-document-picker";
import {
  readAsStringAsync,
  deleteAsync,
  getInfoAsync,
} from "expo-file-system/legacy";
import { importBackupFile } from "../src/services/fileTransfer";
beforeEach(() => {
  jest.clearAllMocks();
  Platform.OS = "web";
});
test("cancelled file selection is harmless", async () => {
  getDocumentAsync.mockResolvedValue({ canceled: true });
  expect(await importBackupFile()).toBeNull();
  expect(readAsStringAsync).not.toHaveBeenCalled();
});
test("web reads the selected File rather than fetching a private URI", async () => {
  getDocumentAsync.mockResolvedValue({
    canceled: false,
    assets: [
      { name: "backup.json", size: 2, file: { text: async () => "{}" } },
    ],
  });
  expect(await importBackupFile()).toEqual({ name: "backup.json", text: "{}" });
});
test("oversized native files reject without reading or deleting the original document", async () => {
  Platform.OS = "android";
  getDocumentAsync.mockResolvedValue({
    canceled: false,
    assets: [{ name: "backup.json", uri: "content://original" }],
  });
  getInfoAsync.mockResolvedValue({ size: 2_000_001 });
  await expect(importBackupFile()).rejects.toThrow("2 MB");
  expect(readAsStringAsync).not.toHaveBeenCalled();
  expect(deleteAsync).not.toHaveBeenCalled();
});
