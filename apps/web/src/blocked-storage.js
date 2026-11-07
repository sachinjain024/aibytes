// A test helper, not a test (node --test runs *.test.js only).
// With site data blocked, even reading window.localStorage throws.
export function withBlockedStorage(run) {
  const previous = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  Object.defineProperty(globalThis, "localStorage", { configurable: true, get() { throw new Error("SecurityError: Access is denied"); } });
  try { return run(); } finally {
    if (previous) Object.defineProperty(globalThis, "localStorage", previous);
    else delete globalThis.localStorage;
  }
}
