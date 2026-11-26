// aibytes.io/extension-onboarding (spec AIB-76n site-extension; design E2, F1,
// G1). The page the extension opens on install: the site's header and one
// centred column, no sidebar. onboarding.js holds the steps; this file draws
// them, as Ledger's kit (ui_kits/aibytes-app/Onboarding.jsx) does.
//
// useOnboarding reads the extension's status and the site's reader once, and
// runs the 900 ms pause before the next step; useOnboardingEffects does the
// rest: the pin, the sign-in, the subscribe, the sign-out and the events.
import React from "react";
import { AppHeader } from "@aibytes/design-system/components/navigation/AppHeader.jsx";
import { Button } from "@aibytes/design-system/components/forms/Button.jsx";
import { ExtensionIcon } from "@aibytes/design-system/components/extension/ExtensionIcon.jsx";
import { OnboardingStatus, OnboardingStep } from "@aibytes/design-system/components/extension/OnboardingStep.jsx";
import { PinAnimation } from "@aibytes/design-system/components/extension/PinAnimation.jsx";
import { initialOnboarding, onboardingEvents, onboardingReducer } from "./onboarding.js";
import { EXTENSION_ID, extensionStatus, sendToExtension } from "./extensionBridge.js";
import { track } from "./analytics.js";
import { EXTENSION_LIVE, STORE_URL } from "./extension.js";
import { t } from "./copy/extension.js";
import { PROMPT_COPY } from "./newsletterPrompt.js";

export const ADVANCE_MS = 900;
const PIN_CAPTIONS = [1, 2, 3, 4, 5].map((n) => t(`onb.pin.${n}`));
const LABELS = { stepOf: t("onb.stepof"), optional: t("onb.optional") };
const CHECK = (
  <span className="ldg-onb__check" aria-hidden="true">
    <svg width="18" height="18" viewBox="0 0 10 10"><path d="M2 5.2l2 2L8 3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
  </span>
);

/** The page's state and dispatch: the status and the site's reader are read once the session is known. */
export function useOnboarding(user, { search = globalThis.location?.search ?? "", status = extensionStatus } = {}) {
  const [state, dispatch] = React.useReducer(onboardingReducer, search, initialOnboarding);
  const known = user !== undefined;
  React.useEffect(() => {
    if (!known) return undefined;
    let live = true;
    status().then((s) => { if (live) dispatch({ type: "loaded", status: s, user: readerOf(user) }); });
    return () => { live = false; };
  }, [known]); // eslint-disable-line react-hooks/exhaustive-deps
  React.useEffect(() => {
    if (!state.next) return undefined;
    const id = setTimeout(() => dispatch({ type: "advance" }), ADVANCE_MS);
    return () => clearTimeout(id);
  }, [state.next]);
  return [state, dispatch];
}

export const PIN_POLL_MS = 2000;

/** The site's reader as the steps need it, or null: never the email. */
const readerOf = (user) => (user ? { uid: user.uid, name: user.name } : null);

/**
 * What the page does (T19), given the site's account (AccountContext):
 * listens for the pin, follows the site's reader and the extension's sign-in,
 * subscribes when the box was ticked, carries out a sign-out the popup asked
 * for, and sends the analytics events. Returns the handlers for `on`.
 */
export function useOnboardingEffects(state, dispatch, account, {
  runtime = globalThis.chrome?.runtime,
  status = extensionStatus,
  send = sendToExtension,
  track: send_event = track,
} = {}) {
  const { user, extensionSync, syncExtension, subscribeWith, signIn, signOut } = account;

  // Step 1: the extension's "pin" port posts each toolbar change (Chrome 130+);
  // a status poll every 2 s covers a Chrome whose port stays quiet.
  const waitingForPin = state.view === "steps" && state.step === 1 && !state.pinned;
  React.useEffect(() => {
    if (!waitingForPin) return undefined;
    let port = null;
    try {
      port = runtime?.connect?.(EXTENSION_ID, { name: "pin" }) ?? null;
      port?.onMessage.addListener((message) => { if (message?.pinned === true) dispatch({ type: "pinned" }); });
    } catch {
      port = null;
    }
    const id = setInterval(() => status().then((s) => { if (s?.pinned === true) dispatch({ type: "pinned" }); }), PIN_POLL_MS);
    return () => {
      clearInterval(id);
      try { port?.disconnect(); } catch { /* already gone */ }
    };
  }, [waitingForPin]); // eslint-disable-line react-hooks/exhaustive-deps

  // The site's reader, after the page has loaded with the first one.
  const reader = readerOf(user);
  const readerUid = reader?.uid ?? null;
  React.useEffect(() => {
    if (state.view === "loading" || state.view === "signingout" || user === undefined) return;
    if ((state.user?.uid ?? null) !== readerUid) dispatch({ type: "user", user: reader });
  }, [readerUid, state.view]); // eslint-disable-line react-hooks/exhaustive-deps

  // After any reconcile for this reader, ask the extension who it is signed in as.
  React.useEffect(() => {
    if (!readerUid || extensionSync?.uid !== readerUid || extensionSync.action === "absent") return undefined;
    let live = true;
    status().then((s) => { if (live) dispatch({ type: "extension", ok: s?.uid === readerUid }); });
    return () => { live = false; };
  }, [extensionSync]); // eslint-disable-line react-hooks/exhaustive-deps

  // The newsletter, when the box was ticked at sign-in.
  const subscribe = React.useCallback(() => {
    dispatch({ type: "subscribing" });
    subscribeWith("extension-onboarding", "extension-onboarding").then((result) => dispatch({ type: "subscribed", ok: result === "ok" }));
  }, [subscribeWith, dispatch]);
  React.useEffect(() => {
    if (state.wantsNewsletter && state.user && state.newsletter === null) subscribe();
  }, [state.wantsNewsletter, state.user?.uid, state.newsletter]); // eslint-disable-line react-hooks/exhaustive-deps

  // The popup's Sign out (only with signoutPending, see onboarding.js): the
  // site signs out, then { type: "signout" } clears the extension's flag.
  React.useEffect(() => {
    if (state.view !== "signingout") return;
    Promise.resolve(signOut()).catch(() => {}).then(() => send({ type: "signout" })).then(() => dispatch({ type: "signedOut" }));
  }, [state.view]); // eslint-disable-line react-hooks/exhaustive-deps

  // Analytics: each step finishing, and the subscribe settling.
  const previous = React.useRef(state);
  React.useEffect(() => {
    for (const [name, data] of onboardingEvents(previous.current, state)) send_event(name, data);
    previous.current = state;
  }, [state]); // eslint-disable-line react-hooks/exhaustive-deps

  const startSignIn = React.useCallback((options, newsletter) => {
    dispatch({ type: "signin", newsletter });
    signIn(options).then((r) => { if (r?.status !== "ok") dispatch({ type: "signinFailed" }); });
  }, [signIn, dispatch]);

  return {
    // After a sign-out the reader may want another account: Google shows its picker.
    signIn: () => startSignIn({ selectAccount: state.view === "signedout" }),
    // Signed in on the site already: a fresh token for this reader.
    continueAs: () => { dispatch({ type: "signin", newsletter: false }); syncExtension(readerUid); },
    // Both in the click, so the popup is not blocked; the reconcile follows the new reader.
    switchAccount: () => { signOut(); startSignIn({ selectAccount: true }, false); },
    retrySubscribe: subscribe,
  };
}

/**
 * state/dispatch: useOnboarding. headerProps: the site header's account props.
 * on: { signIn, continueAs, switchAccount, retrySubscribe }, the effects T19 wires.
 */
export function ExtensionOnboarding({ state, dispatch, theme, onToggleTheme, githubUrl, headerProps = {}, on = {} }) {
  // A step change removes the control that had focus; keyboard focus would fall
  // to the body. Put it on the column, so the next Tab reaches the new step.
  const main = React.useRef(null);
  const shown = `${state.view}:${state.step}`;
  const first = React.useRef(shown);
  React.useEffect(() => {
    if (shown === first.current) return;
    const active = document.activeElement;
    if (!active || active === document.body) main.current?.focus({ preventScroll: true });
  }, [shown]);
  return (
    <div className="app-shell redesign" data-theme={theme}>
      <AppHeader theme={theme} onToggleTheme={onToggleTheme} githubUrl={githubUrl} {...headerProps} />
      <main id="main" className="ldg-onb" tabIndex={-1} ref={main}>
        <Body state={state} dispatch={dispatch} on={on} />
      </main>
    </div>
  );
}

function Body({ state, dispatch, on }) {
  if (state.view === "loading" || state.view === "signingout") {
    // Nothing to read yet: the status answers in well under 1.5 s.
    return <div className="ldg-onb__loading" aria-busy="true" />;
  }
  if (state.view === "notinstalled") {
    return (
      <>
        <h1 className="ldg-onb__h1">{t("onb.ni.h1")}</h1>
        <p className="ldg-onb__sub">{t("onb.ni.sub")}</p>
        {/* Until the store update is live there is nothing to install. */}
        {EXTENSION_LIVE && <a className="ldg-btn ldg-btn--primary" href={STORE_URL} target="_blank" rel="noreferrer">{t("site.cta")}</a>}
        <p className="ldg-onb__fine">{t("onb.ni.fine")}</p>
      </>
    );
  }
  const head = (
    <>
      <h1 className="ldg-onb__h1">{CHECK}{t("onb.h1")}</h1>
      <p className="ldg-onb__sub">{t("onb.sub")}</p>
    </>
  );
  if (state.view === "signedout" && state.step === 2) {
    return (
      <>
        {head}
        <p className="ldg-onb__notice" role="status">{t("onb.signedout")}</p>
        <SignInStep state={state} dispatch={dispatch} on={on} counter={false} />
      </>
    );
  }
  if (state.step === 1) {
    return (
      <>
        {head}
        <OnboardingStep n={1} total={2} title={t("onb.s1.title")} done={state.pinned} labels={LABELS}>
          {state.pinned ? (
            <OnboardingStatus>{t("onb.s1.done.before")} <ExtensionIcon size={16} /> {t("onb.s1.done.after")}</OnboardingStatus>
          ) : (
            <>
              <p>{t("onb.s1.body")}</p>
              <PinAnimation captions={PIN_CAPTIONS} />
              <p className="ldg-onb-wait">{t("onb.s1.wait")} <button type="button" className="ldg-onb-skip" onClick={() => dispatch({ type: "skip" })}>{t("onb.s1.skip")}</button></p>
            </>
          )}
        </OnboardingStep>
      </>
    );
  }
  if (state.step === 2) return <>{head}<SignInStep state={state} dispatch={dispatch} on={on} counter /></>;
  return <>{head}<Done state={state} /></>;
}

function SignedInLines({ state }) {
  const name = state.user?.name;
  return (
    <>
      {state.extension === "ok" && <OnboardingStatus>{t("onb.s2.signedin", { name })}</OnboardingStatus>}
      {state.extension === "failed" && <p className="ldg-onb__error" role="alert">{t("onb.s2.extfail", { name })}</p>}
      {state.newsletter === "ok" && <OnboardingStatus>{t("onb.s2.subscribed")}</OnboardingStatus>}
      {state.newsletter === "failed" && (
        <p className="ldg-onb__error" role="alert">
          {PROMPT_COPY.failed}{" "}
          <button type="button" className="ldg-onb-skip" onClick={on.retrySubscribe}>{PROMPT_COPY.subscribe}</button>
        </p>
      )}
    </>
  );
}

function SignInStep({ state, dispatch, on, counter }) {
  const done = state.extension === "ok";
  const signedInHere = state.user && (state.extension !== null || state.pressed);
  // Signed in on the site but not yet in the extension, from the popup's Sign in.
  const offerContinue = state.user && !signedInHere && state.start === 2 && state.view === "steps";
  return (
    <OnboardingStep n={2} total={counter ? 2 : undefined} optional title={t("onb.s2.title")} done={done} labels={LABELS}>
      {!signedInHere && (
        <>
          <p>{t("onb.s2.body1")}</p>
          <p>{t("onb.s2.body2")}</p>
        </>
      )}
      {signedInHere ? (
        <SignedInLines state={state} />
      ) : offerContinue ? (
        <div className="ldg-onb-signin">
          <div className="ldg-onb-signin__row">
            <Button size="lg" onClick={on.continueAs}>{t("onb.s2.continue", { name: state.user.name })}</Button>
            <Button variant="secondary" size="lg" onClick={on.switchAccount}>{t("onb.s2.switch")}</Button>
          </div>
          <button type="button" className="ldg-onb-skip" onClick={() => dispatch({ type: "skip" })}>{t("onb.s2.skip")}</button>
        </div>
      ) : (
        <div className="ldg-onb-signin">
          <Button variant="google" size="lg" onClick={on.signIn} disabled={state.pressed}>{t("onb.google")}</Button>
          <label className="ldg-onb-check">
            <input type="checkbox" checked={state.box} disabled={state.pressed} onChange={() => dispatch({ type: "box" })} /> {t("onb.subscribe")}
          </label>
          <button type="button" className="ldg-onb-skip" onClick={() => dispatch({ type: "skip" })}>{t("onb.s2.skip")}</button>
        </div>
      )}
    </OnboardingStep>
  );
}

function Done({ state }) {
  const synced = state.extension === "ok";
  return (
    <>
      <OnboardingStep n={1} done title={t("onb.s1.title")} labels={LABELS}>
        {state.pinned && <OnboardingStatus>{t("onb.s1.done.before")} <ExtensionIcon size={16} /> {t("onb.s1.done.after")}</OnboardingStatus>}
      </OnboardingStep>
      {synced && (
        <OnboardingStep n={2} done optional title={t("onb.s2.title")} labels={LABELS}>
          <SignedInLines state={state} />
        </OnboardingStep>
      )}
      <section className="ldg-onb-step ldg-onb-step--end">
        <h2>{t("onb.done.title")}</h2>
        <p>{t("onb.done.before")} <ExtensionIcon size={16} /> {t("onb.done.after")} {t(synced ? "onb.done.synced" : "onb.done.later")}</p>
        <a className="ldg-btn ldg-btn--secondary" href="/">{t("onb.done.cta")}</a>
      </section>
    </>
  );
}
