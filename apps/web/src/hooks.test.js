import assert from "node:assert/strict";
import { test } from "node:test";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { useSaves } from "./hooks.js";
import { localSaves, SAVES_KEY } from "./saves.js";

const memory = (entries = {}) => ({
  getItem: (key) => (key in entries ? entries[key] : null),
  setItem: (key, value) => { entries[key] = value; },
});

test("useSaves renders from the store: what is saved, and toggle passes through", () => {
  const storage = memory({ [SAVES_KEY]: JSON.stringify([{ item_id: "a-2026-11-06", edition_date: "2026-11-06", created_at: "2026-11-07T09:30:00.000Z" }]) });
  const store = localSaves(storage, new EventTarget());
  let seen;
  function Probe() {
    seen = useSaves(store);
    return React.createElement("p", null, ["a-2026-11-06", "b-issue-9"].map((id) => `${id}:${seen.has(id)}`).join(" "));
  }
  assert.equal(renderToStaticMarkup(React.createElement(Probe)), "<p>a-2026-11-06:true b-issue-9:false</p>");
  assert.equal(seen.saves, store.list());
  assert.equal(seen.toggle, store.toggle);

  store.toggle({ id: "b-issue-9" }, { issue_slug: "issue-9" });
  assert.equal(renderToStaticMarkup(React.createElement(Probe)), "<p>a-2026-11-06:true b-issue-9:true</p>");
});
