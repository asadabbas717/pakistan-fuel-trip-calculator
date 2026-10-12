import { serviceUrl } from "../src/utils/serviceUrl";
test("service configuration enforces HTTPS and excludes embedded credentials", () => {
  expect(serviceUrl(undefined, "https://example.test/search")).toBe(
    "https://example.test/search",
  );
  for (const url of [
    "http://example.test",
    "https://user:pass@example.test",
    "https://example.test?key=secret",
    "invalid",
  ])
    expect(() => serviceUrl(url)).toThrow();
});
