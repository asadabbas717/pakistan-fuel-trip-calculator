const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const manifest = require("../security/dependency-patches.json");
const root = path.resolve(__dirname, "..");
const digest = (value) =>
  crypto.createHash("sha256").update(value).digest("hex");
const normalize = (value) => value.replace(/\r\n/g, "\n");

function verifyPatches({ apply = false, projectRoot = root } = {}) {
  const lock = JSON.parse(
    fs.readFileSync(path.join(projectRoot, "package-lock.json"), "utf8"),
  );
  for (const name of new Set(manifest.patches.map((patch) => patch.name))) {
    const locations = Object.keys(lock.packages).filter(
      (location) =>
        location.endsWith("/node_modules/" + name) ||
        location === "node_modules/" + name,
    );
    if (!locations.length)
      throw new Error(`Missing patched dependency: ${name}`);
    for (const location of locations) {
      const directory = path.join(projectRoot, location);
      const version = JSON.parse(
        fs.readFileSync(path.join(directory, "package.json"), "utf8"),
      ).version;
      for (const patch of manifest.patches.filter(
        (entry) => entry.name === name,
      )) {
        if (version !== patch.version)
          throw new Error(`Review security backport for ${name}@${version}`);
        const file = path.join(directory, patch.file);
        const current = fs.existsSync(file)
          ? normalize(fs.readFileSync(file, "utf8"))
          : null;
        if (current !== null && digest(current) === patch.afterSha256) continue;
        if (!apply)
          throw new Error(`Security backport missing or modified: ${file}`);
        if (
          (patch.beforeSha256 === null && current !== null) ||
          (patch.beforeSha256 !== null &&
            (current === null || digest(current) !== patch.beforeSha256))
        )
          throw new Error(
            `Unexpected upstream source; refusing to patch ${file}`,
          );
        let output = patch.content ?? current;
        for (const replacement of patch.replacements || []) {
          if (output.split(replacement.from).length - 1 !== replacement.count)
            throw new Error(`Security patch context mismatch: ${file}`);
          output = output.split(replacement.from).join(replacement.to);
        }
        if (digest(output) !== patch.afterSha256)
          throw new Error(`Security patch checksum mismatch: ${file}`);
        fs.writeFileSync(file, output);
      }
    }
  }
}

module.exports = { verifyPatches };
if (require.main === module) {
  verifyPatches({ apply: true });
  console.log("Verified and applied pinned dependency security backports.");
}
