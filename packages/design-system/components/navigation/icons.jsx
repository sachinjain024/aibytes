import React from "react";

// One stroke path per icon. Search and sun add a circle on top of theirs.
const ICON_PATHS = {
  menu: "M4 6h16M4 12h16M4 18h16",
  search: "m16 16 4 4",
  grid: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h7v7h-7z",
  list: "M8 6h13M8 12h13M8 18h13M3 6h1M3 12h1M3 18h1",
  filters: "M4 7h16M4 17h16",
  x: "M4 3h4l12 18h-4L4 3ZM20 3 4 21",
  link: "m10 13 4-4M8 16l-1 1a4 4 0 0 1-6-6l4-4a4 4 0 0 1 6 0m2 1 1-1a4 4 0 0 1 6 6l-4 4a4 4 0 0 1-6 0",
  advertise: "m3 10 15-6v16L3 14v-4ZM7 16l1 5h4l-2-4M21 9v6",
  arrow: "M7 17 17 7M7 7h10v10",
  sun: "M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M19 5l-2 2M7 17l-2 2",
  moon: "M20 15A9 9 0 0 1 9 4a9 9 0 1 0 11 11",
  // SaveStar's outline; pass fill="currentColor" for the filled star.
  star: "M12 3l2.9 6 6.6.8-4.9 4.5 1.3 6.5L12 17.6 6.1 20.8l1.3-6.5L2.5 9.8 9.1 9z",
};

// The app shell's line icons. An unknown name falls back to the arrow rather
// than rendering nothing.
export function Icon({ name, ...props }) {
  return (
    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.7" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true" {...props}>
      {name === "search" && <circle cx="10.5" cy="10.5" r="6.5" />}
      {name === "sun" && <circle cx="12" cy="12" r="4" />}
      <path d={ICON_PATHS[name] || ICON_PATHS.arrow} />
    </svg>
  );
}
