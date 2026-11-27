// The extension's site-wide settings (spec AIB-76n site-extension, "The install
// box"): the flag is on since T24, and the store URL is the listing the
// extension replaces.
import test from "node:test";
import assert from "node:assert/strict";
import { EXTENSION_LIVE, STORE_URL } from "./extension.js";
import { EXTENSION_ID } from "./extensionBridge.js";

test("the flag is on: the store update is submitted (T24)", () => {
  assert.equal(EXTENSION_LIVE, true);
});

test("the store URL is the listing for the extension's id", () => {
  assert.equal(STORE_URL, `https://chromewebstore.google.com/detail/${EXTENSION_ID}`);
});

// The install box (spec site-extension, "The install box"): desktop Chromium
// only, by userAgentData where it exists and the user agent where it does not.
import { isDesktopChromium, PROMO_KEY, PROMO_HIDE_MS, promoDismissed, dismissPromo } from "./extension.js";

const brands = (...names) => names.map((brand) => ({ brand, version: "130" }));
const UA = {
  chrome: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  edge: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0",
  opera: "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 OPR/115.0.0.0",
  vivaldi: "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Vivaldi/7.0",
  safari: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.1 Safari/605.1.15",
  firefox: "Mozilla/5.0 (Macintosh; Intel Mac OS X 14.7; rv:132.0) Gecko/20100101 Firefox/132.0",
  android: "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Mobile Safari/537.36",
  androidTablet: "Mozilla/5.0 (Linux; Android 14; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36",
  ios: "Mozilla/5.0 (iPhone; CPU iPhone OS 18_1 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) CriOS/130.0.6723.90 Mobile/15E148 Safari/604.1",
};

test("in: Chrome, Edge, Brave, Opera, Vivaldi and Arc on the desktop, by userAgentData", () => {
  const desktop = {
    chrome: brands("Google Chrome", "Chromium", "Not?A_Brand"),
    edge: brands("Microsoft Edge", "Chromium", "Not?A_Brand"),
    brave: brands("Brave", "Chromium", "Not?A_Brand"),
    opera: brands("Opera", "Chromium", "Not?A_Brand"),
    // Vivaldi and Arc report Chromium and Chrome's own brand.
    vivaldi: brands("Chromium", "Not?A_Brand"),
    arc: brands("Google Chrome", "Chromium", "Not?A_Brand"),
  };
  for (const [name, list] of Object.entries(desktop)) {
    assert.equal(isDesktopChromium({ userAgentData: { brands: list, mobile: false }, userAgent: UA.chrome }), true, name);
  }
});

test("out: Chromium on a phone or tablet, by userAgentData", () => {
  assert.equal(isDesktopChromium({ userAgentData: { brands: brands("Google Chrome", "Chromium"), mobile: true }, userAgent: UA.android }), false);
  // userAgentData wins over a desktop-looking UA (Chrome's "request desktop site").
  assert.equal(isDesktopChromium({ userAgentData: { brands: brands("Google Chrome", "Chromium"), mobile: true }, userAgent: UA.chrome }), false);
  assert.equal(isDesktopChromium({ userAgentData: { brands: brands("Some Browser"), mobile: false }, userAgent: UA.chrome }), false);
});

test("the user-agent fallback where userAgentData is missing", () => {
  for (const name of ["chrome", "edge", "opera", "vivaldi"]) assert.equal(isDesktopChromium({ userAgent: UA[name] }), true, name);
  for (const name of ["safari", "firefox", "android", "androidTablet", "ios"]) assert.equal(isDesktopChromium({ userAgent: UA[name] }), false, name);
});

test("no navigator (the prerender) is never Chromium", () => {
  assert.equal(isDesktopChromium(undefined), false);
  assert.equal(isDesktopChromium({}), false);
});

function memoryStorage(initial = {}) {
  const map = new Map(Object.entries(initial));
  return { getItem: (k) => (map.has(k) ? map.get(k) : null), setItem: (k, v) => map.set(k, String(v)), map };
}

test("Not now hides the box for 30 days, under aibytes-extension-promo", () => {
  assert.equal(PROMO_KEY, "aibytes-extension-promo");
  assert.equal(PROMO_HIDE_MS, 30 * 24 * 60 * 60 * 1000);
  const storage = memoryStorage();
  const now = Date.UTC(2026, 10, 26);
  assert.equal(promoDismissed(storage, now), false);
  dismissPromo(storage, now);
  assert.equal(storage.map.get(PROMO_KEY), String(now));
  assert.equal(promoDismissed(storage, now + PROMO_HIDE_MS - 1), true);
  assert.equal(promoDismissed(storage, now + PROMO_HIDE_MS), false);
});

test("a stored value that is not a time, or a time ahead of now, does not hide it forever", () => {
  const now = Date.UTC(2026, 10, 26);
  assert.equal(promoDismissed(memoryStorage({ [PROMO_KEY]: "junk" }), now), false);
  // A clock set back: a dismissal "in the future" counts from now, at most 30 days.
  assert.equal(promoDismissed(memoryStorage({ [PROMO_KEY]: String(now + 10 * PROMO_HIDE_MS) }), now), false);
});

test("storage that throws (blocked site data) shows the box and never throws", () => {
  const broken = { getItem() { throw new Error("blocked"); }, setItem() { throw new Error("blocked"); } };
  assert.equal(promoDismissed(broken, 1), false);
  assert.doesNotThrow(() => dismissPromo(broken, 1));
  assert.equal(promoDismissed(undefined, 1), false);
});
