/* aibytes.io/extension-onboarding (AIB-76n) — loaded as text/babel. The page
   the extension opens on install, built from the Ledger bundle: the site's
   header, then the .ldg-onb column. ?frame=<state>&theme=<light|dark> renders
   one state on its own; without it, the kit shows the controls and a frame at
   1280 or 390. Copy is the agreed copy from docs/ux/prototypes/AIB-76n-extension/copy.js. */
const O = window.LedgerAiBytesDesignSystem_b1be4f || {};
const { AppHeader, Button, ExtensionIcon, OnboardingStep, OnboardingStatus, PinAnimation } = O;
const ONB_USER = { name: "Ada Lovelace", email: "ada@example.com" };
const PIN_CAPTIONS = ["Look at the top right of Chrome", "Select the puzzle icon", "Find aiBytes_ in the list", "Select the pin", "aiBytes_ is in your toolbar"];
const ONB_STATES = {
  step1: "Step 1: pin",
  step2: "Step 2: sign in",
  continue: "Step 2: signed in on the site",
  signedout: "After Sign out in the popup",
  done: "Done",
  notinstalled: "Not installed",
};
const CHECK = <span className="ldg-onb__check" aria-hidden="true"><svg width="18" height="18" viewBox="0 0 10 10"><path d="M2 5.2l2 2L8 3" fill="none" stroke="currentColor" strokeWidth="1.4" strokeLinecap="round" strokeLinejoin="round"/></svg></span>;

function OnboardingPage({ state: state0, theme: theme0 }) {
  const [theme, setTheme] = React.useState(theme0);
  const [state, setState] = React.useState(state0);
  const [siteUser, setSiteUser] = React.useState(state0 === "continue" ? ONB_USER : null);
  const [box, setBox] = React.useState(true);
  const [subscribed, setSubscribed] = React.useState(false);
  React.useEffect(() => { document.documentElement.dataset.theme = theme; }, [theme]);
  const signIn = () => { setSiteUser(ONB_USER); if (box) setSubscribed(true); setState("done"); };

  const signinStep = ({ counter }) => (
    <OnboardingStep n={2} total={counter ? 2 : undefined} optional title="Sign in to save & bookmark items">
      <p>Items you bookmark will be stored in your account and accessible across devices.</p>
      <p>Without signing in, any saved items are only stored in the browser's local storage.</p>
      {state === "continue" && siteUser ? (
        <div className="ldg-onb-signin">
          <div className="ldg-onb-signin__row">
            <Button size="lg" onClick={signIn}>Continue as {siteUser.name}</Button>
            <Button variant="secondary" size="lg" onClick={() => { setSiteUser(null); setState("step2"); }}>Use a different account</Button>
          </div>
          <button type="button" className="ldg-onb-skip" onClick={() => setState("done")}>Skip for now</button>
        </div>
      ) : (
        <div className="ldg-onb-signin">
          <Button variant="google" size="lg" onClick={signIn}>Sign in with Google</Button>
          <label className="ldg-onb-check"><input type="checkbox" checked={box} onChange={e => setBox(e.target.checked)} /> Also subscribe me to the weekly newsletter</label>
          <button type="button" className="ldg-onb-skip" onClick={() => setState("done")}>Skip for now</button>
        </div>
      )}
    </OnboardingStep>
  );

  let body;
  if (state === "notinstalled") {
    body = (
      <>
        <h1 className="ldg-onb__h1">aiBytes_ for Chrome</h1>
        <p className="ldg-onb__sub">Today's edition, ranked, one click from your toolbar. Star items to read later on aibytes.io.</p>
        <Button>Add to Chrome</Button>
        <p className="ldg-onb__fine">Free. Reads only aibytes.io.</p>
      </>
    );
  } else {
    const head = (
      <>
        <h1 className="ldg-onb__h1">{CHECK}aiBytes_ extension is successfully installed.</h1>
        <p className="ldg-onb__sub">A couple of quick steps to help you get the most out of it.</p>
      </>
    );
    if (state === "step1") body = (
      <>{head}
        <OnboardingStep n={1} total={2} title="Pin aiBytes_ to your toolbar">
          <p>Chrome puts new extensions behind the puzzle icon. Pin aiBytes_ so today's edition is one click away.</p>
          <PinAnimation captions={PIN_CAPTIONS} />
          <p className="ldg-onb-wait">This step ticks itself when you pin. <button type="button" className="ldg-onb-skip" onClick={() => setState("step2")}>Skip</button></p>
        </OnboardingStep>
      </>);
    else if (state === "step2" || state === "continue") body = <>{head}{signinStep({ counter: true })}</>;
    else if (state === "signedout") body = (
      <>{head}
        <p className="ldg-onb__notice">You're signed out of aibytes.io and the extension.</p>
        {signinStep({ counter: false })}
      </>);
    else body = (
      <>{head}
        <OnboardingStep n={1} done title="Pin aiBytes_ to your toolbar">
          <OnboardingStatus>Pinned. Select <ExtensionIcon size={16} /> in the toolbar any time.</OnboardingStatus>
        </OnboardingStep>
        {siteUser && (
          <OnboardingStep n={2} done optional title="Sign in to save & bookmark items">
            <OnboardingStatus>Signed in as {siteUser.name}. The extension is signed in too.</OnboardingStatus>
            {subscribed && <OnboardingStatus>Subscribed to aiBytes_ weekly.</OnboardingStatus>}
          </OnboardingStep>
        )}
        <section className="ldg-onb-step ldg-onb-step--end">
          <h2>You're set.</h2>
          <p>Select <ExtensionIcon size={16} /> in the toolbar to open today's edition. {siteUser ? "Your stars sync to your account." : "You can sign in later from the popup."}</p>
          <a className="ldg-btn ldg-btn--secondary" href="#">Read today's edition on aibytes.io</a>
        </section>
      </>);
  }

  return (
    <div className="app-shell redesign" data-theme={theme}>
      <AppHeader theme={theme} onToggleTheme={() => setTheme(t => t === "light" ? "dark" : "light")} githubUrl="#"
        onSignIn={() => setSiteUser(ONB_USER)} user={siteUser || undefined} onSignOut={() => setSiteUser(null)} />
      <main className="ldg-onb">{body}</main>
    </div>
  );
}

function AiBytesOnboarding() {
  const q = new URLSearchParams(location.search);
  if (q.get("frame") && ONB_STATES[q.get("frame")]) return <OnboardingPage state={q.get("frame")} theme={q.get("theme") || "light"} />;
  const [state, setState] = React.useState(q.get("state") || "step1");
  const [width, setWidth] = React.useState(Number(q.get("width")) || 1280);
  const [theme, setTheme] = React.useState(q.get("theme") || "light");
  const seg = (value, set, options) => (
    <span className="ldg-seg kit-onb-seg">{options.map(([v, label]) => (
      <button key={v} type="button" className="ldg-seg__btn" aria-pressed={value === v} onClick={() => set(v)}>{label}</button>
    ))}</span>
  );
  return (
    <div className="kit-onb">
      <div className="kit-onb__controls">
        {seg(state, setState, Object.entries(ONB_STATES))}
        {seg(width, setWidth, [[1280, "1280"], [390, "390"]])}
        {seg(theme, setTheme, [["light", "Light"], ["dark", "Dark"]])}
      </div>
      <iframe key={state + theme} title={ONB_STATES[state]} src={`?frame=${state}&theme=${theme}`} width={width} height="900" />
    </div>
  );
}
window.AiBytesOnboarding = AiBytesOnboarding;
