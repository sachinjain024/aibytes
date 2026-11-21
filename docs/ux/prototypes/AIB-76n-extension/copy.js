// Every reader-facing string in the AIB-76n prototype (see ../_kit/copy.js).
// The prototype's own narration (the review panel, "Opens in a new tab" notes)
// is not copy and is left out.
import { makeCopy } from "../_kit/copy.js";

export const COPY = makeCopy([
  // Popup
  { key: "pop.tab.today", where: "Popup › Tabs › Today tab (A1)", text: "Today", when: o => o.saved === "1" },
  { key: "pop.tab.saved", where: "Popup › Tabs › Saved tab (A1)", text: "Saved", when: o => o.saved === "1" },
  { key: "pop.savedbtn", where: "Popup › Header › Saved star button, screen-reader label (A2)", text: "Saved items", when: o => o.saved === "2" },
  { key: "pop.signin", where: "Popup › Header › Sign in link (C1)", text: "Sign in", when: o => o.signin === "1" },
  { key: "pop.prompt.before", where: "Popup › Signed-out prompt › Before the link (C2)", text: "Stars are kept in this browser.", when: o => o.signin === "2" },
  { key: "pop.prompt.link", where: "Popup › Signed-out prompt › Link (C2)", text: "Sign in on aibytes.io", when: o => o.signin === "2" },
  { key: "pop.prompt.after", where: "Popup › Signed-out prompt › After the link (C2)", text: "to keep them in your account.", when: o => o.signin === "2" },
  { key: "pop.empty.title", where: "Popup › Saved, empty › Title", text: "No saved items yet." },
  { key: "pop.empty.body", where: "Popup › Saved, empty › Body", text: "Select the ☆ on any row to save it. Saved items show here and in Saved on aibytes.io." },
  { key: "pop.end", where: "Popup › End of the list", text: "That's the {date} edition." },
  { key: "pop.foot.meta", where: "Popup › Footer › Edition and count", text: "{date} · {count} items" },
  { key: "pop.site", where: "Popup › Footer and gist bar › Link to the site", text: "Open on aibytes.io" },
  { key: "pop.back.today", where: "Popup › Gist view › Back, from Today", text: "← Today" },
  { key: "pop.back.saved", where: "Popup › Gist view › Back, from Saved", text: "← Saved" },
  { key: "pop.gist.save", where: "Popup › Gist view › Bottom bar, not saved (D2)", text: "Save", when: o => o.gist === "2" },
  { key: "pop.gist.saved", where: "Popup › Gist view › Bottom bar, saved (D2)", text: "Saved", when: o => o.gist === "2" },

  // Onboarding
  { key: "onb.h1", where: "Onboarding › Heading", text: "aiBytes_ extension is successfully installed." },
  { key: "onb.sub", where: "Onboarding › Under the heading", text: "Let's get started with a couple of quick steps to help you get the most out of it." },
  { key: "onb.stepof", where: "Onboarding › Step counter (E2)", text: "Step {n} of 2", when: o => o.flow === "2" },
  { key: "onb.s1.title", where: "Onboarding › Step 1 › Title", text: "Pin aiBytes_ to your toolbar" },
  { key: "onb.s1.body", where: "Onboarding › Step 1 › Body", text: "Chrome puts new extensions behind the puzzle icon. Pin aiBytes_ so today's edition is one click away." },
  { key: "onb.pin.1", where: "Onboarding › Step 1 › Animation caption 1", text: "Look at the top right of Chrome" },
  { key: "onb.pin.2", where: "Onboarding › Step 1 › Animation caption 2", text: "Select the puzzle icon" },
  { key: "onb.pin.3", where: "Onboarding › Step 1 › Animation caption 3", text: "Find aiBytes_ in the list" },
  { key: "onb.pin.4", where: "Onboarding › Step 1 › Animation caption 4", text: "Select the pin" },
  { key: "onb.pin.5", where: "Onboarding › Step 1 › Animation caption 5", text: "aiBytes_ is in your toolbar" },
  { key: "onb.s1.wait", where: "Onboarding › Step 1 › Under the animation", text: "This step ticks itself when you pin." },
  { key: "onb.s1.skip", where: "Onboarding › Step 1 › Skip (E2)", text: "Skip", when: o => o.flow === "2" },
  { key: "onb.s1.done.before", where: "Onboarding › Step 1 › Once pinned, before the icon", text: "Pinned. Select" },
  { key: "onb.s1.done.after", where: "Onboarding › Step 1 › Once pinned, after the icon", text: "in the toolbar any time." },
  { key: "onb.pointer", where: "Onboarding › Pointer at the toolbar (F2)", text: "Pin aiBytes_ here", when: o => o.pin === "2" },
  { key: "onb.s2.title", where: "Onboarding › Step 2 › Title", text: "Sign in to save & bookmark items" },
  { key: "onb.optional", where: "Onboarding › Step 2 › Tag", text: "Optional" },
  { key: "onb.s2.body1", where: "Onboarding › Step 2 › Body, line 1", text: "Items you bookmark will be stored in your account and accessible across devices." },
  { key: "onb.s2.body2", where: "Onboarding › Step 2 › Body, line 2", text: "Without signing in, any saved items are only stored in the browser's local storage." },
  { key: "onb.google", where: "Onboarding › Step 2 › Sign-in button", text: "Sign in with Google" },
  { key: "onb.subscribe", where: "Onboarding › Step 2 › Newsletter checkbox", text: "Also subscribe me to the weekly newsletter" },
  { key: "onb.s2.skip", where: "Onboarding › Step 2 › Skip", text: "Skip for now" },
  { key: "onb.s2.signedin", where: "Onboarding › Step 2 › Once signed in", text: "Signed in as {name}. The extension is signed in too." },
  { key: "onb.s2.subscribed", where: "Onboarding › Step 2 › Once subscribed", text: "Subscribed to aiBytes_ weekly." },
  { key: "onb.done.title", where: "Onboarding › Done › Title", text: "You're set." },
  { key: "onb.done.before", where: "Onboarding › Done › Before the icon", text: "Select" },
  { key: "onb.done.after", where: "Onboarding › Done › After the icon", text: "in the toolbar to open today's edition." },
  { key: "onb.done.synced", where: "Onboarding › Done › Signed in", text: "Your stars sync to your account." },
  { key: "onb.done.later", where: "Onboarding › Done › Signed out", text: "You can sign in later from the popup." },
  { key: "onb.done.cta", where: "Onboarding › Done › Button", text: "Read today's edition on aibytes.io" },
  { key: "onb.ni.h1", where: "Onboarding › Without the extension › Heading", text: "aiBytes_ for Chrome" },
  { key: "onb.ni.sub", where: "Onboarding › Without the extension › Body", text: "Today's edition, ranked, one click from your toolbar. Star items to read later on aibytes.io." },
  { key: "onb.ni.fine", where: "Onboarding › Without the extension › Small print", text: "Free. Reads only aibytes.io." },

  // aibytes.io
  { key: "site.cta", where: "aibytes.io › Install banner › Button", text: "Add to Chrome" },
  { key: "site.h1.before", where: "aibytes.io › Install banner › Text before the name (H1)", text: "Read the daily edition from your toolbar.", when: o => o.banner === "1" },
  { key: "site.name", where: "aibytes.io › Install banner › Extension name", text: "aiBytes_ for Chrome" },
  { key: "site.h1.after", where: "aibytes.io › Install banner › Text after the name (H1)", text: "is free.", when: o => o.banner === "1" },
  { key: "site.h2.body", where: "aibytes.io › Install banner › Row summary (H2)", text: "Today's edition, ranked, one click from your toolbar. Stars sync with Saved here.", when: o => o.banner === "2" },
  { key: "site.h3.body", where: "aibytes.io › Install banner › Sidebar box text (H3)", text: "Today's edition from your toolbar.", when: o => o.banner === "3" },
  { key: "site.notnow", where: "aibytes.io › Install banner › Dismiss (H2, H3)", text: "Not now", when: o => o.banner !== "1" },
  { key: "site.link", where: "aibytes.io › Sidebar › Footer link", text: "Chrome Extension" },
]);

export const t = COPY.t;
