import assert from "node:assert/strict";
import { test } from "node:test";
import { filesToLoad, leftOutNote, savedGroups } from "./saved.js";

// index.json and weekly/index.json refs, newest first, as the app loads them.
const EDITIONS = [
  { date: "2026-11-06", path: "editions/2026-11-06.json" },
  { date: "2026-11-04", path: "editions/2026-11-04.json" },
  { date: "2026-11-01", path: "editions/2026-11-01.json" },
];
const ISSUES = [
  { slug: "issue-9", number: 9, published_on: "2026-11-02", path: "weekly/issues/issue-9.json" },
  { slug: "issue-8", number: 8, published_on: "2026-10-26", path: "weekly/issues/issue-8.json" },
];
const at = "2026-11-07T09:30:00.000Z";
const ed = (item_id, edition_date) => ({ item_id, edition_date, created_at: at });
const wk = (item_id, issue_slug) => ({ item_id, issue_slug, created_at: at });
const item = (id, rank, extra = {}) => ({ id, rank, source: "github", category: "repos", ...extra });
const ready = (items) => ({ status: "ready", data: { items } });

const FILES = {
  "edition:2026-11-06": ready([item("c-11-06", 3), item("a-11-06", 1), item("h-11-06", 2, { hidden: true }), item("b-11-06", 4)]),
  "edition:2026-11-04": ready([item("x-11-04", 1)]),
  "issue:issue-9": ready([item("w-issue-9", 2), item("v-issue-9", 1)]),
};

test("filesToLoad names each referenced edition and issue once, and only those in the indexes", () => {
  const saves = [ed("a-11-06", "2026-11-06"), ed("c-11-06", "2026-11-06"), wk("w-issue-9", "issue-9"), ed("gone", "2025-01-01"), wk("gone", "issue-99")];
  assert.deepEqual(filesToLoad(saves, EDITIONS, ISSUES), [
    { key: "edition:2026-11-06", kind: "edition", ref: EDITIONS[0] },
    { key: "issue:issue-9", kind: "issue", ref: ISSUES[0] },
  ]);
  assert.deepEqual(filesToLoad([], EDITIONS, ISSUES), []);
});

test("sections are newest first, editions and issues interleaved by date, rank order inside", () => {
  const saves = [
    ed("x-11-04", "2026-11-04"),
    ed("b-11-06", "2026-11-06"),
    wk("w-issue-9", "issue-9"),
    ed("a-11-06", "2026-11-06"),
    ed("c-11-06", "2026-11-06"),
    wk("v-issue-9", "issue-9"),
  ];
  const { groups, leftOut } = savedGroups(saves, { editions: EDITIONS, issues: ISSUES, files: FILES });
  assert.deepEqual(groups.map((g) => [g.key, g.kind, g.label, g.date, g.status]), [
    ["edition:2026-11-06", "edition", "Fri, Nov 6", "2026-11-06", "ready"],
    ["edition:2026-11-04", "edition", "Wed, Nov 4", "2026-11-04", "ready"],
    ["issue:issue-9", "issue", "Issue #9 · Nov 2", "2026-11-02", "ready"],
  ]);
  // Ranked over the whole file, the hidden h (rank 2) included, then filtered.
  assert.deepEqual(groups[0].items.map((i) => i.id), ["a-11-06", "c-11-06", "b-11-06"]);
  assert.deepEqual(groups[2].items.map((i) => i.id), ["v-issue-9", "w-issue-9"]);
  assert.deepEqual(leftOut, { count: 0, kinds: [] });
});

test("an issue published on an edition's date sorts after the edition", () => {
  const issues = [{ ...ISSUES[0], published_on: "2026-11-04" }];
  const { groups } = savedGroups([wk("w-issue-9", "issue-9"), ed("x-11-04", "2026-11-04")], { editions: EDITIONS, issues, files: FILES });
  assert.deepEqual(groups.map((g) => g.key), ["edition:2026-11-04", "issue:issue-9"]);
});

test("hidden items, items gone from their file and files gone from their index are left out and counted", () => {
  const saves = [
    ed("h-11-06", "2026-11-06"),        // hidden
    ed("a-11-06", "2026-11-06"),
    ed("missing-11-06", "2026-11-06"),  // not in the file any more
    ed("gone", "2025-01-01"),           // edition not in index.json
    wk("gone", "issue-99"),             // issue not in weekly/index.json
  ];
  const { groups, leftOut } = savedGroups(saves, { editions: EDITIONS, issues: ISSUES, files: FILES });
  assert.deepEqual(groups.map((g) => g.key), ["edition:2026-11-06"]);
  assert.deepEqual(groups[0].items.map((i) => i.id), ["a-11-06"]);
  assert.deepEqual(leftOut, { count: 4, kinds: ["edition", "issue"] });
});

test("a section whose saves are all left out is not shown", () => {
  const { groups, leftOut } = savedGroups([ed("h-11-06", "2026-11-06")], { editions: EDITIONS, issues: ISSUES, files: FILES });
  assert.deepEqual(groups, []);
  assert.deepEqual(leftOut, { count: 1, kinds: ["edition"] });
});

test("a file still loading or failed is a section in that state, and the others still render", () => {
  const files = { "edition:2026-11-04": { status: "error", error: new Error("HTTP 500") }, "issue:issue-9": FILES["issue:issue-9"] };
  const saves = [ed("a-11-06", "2026-11-06"), ed("x-11-04", "2026-11-04"), wk("v-issue-9", "issue-9")];
  const { groups, leftOut } = savedGroups(saves, { editions: EDITIONS, issues: ISSUES, files });
  assert.deepEqual(groups.map((g) => [g.key, g.status, g.items.length]), [
    ["edition:2026-11-06", "loading", 0],
    ["edition:2026-11-04", "error", 0],
    ["issue:issue-9", "ready", 1],
  ]);
  assert.equal(groups[0].label, "Fri, Nov 6");
  assert.deepEqual(leftOut, { count: 0, kinds: [] });
});

test("no saves, no sections and no note", () => {
  const { groups, leftOut } = savedGroups([], { editions: EDITIONS, issues: ISSUES, files: {} });
  assert.deepEqual(groups, []);
  assert.equal(leftOutNote(leftOut), null);
});

test("the note says how many were left out, and from what", () => {
  assert.equal(leftOutNote({ count: 1, kinds: ["edition"] }), "1 saved item was removed from its edition and is not shown.");
  assert.equal(leftOutNote({ count: 3, kinds: ["edition"] }), "3 saved items were removed from their editions and are not shown.");
  assert.equal(leftOutNote({ count: 1, kinds: ["issue"] }), "1 saved item was removed from its issue and is not shown.");
  assert.equal(leftOutNote({ count: 2, kinds: ["issue"] }), "2 saved items were removed from their issues and are not shown.");
  assert.equal(leftOutNote({ count: 2, kinds: ["edition", "issue"] }), "2 saved items were removed from their editions or issues and are not shown.");
  assert.equal(leftOutNote({ count: 0, kinds: [] }), null);
});
