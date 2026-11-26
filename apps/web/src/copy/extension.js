// The extension's copy on aibytes.io (spec AIB-76n site-extension): onb.* for
// the onboarding page and site.* for the install box, as agreed in
// docs/ux/prototypes/AIB-76n-extension/copy.js (E2, H3). Change them there first.
const COPY = {
  "onb.h1": "aiBytes_ extension is successfully installed.",
  "onb.sub": "A couple of quick steps to help you get the most out of it.",
  "onb.stepof": "Step {n} of {total}",
  "onb.s1.title": "Pin aiBytes_ to your toolbar",
  "onb.s1.body": "Chrome puts new extensions behind the puzzle icon. Pin aiBytes_ so today's edition is one click away.",
  "onb.pin.1": "Look at the top right of Chrome",
  "onb.pin.2": "Select the puzzle icon",
  "onb.pin.3": "Find aiBytes_ in the list",
  "onb.pin.4": "Select the pin",
  "onb.pin.5": "aiBytes_ is in your toolbar",
  "onb.s1.wait": "This step ticks itself when you pin.",
  "onb.s1.skip": "Skip",
  "onb.s1.done.before": "Pinned. Select",
  "onb.s1.done.after": "in the toolbar any time.",
  "onb.s2.title": "Sign in to save & bookmark items",
  "onb.optional": "Optional",
  "onb.s2.body1": "Items you bookmark will be stored in your account and accessible across devices.",
  "onb.s2.body2": "Without signing in, any saved items are only stored in the browser's local storage.",
  "onb.google": "Sign in with Google",
  "onb.subscribe": "Also subscribe me to the weekly newsletter",
  "onb.s2.skip": "Skip for now",
  "onb.s2.signedin": "Signed in as {name}. The extension is signed in too.",
  "onb.signedout": "You're signed out of aibytes.io and the extension.",
  "onb.s2.subscribed": "Subscribed to aiBytes_ weekly.",
  "onb.s2.continue": "Continue as {name}",
  "onb.s2.switch": "Use a different account",
  "onb.s2.extfail": "Signed in as {name}. The extension didn't sign in; open it and try again.",
  "onb.done.title": "You're set.",
  "onb.done.before": "Select",
  "onb.done.after": "in the toolbar to open today's edition.",
  "onb.done.synced": "Your stars sync to your account.",
  "onb.done.later": "You can sign in later from the popup.",
  "onb.done.cta": "Read today's edition on aibytes.io",
  "onb.ni.h1": "aiBytes_ for Chrome",
  "onb.ni.sub": "Today's edition, ranked, one click from your toolbar. Star items to read later on aibytes.io.",
  "onb.ni.fine": "Free. Reads only aibytes.io.",
  "site.cta": "Add to Chrome",
  "site.name": "aiBytes_ for Chrome",
  "site.h3.body": "Today's edition from your toolbar.",
  "site.notnow": "Not now",
  "site.link": "Chrome Extension",
};

/** The string for `key`, with {name}-style values filled in. Throws on an unknown key. */
export function t(key, values = {}) {
  if (!(key in COPY)) throw new Error(`No copy for ${key}`);
  return COPY[key].replace(/\{(\w+)\}/g, (match, name) => (name in values ? String(values[name]) : match));
}
