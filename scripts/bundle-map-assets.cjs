const fs = require("node:fs");
const path = require("node:path");
const root = process.argv[2];
if (!root)
  throw new Error("Pass the extracted leaflet@1.9.4 package directory.");
if (
  JSON.parse(fs.readFileSync(path.join(root, "package.json"), "utf8"))
    .version !== "1.9.4"
)
  throw new Error("Expected Leaflet 1.9.4.");
const js = fs
  .readFileSync(path.join(root, "dist/leaflet.js"), "utf8")
  .replace(/\/\/# sourceMappingURL=.*$/m, "")
  .replace(/<\/script/gi, "<\\/script");
const css = fs.readFileSync(path.join(root, "dist/leaflet.css"), "utf8");
fs.mkdirSync("src/vendor", { recursive: true });
fs.writeFileSync(
  "src/vendor/leafletAssets.js",
  "// Generated from leaflet@1.9.4. BSD-2-Clause; see LEAFLET_LICENSE.txt.\nexport const leafletJs = " +
    JSON.stringify(js) +
    ";\nexport const leafletCss = " +
    JSON.stringify(css) +
    ";\n",
);
fs.copyFileSync(path.join(root, "LICENSE"), "src/vendor/LEAFLET_LICENSE.txt");
