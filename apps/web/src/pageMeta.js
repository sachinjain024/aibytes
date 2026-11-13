// A built page's <head>: its own title, description, canonical URL and Open
// Graph tags, so a weekly issue is indexable and shares with a real preview
// before any script runs. Pure string work, so `node --test` can check it;
// vite.config.js applies it when it writes each page.
import { gistUrl, privacyPath, savedPath, SITE_ORIGIN, weeklyUrl } from "./route.js";

const escape = (text) => String(text)
  .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

// JSON for a <script type="application/ld+json"> block: every "<" is written as
// \u003c, so neither "</script" nor "<!--" can appear inside it.
const jsonForScript = (value) => JSON.stringify(value).replace(/</g, "\\u003c");

/**
 * `html` with its <title> and description replaced and canonical + OG tags added,
 * and a robots tag, an og:image and a JSON-LD block if given.
 */
export function withHead(html, { title, description, url, robots, image, jsonLd }) {
  const tags = [
    ...(robots ? [`<meta name="robots" content="${escape(robots)}" />`] : []),
    `<link rel="canonical" href="${escape(url)}" />`,
    `<meta property="og:type" content="article" />`,
    `<meta property="og:site_name" content="aiBytes_" />`,
    `<meta property="og:title" content="${escape(title)}" />`,
    `<meta property="og:description" content="${escape(description)}" />`,
    `<meta property="og:url" content="${escape(url)}" />`,
    ...(image ? [`<meta property="og:image" content="${escape(image)}" />`] : []),
    `<meta name="twitter:card" content="summary" />`,
    ...(jsonLd ? [`<script type="application/ld+json">${jsonForScript(jsonLd)}</script>`] : []),
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

/** The head for /privacy: public, and the URL Google's sign-in consent screen links to. */
export const PRIVACY_HEAD = {
  title: "aiBytes_ · Privacy",
  description: "What aiBytes_ keeps when you save items or sign in with Google, where it is kept, and how to delete it.",
  url: SITE_ORIGIN + privacyPath(),
};

const DESCRIPTION_MAX = 155;

/** Text cut at a word boundary to at most DESCRIPTION_MAX characters, with an ellipsis when cut. */
function cutAtWord(text) {
  const clean = String(text).replace(/\s+/g, " ").trim();
  if (clean.length <= DESCRIPTION_MAX) return clean;
  const cut = clean.slice(0, DESCRIPTION_MAX);
  return cut.slice(0, cut.lastIndexOf(" ")).replace(/[\s,;:.\-–—]+$/, "") + "…";
}

/**
 * The head for /gists/<slug> (spec AIB-145y-app-gist-pages). Only a `full` gist
 * is indexed and carries structured data; a `brief` or `preview` one is noindex
 * but keeps its canonical address and share tags.
 */
export function gistHead(gist) {
  const url = gistUrl(gist.slug);
  const title = `${gist.title} · aiBytes_`;
  const description = cutAtWord(gist.lede ?? `${gist.preview?.author_name} on X: ${gist.preview?.text}`);
  const head = { title, description, url };
  if (gist.image?.url) head.image = gist.image.url;
  if (gist.depth !== "full") return { ...head, robots: "noindex" };
  return {
    ...head,
    jsonLd: {
      "@context": "https://schema.org",
      "@type": "Article",
      headline: gist.title,
      description,
      datePublished: gist.created_at,
      dateModified: gist.updated_at,
      mainEntityOfPage: url,
      isBasedOn: gist.source_url,
      author: { "@type": "Organization", name: "aiBytes_", url: SITE_ORIGIN },
      publisher: { "@type": "Organization", name: "aiBytes_", url: SITE_ORIGIN },
    },
  };
}
