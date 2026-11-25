import test from "node:test";
import assert from "node:assert/strict";
import { onInstalledHandler } from "./install.js";

function fakeChrome() {
  const opened = [];
  return { opened, tabs: { create: ({ url }) => opened.push(url) } };
}

test("a fresh install opens the onboarding page once", () => {
  const chrome = fakeChrome();
  onInstalledHandler(chrome, "https://aibytes.io")({ reason: "install" });
  assert.deepEqual(chrome.opened, ["https://aibytes.io/extension-onboarding"]);
});

test("an update, a Chrome update or a shared-module update opens nothing", () => {
  const chrome = fakeChrome();
  const handler = onInstalledHandler(chrome, "https://aibytes.io");
  for (const reason of ["update", "chrome_update", "shared_module_update"]) handler({ reason, previousVersion: "26.1.15" });
  assert.deepEqual(chrome.opened, []);
});

test("a dev build opens the dev server's page", () => {
  const chrome = fakeChrome();
  onInstalledHandler(chrome, "http://localhost:5173")({ reason: "install" });
  assert.deepEqual(chrome.opened, ["http://localhost:5173/extension-onboarding"]);
});
