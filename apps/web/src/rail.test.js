import assert from "node:assert/strict";
import { test } from "node:test";
import { daysBetween, localDate, railDate } from "./rail.js";

// Newest first, as index.json lists them. 10-08 is missing: a missed day.
const EDITIONS = [
  { date: "2026-10-09", total: 28 },
  { date: "2026-10-07", total: 31 },
  { date: "2026-10-06", total: 25 },
];
const at = (date) => EDITIONS.find((ref) => ref.date === date);

test("latest, dated today, older edition yesterday", () => {
  const editions = [{ date: "2026-10-09" }, { date: "2026-10-08" }];
  assert.deepEqual(railDate(editions[0], editions, "2026-10-09"), {
    dateMain: "Today",
    dateNote: "(Fri, Oct 9)",
    dateSub: undefined,
    prevLabel: "Yesterday",
    nextLabel: undefined,
  });
});

test("latest, dated today, older edition two days back uses its short date", () => {
  const rail = railDate(at("2026-10-09"), EDITIONS, "2026-10-09");
  assert.equal(rail.dateMain, "Today");
  assert.equal(rail.prevLabel, "Oct 7");
  assert.equal(rail.nextLabel, undefined);
});

test("latest, not dated today (before the day's run)", () => {
  assert.deepEqual(railDate(at("2026-10-09"), EDITIONS, "2026-10-10"), {
    dateMain: "Oct 9",
    dateNote: undefined,
    dateSub: "Fri, Oct 9 · 1 day ago",
    prevLabel: "Oct 7",
    nextLabel: undefined,
  });
});

test("Yesterday is relative to the reader's today, not the edition viewed", () => {
  // Latest is two days old; the older one is three days old - neither is yesterday.
  assert.equal(railDate(at("2026-10-09"), EDITIONS, "2026-10-11").prevLabel, "Oct 7");
  // A reader whose today is 10-08 (10-09 already out where it was curated):
  // 10-07 is that reader's yesterday, though it is two days before 10-09.
  assert.equal(railDate(at("2026-10-09"), EDITIONS, "2026-10-08").prevLabel, "Yesterday");
});

test("an older edition links to Latest, with a back link", () => {
  assert.deepEqual(railDate(at("2026-10-07"), EDITIONS, "2026-10-09"), {
    dateMain: "Oct 7",
    dateNote: undefined,
    dateSub: "Wed, Oct 7 · 2 days ago",
    prevLabel: "Oct 6",
    nextLabel: "Latest",
  });
  // The back link reads Yesterday only when that edition is the reader's yesterday.
  assert.equal(railDate(at("2026-10-07"), EDITIONS, "2026-10-07").prevLabel, "Yesterday");
});

test("the oldest edition has no back link", () => {
  const rail = railDate(at("2026-10-06"), EDITIONS, "2026-10-09");
  assert.equal(rail.prevLabel, undefined);
  assert.equal(rail.nextLabel, "Latest");
  assert.equal(rail.dateSub, "Tue, Oct 6 · 3 days ago");
});

test("an edition dated in the reader's future reads as Today", () => {
  const rail = railDate(at("2026-10-09"), EDITIONS, "2026-10-08");
  assert.equal(rail.dateMain, "Today");
  assert.equal(rail.dateNote, "(Fri, Oct 9)");
  assert.equal(rail.dateSub, undefined);
});

test("1 day ago is singular, 2 days ago plural", () => {
  assert.match(railDate(at("2026-10-07"), EDITIONS, "2026-10-08").dateSub, / · 1 day ago$/);
  assert.match(railDate(at("2026-10-07"), EDITIONS, "2026-10-09").dateSub, / · 2 days ago$/);
});

test("days count across month and year boundaries", () => {
  assert.equal(daysBetween("2026-09-30", "2026-10-01"), 1);
  assert.equal(daysBetween("2026-12-31", "2027-01-01"), 1);
  assert.equal(daysBetween("2026-10-09", "2026-10-09"), 0);
  assert.equal(daysBetween("2026-10-09", "2026-10-08"), -1);
  // Across a DST change in most zones; UTC arithmetic keeps it whole.
  assert.equal(daysBetween("2026-10-24", "2026-10-26"), 2);

  const editions = [{ date: "2027-01-01" }, { date: "2026-12-31" }];
  assert.equal(railDate(editions[0], editions, "2027-01-01").prevLabel, "Yesterday");
  assert.equal(railDate(editions[1], editions, "2027-01-01").dateSub, "Thu, Dec 31 · 1 day ago");
});

test("localDate is the reader's calendar day, not UTC's", () => {
  // 23:30 local on Oct 9 is Oct 9 for the reader, whatever UTC says.
  assert.equal(localDate(new Date(2026, 9, 9, 23, 30)), "2026-10-09");
  assert.equal(localDate(new Date(2026, 0, 1, 0, 5)), "2026-01-01");
});
