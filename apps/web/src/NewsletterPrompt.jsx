// The newsletter prompt's content, on Ledger's Dialog (spec AIB-140p). The app
// does not mount this yet. The heart and the YC mark are inline because nothing
// else in Ledger uses them.
import React from "react";
import { Dialog } from "@aibytes/design-system/components/content/Dialog.jsx";
import { Button } from "@aibytes/design-system/components/forms/Button.jsx";
import { PROMPT_COPY } from "./newsletterPrompt.js";

const Tick = ({ large }) => (
  <svg className="prompt-tick" viewBox="0 0 48 48" width={large ? 48 : 22} height={large ? 48 : 22} aria-hidden="true">
    <circle cx="24" cy="24" r="23" />
    <path d="M14.5 24.5 21 31l12.5-13.5" fill="none" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

function Offer({ state, onSubscribe }) {
  const saving = state.status === "saving";
  return (
    <>
      <h2 id="prompt-h" className="ldg-dialog__title prompt-signed">
        <Tick />
        <span>{PROMPT_COPY.heading}</span>
      </h2>
      <p className="prompt-lead">{PROMPT_COPY.lead}</p>
      <ul className="prompt-covers">{PROMPT_COPY.covers.map((item) => <li key={item}>{item}</li>)}</ul>
      {state.status === "failed" && <p role="alert">{PROMPT_COPY.failed}</p>}
      <div className="ldg-dialog__actions ldg-dialog__actions--one">
        <Button variant="primary" data-autofocus disabled={saving} onClick={saving ? undefined : onSubscribe}>
          {saving ? PROMPT_COPY.subscribing : PROMPT_COPY.subscribe}
        </Button>
      </div>
      <p className="prompt-proof">{PROMPT_COPY.proof}</p>
      <p className="prompt-builtby">
        <svg viewBox="0 0 16 16" width="13" height="13" aria-hidden="true"><path d="M8 13.6 2.3 8.1a3.3 3.3 0 0 1 4.6-4.7L8 4.5l1.1-1.1a3.3 3.3 0 0 1 4.6 4.7Z" fill="currentColor" /></svg>
        <span>{PROMPT_COPY.builtBy}</span>
        <svg className="prompt-yc" viewBox="0 0 16 16" width="16" height="16" role="img" aria-label="Y Combinator"><rect width="16" height="16" rx="3" /><path d="M4.6 4 8 9v3.4M11.4 4 8 9" fill="none" strokeWidth="1.5" /></svg>
      </p>
    </>
  );
}

function Thanks({ email, seconds }) {
  return (
    <div className="prompt-thanks">
      <Tick large />
      <h2 id="prompt-h" className="ldg-dialog__title">{PROMPT_COPY.thanks}</h2>
      <p>aiBytes_ arrives every Monday at <b>{email}</b>.</p>
      <p className="prompt-closing">Closing in <b>{seconds}</b></p>
    </div>
  );
}

export function NewsletterPrompt({ state, email, onSubscribe, onClose }) {
  if (!state || state.status === "closed") return null;
  const saving = state.status === "saving";
  return (
    <Dialog labelledBy="prompt-h" onClose={saving ? undefined : onClose} dismissible={!saving}>
      {state.status === "thanks" ? <Thanks email={email} seconds={state.seconds} /> : <Offer state={state} onSubscribe={onSubscribe} />}
    </Dialog>
  );
}
