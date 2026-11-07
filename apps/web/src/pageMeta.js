// A built page's <head>: its own title, description, canonical URL and Open
// Graph tags, so a weekly issue is indexable and shares with a real preview
// before any script runs. Pure string work, so `node --test` can check it;
// vite.config.js applies it when it writes each page.
import { savedPath, SITE_ORIGIN, weeklyUrl } from "./route.js";

const escape = (text) => String(text)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** `html` with its <title> and description replaced and canonical + OG tags added, and a robots tag if given. */
export function withHead(html, { title, description, url, robots }) {
  const tags = [
    ...(robots ? [`<meta name="robots" content="${escape(robots)}" />`] : []),
    `<link rel="canonical" href="${escape(url)}" />`,
    `<meta property="og:type" content="article" />`,
    `<meta property="og:site_name" content="aiBytes_" />`,
    `<meta property="og:title" content="${escape(title)}" />`,
    `<meta property="og:description" content="${escape(description)}" />`,
    `<meta property="og:url" content="${escape(url)}" />`,
    `<meta name="twitter:card" content="summary" />`,
  ].join("\n    ");
  return html
    .replace(/<title>[\s\S]*?<\/title>/, () => `<title>${escape(title)}</title>`)
    .replace(/<meta name="description" content="[^"]*" \/>/, () => `<meta name="description" content="${escape(description)}" />`)
    .replace("</head>", () => `  ${tags}\n  </head>`);
}

/** The head for /weekly/issue-N, from its weekly/index.json entry. */
export function weeklyIssueHead(entry) {
  return {
    title: `aiBytes_ #${entry.number}: ${entry.title}`,
    description: entry.description || `Issue #${entry.number} of aiBytes_, the week in AI for developers.`,
    url: weeklyUrl(entry.slug),
  };
}

/** The head for the /weekly archive. */
export const WEEKLY_ARCHIVE_HEAD = {
  title: "aiBytes_ · Weekly archive",
  description: "Every aiBytes_ weekly issue: the week's AI news, launches, repos and Hacker News threads for developers.",
  url: weeklyUrl(),
};

/** The head for /saved: personal, so nothing for a search engine to index. */
export const SAVED_HEAD = {
  title: "aiBytes_ · Saved",
  description: "Your saved aiBytes_ items, from every edition and weekly issue.",
  url: SITE_ORIGIN + savedPath(),
  robots: "noindex",
};
