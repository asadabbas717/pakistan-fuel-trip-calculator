const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");
const expoRequire = createRequire(require.resolve("expo/metro-config"));
const metroMain = expoRequire.resolve("@expo/metro-config");
const workerFile = path.join(
  path.dirname(metroMain),
  "transform-worker/postcss.js",
);
const { transformPostCssModule } = require(workerFile);

test("Expo CSS transformer remains compatible with patched PostCSS", async () => {
  const workerRequire = createRequire(workerFile);
  const [major, minor, patch] = workerRequire("postcss/package.json")
    .version.split(".")
    .map(Number);
  assert.equal(major, 8);
  assert.ok(
    minor > 5 || (minor === 5 && patch >= 23),
    "PostCSS must include the reviewed security fixes",
  );
  const cacheRoot = path.resolve(__dirname, "../.jest-cache");
  fs.mkdirSync(cacheRoot, { recursive: true });
  const projectRoot = fs.mkdtempSync(path.join(cacheRoot, "postcss-"));
  const config = path.join(projectRoot, "postcss.config.js");
  fs.writeFileSync(config, "module.exports = { plugins: [] };\n");
  try {
    const css = ".sample { color: red; }";
    const output = await transformPostCssModule(projectRoot, {
      src: css,
      filename: path.join(projectRoot, "style.css"),
    });
    assert.equal(output.hasPostcss, true);
    assert.equal(output.src, css);
  } finally {
    fs.unlinkSync(config);
    fs.rmdirSync(projectRoot);
  }
});
