// Built on its own, in server mode, by vite.config.js, and called once per gist
// to write the markup that goes inside #root. Not part of the browser bundle.
import React from "react";
import { renderToString } from "react-dom/server";
import { GistPage } from "./GistPage.jsx";

export function renderGistPage(props) {
  return renderToString(<GistPage {...props} />);
}
