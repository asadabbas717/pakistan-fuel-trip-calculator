const test = require("node:test");
const assert = require("node:assert/strict");
const { generateKeyPairSync } = require("node:crypto");
const { createRequire } = require("node:module");
const { verifyPatches } = require("../scripts/dependency-patches.cjs");
const { assessAudit } = require("../scripts/audit-security.cjs");
const manifest = require("../security/dependency-patches.json");
const lock = require("../package-lock.json");
const path = require("node:path");
const fs = require("node:fs");

test("every installed source backport matches its reviewed checksum", () => {
  verifyPatches();
});

test("verification rejects a changed or missing patched source file", () => {
  const cache = path.resolve(__dirname, "../.jest-cache");
  fs.mkdirSync(cache, { recursive: true });
  const fixture = fs.mkdtempSync(path.join(cache, "security-"));
  const packages = {};
  try {
    for (const patch of manifest.patches) {
      const location = "node_modules/" + patch.name;
      const target = path.join(fixture, location);
      packages[location] = { version: patch.version };
      fs.mkdirSync(path.dirname(path.join(target, patch.file)), {
        recursive: true,
      });
      fs.writeFileSync(
        path.join(target, "package.json"),
        JSON.stringify({ version: patch.version }),
      );
      fs.copyFileSync(
        path.resolve(__dirname, "..", location, patch.file),
        path.join(target, patch.file),
      );
    }
    fs.writeFileSync(
      path.join(fixture, "package-lock.json"),
      JSON.stringify({ packages }),
    );
    verifyPatches({ projectRoot: fixture });
    const file = path.join(fixture, "node_modules/node-forge/lib/rsa.js");
    fs.appendFileSync(file, "\n// unexpected modification\n");
    assert.throws(
      () => verifyPatches({ projectRoot: fixture }),
      /missing or modified/,
    );
    assert.throws(
      () => verifyPatches({ projectRoot: fixture, apply: true }),
      /Unexpected upstream source/,
    );
    fs.unlinkSync(file);
    assert.throws(
      () => verifyPatches({ projectRoot: fixture }),
      /missing or modified/,
    );
  } finally {
    // This newly created test fixture is contained under the project test cache.
    assert.equal(path.dirname(path.resolve(fixture)), cache);
    fs.rmSync(fixture, { recursive: true, force: true });
  }
});

for (const location of Object.keys(lock.packages).filter((location) =>
  location.endsWith("node_modules/braces"),
)) {
  test(`${location}: ordinary globs work and deep strings/ASTs are rejected`, () => {
    const braces = require(path.resolve(__dirname, "..", location));
    assert.deepEqual(braces.expand("src/{screens,services}/*.js"), [
      "src/screens/*.js",
      "src/services/*.js",
    ]);
    const pattern = "{".repeat(1500) + "a,b" + "}".repeat(1500);
    for (const method of ["parse", "compile", "expand", "stringify"])
      assert.throws(
        () => braces[method](pattern),
        /nesting exceeds safe limit/,
      );
    let ast = { type: "text", value: "leaf" };
    for (let i = 0; i < 1500; i++) ast = { type: "root", nodes: [ast] };
    for (const method of ["compile", "expand", "stringify"])
      assert.throws(() => braces[method](ast), /nesting exceeds safe limit/);
    const cyclic = { type: "root", nodes: [] };
    cyclic.nodes.push(cyclic);
    assert.throws(() => braces.compile(cyclic), /nesting exceeds safe limit/);
  });
}

test("RSA verifies valid digests and rejects extra nested algorithm elements", () => {
  const forge = require("node-forge");
  const { privateKey: pem } = generateKeyPairSync("rsa", {
    modulusLength: 1024,
    publicExponent: 3,
    privateKeyEncoding: { type: "pkcs1", format: "pem" },
    publicKeyEncoding: { type: "pkcs1", format: "pem" },
  });
  const privateKey = forge.pki.privateKeyFromPem(pem);
  const publicKey = forge.pki.setRsaPublicKey(privateKey.n, privateKey.e);
  const digest = forge.md.sha256
    .create()
    .update("SafarWise regression")
    .digest()
    .getBytes();
  const { asn1 } = forge;
  const node = (type, value, constructed = false) =>
    asn1.create(asn1.Class.UNIVERSAL, type, constructed, value);
  const oid = () =>
    node(asn1.Type.OID, asn1.oidToDer(forge.oids.sha256).getBytes());
  const nil = () => node(asn1.Type.NULL, "");
  const extra = () => node(asn1.Type.OCTETSTRING, "garbage");
  for (const children of [[oid()], [oid(), nil()]]) {
    const der = asn1
      .toDer(
        node(
          asn1.Type.SEQUENCE,
          [
            node(asn1.Type.SEQUENCE, children, true),
            node(asn1.Type.OCTETSTRING, digest),
          ],
          true,
        ),
      )
      .getBytes();
    assert.equal(publicKey.verify(digest, privateKey.sign(der, "NONE")), true);
  }
  for (const children of [
    [oid(), nil(), extra()],
    [oid(), extra()],
    [oid(), nil(), nil()],
    [oid(), node(asn1.Type.NULL, "garbage")],
  ]) {
    const der = asn1
      .toDer(
        node(
          asn1.Type.SEQUENCE,
          [
            node(asn1.Type.SEQUENCE, children, true),
            node(asn1.Type.OCTETSTRING, digest),
          ],
          true,
        ),
      )
      .getBytes();
    assert.throws(
      () => publicKey.verify(digest, privateKey.sign(der, "NONE")),
      /DigestInfo/,
    );
  }
});

test("formatting preserves ordinary output and rejects excessive width/precision", () => {
  const { sprintf, vsprintf } = require("sprintf-js");
  assert.equal(sprintf("%s %.2f", "Rs.", 12.345), "Rs. 12.35");
  assert.equal(vsprintf("%04d", [12]), "0012");
  for (const fmt of ["%999999999s", "%.999999999f", "%.999999999j"])
    assert.throws(() => sprintf(fmt, 1), /exceeds safe limit/);
});

test("xcode generates its expected 24-character IDs with patched UUID", () => {
  const xcode = require("xcode");
  const xcodeRequire = createRequire(require.resolve("xcode"));
  assert.equal(xcodeRequire("uuid/package.json").version, "11.1.1");
  const project = xcode.project("test.pbxproj");
  project.hash = { project: { objects: {} } };
  assert.match(project.generateUuid(), /^[A-F0-9]{24}$/);
  const uuid = xcodeRequire("uuid");
  assert.throws(
    () => uuid.v5("test", uuid.v5.DNS, new Uint8Array(1)),
    RangeError,
  );
});

test("security gate blocks unknown advisories and expired backport reviews", () => {
  const report = { metadata: {}, vulnerabilities: {} };
  const id = Object.keys(manifest.advisories)[0];
  report.vulnerabilities.braces = {
    via: [
      {
        name: "braces",
        title: "known",
        url: `https://github.com/advisories/${id}`,
      },
    ],
  };
  assert.equal(
    assessAudit(report, { now: new Date("2026-10-15") }).findings.length,
    0,
  );
  assert.equal(
    assessAudit(report, { now: new Date("2026-11-16") }).findings.length,
    1,
  );
  report.vulnerabilities.braces.via[0].url =
    "https://github.com/advisories/GHSA-new-new-new";
  assert.equal(assessAudit(report).findings.length, 1);
  assert.throws(
    () => assessAudit({ error: "network failure" }),
    /complete report/,
  );
});
