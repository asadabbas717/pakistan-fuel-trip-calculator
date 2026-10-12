jest.mock("react-native", () => ({ Platform: { OS: "web" } }));
jest.mock("expo-file-system/legacy", () => ({
  documentDirectory: "file:///docs/",
  getInfoAsync: jest.fn(),
  readAsStringAsync: jest.fn(),
  makeDirectoryAsync: jest.fn(),
  writeAsStringAsync: jest.fn(),
  moveAsync: jest.fn(),
  copyAsync: jest.fn(),
  deleteAsync: jest.fn(),
}));
import { Platform } from "react-native";
import * as FS from "expo-file-system/legacy";
import {
  getStoredItem,
  setStoredItem,
  removeStoredItem,
} from "../src/storage/appStorage";
const KEY = "FUEL_TRIP_PK_HISTORY";
beforeEach(() => {
  jest.resetAllMocks();
  Platform.OS = "web";
  global.localStorage = {
    getItem: jest.fn(),
    setItem: jest.fn(),
    removeItem: jest.fn(),
  };
});
test("browser quota and denied access never report successful save", async () => {
  localStorage.setItem.mockImplementation(() => {
    throw new Error("quota");
  });
  await expect(setStoredItem(KEY, "[]")).rejects.toThrow("quota");
  localStorage.removeItem.mockImplementation(() => {
    throw new Error("denied");
  });
  await expect(removeStoredItem(KEY)).rejects.toThrow("denied");
});
test("invalid keys are rejected before any persistence access", async () => {
  await expect(setStoredItem("../escape", "x")).rejects.toThrow("key");
  expect(localStorage.setItem).not.toHaveBeenCalled();
});
test("native failed temporary writes leave the previous file untouched", async () => {
  Platform.OS = "ios";
  FS.writeAsStringAsync.mockRejectedValue(new Error("disk full"));
  await expect(setStoredItem(KEY, "[]")).rejects.toThrow("disk full");
  expect(FS.moveAsync).not.toHaveBeenCalled();
});
test("native overwrite keeps a recovery copy and reads it if the main file is missing", async () => {
  Platform.OS = "ios";
  FS.getInfoAsync.mockResolvedValue({ exists: true });
  await setStoredItem(KEY, "[]");
  expect(FS.copyAsync).toHaveBeenCalled();
  expect(FS.moveAsync).toHaveBeenCalled();
  FS.getInfoAsync
    .mockResolvedValueOnce({ exists: false })
    .mockResolvedValueOnce({ exists: true });
  FS.readAsStringAsync.mockResolvedValue("old data");
  expect(await getStoredItem(KEY)).toBe("old data");
});
