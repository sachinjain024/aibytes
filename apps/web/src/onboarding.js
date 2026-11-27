// The onboarding page's steps (spec AIB-76n site-extension, E2). Pure, so
// node --test covers every transition without Chrome or Firebase.
// ExtensionOnboarding.jsx renders the state and runs the effects that dispatch:
// the extension's status, the pin port, the site's sign-in, the subscribe.
//
// view: loading → notinstalled | steps | signingout → signedout
// step: 1 (pin), 2 (sign in), 3 (done). `next` is the step that follows after
// the 900 ms pause; the component dispatches "advance" when it ends.

export function initialOnboarding(search = "") {
  const q = new URLSearchParams(search);
  return {
    view: "loading",
    start: q.get("step") === "signin" ? 2 : 1,
    signout: q.get("action") === "signout",
    step: 1,
    next: null,
    pinned: false,
    user: null, // the site's reader: { uid, name } or null
    extension: null, // the extension's sign-in as this reader: null, "ok" or "failed"
    box: true, // the newsletter checkbox, ticked by default
    pressed: false, // sign-in was pressed on this page
    wantsNewsletter: false, // the box as it was then
    newsletter: null, // null, "saving", "ok" or "failed"
    skipped: [],
  };
}

// Step 2 is finished once the extension is signed in as the site's reader
// and, if the box was ticked at sign-in, the subscribe has worked: done follows.
const step2Done = (s) => s.extension === "ok" && (!s.wantsNewsletter || s.newsletter === "ok");
const settle = (s) => ((s.view === "steps" || s.view === "signedout") && s.step === 2 && !s.next && step2Done(s) ? { ...s, next: 3 } : s);

export function onboardingReducer(state, action) {
  switch (action.type) {
    case "loaded": {
      if (state.view !== "loading") return state;
      const { status, user = null } = action;
      if (!status) return { ...state, view: "notinstalled" };
      // Honoured only when the extension asked for it: a plain GET never signs anyone out.
      if (state.signout && status.signoutPending === true) return { ...state, view: "signingout", step: 2, user };
      const extension = user && status.uid === user.uid ? "ok" : null;
      const pinned = status.pinned === true;
      return settle({ ...state, view: "steps", step: state.start, user, extension, pinned, next: state.start === 1 && pinned ? 2 : null });
    }
    case "signedOut":
      return state.view === "signingout" ? { ...state, view: "signedout", step: 2, user: null, extension: null } : state;
    case "pinned":
      return state.view === "steps" && state.step === 1 && !state.pinned ? { ...state, pinned: true, next: 2 } : state;
    case "advance":
      return state.next ? settle({ ...state, step: state.next, next: null }) : state;
    case "skip":
      if (state.step >= 3 || (state.view !== "steps" && state.view !== "signedout")) return state;
      return { ...state, view: "steps", step: state.step + 1, next: null, skipped: [...state.skipped, state.step] };
    case "box":
      return state.pressed ? state : { ...state, box: !state.box };
    case "signin":
      // `newsletter: false` where no box was on screen (Continue as, a different account).
      return { ...state, pressed: true, wantsNewsletter: action.newsletter === false ? false : state.box };
    case "signinFailed":
      return { ...state, pressed: false, wantsNewsletter: false };
    case "user":
      return action.user ? settle({ ...state, user: action.user }) : { ...state, user: null, extension: null };
    case "extension":
      return settle({ ...state, extension: action.ok ? "ok" : "failed" });
    case "subscribing":
      return { ...state, newsletter: "saving" };
    case "subscribed":
      return settle({ ...state, newsletter: action.ok ? "ok" : "failed" });
    default:
      return state;
  }
}

const STEP_NAMES = { 1: "pin", 2: "signin" };

/**
 * The analytics events one state change sends (listed in
 * docs/specs/AIB-145y-gist-analytics.md): a step finishing, done or skipped,
 * and the newsletter subscribe settling. Never the reader's name, email or uid.
 */
export function onboardingEvents(prev, next) {
  const events = [];
  if (prev.view !== "loading" && next.step === prev.step + 1 && STEP_NAMES[prev.step]) {
    events.push(["extension-onboarding-step", { step: STEP_NAMES[prev.step], outcome: next.skipped.includes(prev.step) ? "skipped" : "done" }]);
  }
  if (prev.newsletter === "saving" && (next.newsletter === "ok" || next.newsletter === "failed")) {
    events.push(["extension-onboarding-subscribe", { outcome: next.newsletter }]);
  }
  return events;
}
