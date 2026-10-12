// SDK 56+ installs a lazy native fetch bridge; unit tests use explicit HTTP fakes.
Object.defineProperty(globalThis, "fetch", {
  configurable: true,
  writable: true,
  value: jest.fn(),
});
