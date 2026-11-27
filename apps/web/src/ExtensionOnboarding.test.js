// The onboarding page's markup (spec AIB-76n site-extension, "The onboarding
// page"): states the reducer reaches, server-rendered, so a prop a branch
// reads but never receives fails here rather than blanking the live page.
import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { loadJsx } from "./loadJsx.js";
import { initialOnboarding, onboardingReducer as reduce } from "./onboarding.js";

const { ExtensionOnboarding } = await loadJsx(new URL("./ExtensionOnboarding.jsx", import.meta.url));
const ADA = { uid: "u1", name: "Ada" };
const STATUS = { installed: true, pinned: true, uid: null, signoutPending: false };
const render = (state, on = {}) => renderToStaticMarkup(React.createElement(ExtensionOnboarding, { state, dispatch() {}, theme: "light", onToggleTheme() {}, on }));

// Signed in on step 2 with the box ticked; the extension synced, the subscribe failed.
const failedSubscribe = (start) => ({ ...reduce(initialOnboarding(start), { type: "loaded", status: STATUS, user: null }), step: 2, user: ADA, pressed: true, extension: "ok", wantsNewsletter: true, newsletter: "failed" });

test("a failed subscribe on step 2 renders its retry, not a crash", () => {
  const html = render(failedSubscribe("?step=signin"), { retrySubscribe() {} });
  assert.match(html, /role="alert"/);
  assert.match(html, /ldg-onb-skip/);
});

test("a failed subscribe on the done view renders its retry too", () => {
  const html = render({ ...failedSubscribe(""), step: 3 }, { retrySubscribe() {} });
  assert.match(html, /role="alert"/);
});
