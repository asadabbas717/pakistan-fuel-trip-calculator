const fs = require("node:fs");
const path = require("node:path");
const { spawnSync } = require("node:child_process");
const { verifyPatches } = require("./dependency-patches.cjs");
const manifest = require("../security/dependency-patches.json");

function assessAudit(report, { now = new Date() } = {}) {
  if (report.error || !report.vulnerabilities || !report.metadata)
    throw new Error("Security audit did not return a complete report.");
  const findings = [];
  const remediated = new Set();
  for (const [name, vulnerability] of Object.entries(report.vulnerabilities)) {
    for (const advisory of vulnerability.via) {
      if (typeof advisory === "string") {
        if (!report.vulnerabilities[advisory])
          findings.push(`Unresolved dependency chain: ${name} -> ${advisory}`);
        continue;
      }
      const id = advisory.url?.match(
        /^https:\/\/github\.com\/advisories\/(GHSA-[a-z0-9-]+)$/,
      )?.[1];
      const reviewed = manifest.advisories[id];
      if (!reviewed || reviewed.name !== name || advisory.name !== name) {
        findings.push(`${name}: ${advisory.title} (${advisory.url})`);
      } else if (now >= new Date(manifest.reviewBy + "T00:00:00Z")) {
        findings.push(`Security backport review expired: ${id}`);
      } else {
        remediated.add(id);
      }
    }
  }
  return { findings, remediated: [...remediated] };
}

module.exports = { assessAudit };
if (require.main === module) {
  // npm audit only sees registry versions, not the source backports. Never
  // accept their advisories until every installed copy passes checksum checks
  // and the exploit regression suite passes against those installed copies.
  verifyPatches();
  const tests = spawnSync(
    process.execPath,
    ["--test", "tests/dependency-security.test.cjs"],
    { stdio: "inherit", timeout: 30000 },
  );
  if (tests.status !== 0) process.exit(1);
  const audit = spawnSync(
    process.execPath,
    [process.env.npm_execpath, "audit", "--omit=dev", "--json"],
    { encoding: "utf8", maxBuffer: 8 * 1024 * 1024, timeout: 180000 },
  );
  if (![0, 1].includes(audit.status))
    throw new Error("npm audit could not complete.");
  const report = JSON.parse(audit.stdout);
  fs.mkdirSync(".expo", { recursive: true });
  fs.writeFileSync(
    path.join(".expo", "security-audit.json"),
    JSON.stringify(report, null, 2),
  );
  const result = assessAudit(report);
  console.log(
    `Registry findings: ${report.metadata.vulnerabilities.total} affected entries (including dependency chains).`,
  );
  console.log(
    `Verified source backports: ${result.remediated.join(", ") || "none"}. Review by ${manifest.reviewBy}.`,
  );
  if (result.findings.length) {
    console.error(result.findings.join("\n"));
    process.exit(1);
  }
  console.log(
    "Security gate passed: all reported root advisories remediated; raw registry report retained in .expo/security-audit.json.",
  );
}
