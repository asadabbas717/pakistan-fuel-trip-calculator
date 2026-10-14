const configure = require("../app.config");
const config = require("../app.json").expo;
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
