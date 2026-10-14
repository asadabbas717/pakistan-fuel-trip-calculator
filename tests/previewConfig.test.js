const configure = require("../app.config");
const config = require("../app.json").expo;
const fs = require("node:fs");
const path = require("node:path");
const { Buffer } = require("node:buffer");
afterEach(() => {
  delete process.env.FUELTRIP_BUILD_VARIANT;
});
test("preview identity is isolated while preserving permissions and system-bar plugins", () => {
  process.env.FUELTRIP_BUILD_VARIANT = "preview";
  const preview = configure({ config });
  expect(preview.android.package).toBe("com.fueltrippk.preview");
  expect(preview.name).toBe("FuelTrip PK Preview");
  expect(preview.android.permissions).toEqual(config.android.permissions);
  expect(preview.plugins).toEqual(config.plugins);
  expect(config.android.package).toBeUndefined();
});
test("ordinary Expo Go and web configuration stays unchanged", () => {
  delete process.env.FUELTRIP_BUILD_VARIANT;
  expect(configure({ config })).toBe(config);
});
test("native splash has a real PNG source so resource linking can generate its logo", () => {
  const splash = config.plugins.find(
    (plugin) => Array.isArray(plugin) && plugin[0] === "expo-splash-screen",
  )[1];
  expect(typeof splash.image).toBe("string");
  const bytes = fs.readFileSync(
    path.resolve(path.dirname(require.resolve("../app.json")), splash.image),
  );
  expect(
    bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])),
  ).toBe(true);
  expect(bytes.readUInt32BE(16)).toBeGreaterThan(0);
  expect(bytes.readUInt32BE(20)).toBeGreaterThan(0);
});
