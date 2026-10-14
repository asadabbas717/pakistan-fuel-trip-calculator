const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");

const root = path.resolve(__dirname, "..");
const nativeDirectory = path.join(root, "android");
if (fs.existsSync(nativeDirectory)) {
  const gradle = path.join(nativeDirectory, "app", "build.gradle");
  if (
    !fs.existsSync(gradle) ||
    !/applicationId\s+['"]com\.fueltrippk\.preview['"]/.test(
      fs.readFileSync(gradle, "utf8"),
    )
  ) {
    throw new Error(
      "An existing Android project is not the preview variant. Preserve it and use a separate checkout for preview builds.",
    );
  }
}
const packageFile = path.join(root, "package.json");
const originalPackage = fs.readFileSync(packageFile, "utf8");
let result;
try {
  result = spawnSync(
    process.execPath,
    [
      require.resolve("expo/bin/cli"),
      "prebuild",
      "--platform",
      "android",
      "--no-install",
    ],
    {
      cwd: root,
      stdio: "inherit",
      env: { ...process.env, FUELTRIP_BUILD_VARIANT: "preview" },
    },
  );
} finally {
  // Prebuild rewrites start scripts. Keep the existing Expo Go workflow intact.
  if (fs.readFileSync(packageFile, "utf8") !== originalPackage)
    fs.writeFileSync(packageFile, originalPackage);
}
if (result.error) throw result.error;
process.exitCode = result.status ?? 1;
if (result.status === 0) {
  const resources = path.join(nativeDirectory, "app", "src", "main", "res");
  const styles = fs.readFileSync(
    path.join(resources, "values", "styles.xml"),
    "utf8",
  );
  const hasSplashLogo = fs
    .readdirSync(resources)
    .filter((name) => name.startsWith("drawable"))
    .some((name) =>
      ["splashscreen_logo.png", "splashscreen_logo.xml"].some((file) =>
        fs.existsSync(path.join(resources, name, file)),
      ),
    );
  if (styles.includes("@drawable/splashscreen_logo") && !hasSplashLogo)
    throw new Error(
      "Generated splash theme references a missing logo. Configure a valid expo-splash-screen image before compiling the APK.",
    );
}
