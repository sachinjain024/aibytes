import React from "react";

// Small shared marks for the gist components. Lowercase file name: the
// Artifact build bundles only files that start with a capital, and this is not
// a component with a card of its own.

/** The arrow in the top right corner that marks a link to another site. */
export const Out = () => (
  <svg className="gist-out" width="10" height="10" viewBox="0 0 12 12" aria-hidden="true" focusable="false">
    <path d="M3.5 2.5h6v6M9.5 2.5l-7 7" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/>
  </svg>);
