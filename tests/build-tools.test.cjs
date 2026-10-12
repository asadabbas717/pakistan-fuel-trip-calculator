const test = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const { createRequire } = require("node:module");
const workerFile =
  require.resolve("@expo/metro-config/build/transform-worker/postcss");
const { transformPostCssModule } = require(workerFile);

test("patched PostCSS preserves the SDK 54 CSS transformer contract", async () => {
  const workerRequire = createRequire(workerFile);
  assert.equal(workerRequire("postcss/package.json").version, "8.5.23");
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
