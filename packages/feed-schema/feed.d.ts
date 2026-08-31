/**
 * The aiBytes_ content contract - types for consumers.
 *
 * The producer is the curate step in this repo, run daily on the iMac. The
 * output is committed and served as static JSON from GitHub Pages:
 *
 *   https://sachinjain024.github.io/aibytes/content/index.json
 *   https://sachinjain024.github.io/aibytes/content/editions/2026-08-27.json
 *   https://sachinjain024.github.io/aibytes/content/tags.json
 *
 * Consumers are the web app, the Chrome extension, and the weekly newsletter
 * skill. They import this from the workspace. Keep it in step with the
 * `*.schema.json` files next to it, which are the contract of record.
 *
 * A shipped Chrome extension cannot be hotfixed, so treat every field as
 * append-only: add, never rename or remove. Anything breaking bumps
 * `schema_version`, and a consumer that does not know a version must refuse it
 * rather than guess.
 */

/** Bumped only for a breaking change. Refuse a version you do not know. */
export type SchemaVersion = 1;

/** Exactly one per item: the primary filter chip and the section heading. */
export type Category = "launches" | "repos" | "news" | "hn";

/** The fetcher that produced the item; matches a source module's NAME. */
export type Source = "producthunt" | "hackernews" | "techcrunch" | "github";

/**
 * How the 40px card image is treated. `none` means the source mark fills the
 * slot instead, which is the Hacker News case.
 */
export type ImageType = "logo" | "avatar" | "thumbnail" | "none";

/** No image; the source mark fills the slot. */
export interface NoImage {
  type: "none";
  url?: never;
}

/** A real image: rounded for a logo, a circle for an avatar, cropped square for a thumbnail. */
export interface SourceImage {
  type: Exclude<ImageType, "none">;
  url: string;
}

export type ItemImage = NoImage | SourceImage;

/**
 * Present only when the source reports something, and rendered in this order:
 * upvotes or points, stars gained, comments.
 */
export interface Signals {
  /** Product Hunt votes. */
  upvotes?: number;
  /** Hacker News points. */
  points?: number;
  /** Comments on the source page. */
  comments?: number;
  /** GitHub total stars. */
  stars?: number;
  /** GitHub stars gained over the window. */
  stars_gained?: number;
  /** GitHub forks. */
  forks?: number;
}

/** Small per-source extras for the card's meta row. */
export interface ItemMeta {
  /** GitHub repo language; shown as a dot plus name. */
  language?: string | null;
  /** HN submitter or article byline. */
  author?: string | null;
  /** TechCrunch reading time, as the source phrases it. */
  reading_time?: string | null;
}

export interface EditionItem {
  /**
   * `<source-prefix>-<slug>-<edition date>`, e.g. "ph-chatcut-2026-08-27".
   * Unique within the edition and globally, which is what makes a save
   * (item_id + edition_date) resolvable.
   */
  id: string;
  /** Links to `url`. */
  title: string;
  /** One line, at most 200 chars. */
  summary: string;
  /** Where the title links: the product site, the article, the repo. */
  url: string;
  source: Source;
  /**
   * The source page the source name links to: the PH page, the HN thread, the
   * GitHub repo. Equal to `url` where the source is the destination.
   */
  source_url: string;
  category: Category;
  /** Zero to four display names, drawn only from `tags.json`. */
  tags: string[];
  image: ItemImage;
  signals?: Signals;
  meta?: ItemMeta;
  /** Absent for GitHub trending, which has no publish date. */
  published_at?: string;
  /** Hidden items are skipped by the site and the newsletter, and excluded from `counts`. */
  hidden: boolean;
}

/**
 * Visible items per category - hidden items are not counted. All four keys are
 * always present, even at zero.
 */
export type EditionCounts = Record<Category, number>;

/** One day: `content/editions/YYYY-MM-DD.json`. */
export interface Edition {
  schema_version: SchemaVersion;
  /** The edition date, and the file's name. */
  date: string;
  /** UTC timestamp of the curate run. */
  generated_at: string;
  counts: EditionCounts;
  /**
   * Written in category order then by rank within the category. Re-sort for
   * your own views rather than relying on it.
   */
  items: EditionItem[];
}

export interface EditionRef {
  date: string;
  /** Relative to `index.json`; resolve it against the index URL. */
  path: string;
  /** Visible items - the sum of the edition's counts. */
  total: number;
  /** The edition's own `generated_at`, copied here for "updated 4h ago". */
  generated_at: string;
}

/** `content/index.json` - what drives the edition bar and the calendar popover. */
export interface EditionIndex {
  schema_version: SchemaVersion;
  generated_at: string;
  /** Newest first, strictly descending. `editions[0]` is what `/` resolves to. */
  editions: EditionRef[];
}

export interface Tag {
  /** The display name, and the exact string an item carries in `tags`. */
  name: string;
  /** The URL form, as in `?t=agents,open-source`. */
  slug: string;
}

export interface TagGroup {
  /** Group heading in the filter dropdown. */
  name: string;
  tags: Tag[];
}

/** `content/tags.json` - the fixed vocabulary, hand-maintained. */
export interface TagList {
  schema_version: SchemaVersion;
  /** In the order the dropdown shows them. */
  groups: TagGroup[];
}

export interface HiddenEntry {
  id: string;
  /** Matches the id's date suffix. */
  edition_date: string;
  hidden_at: string;
  reason?: string;
}

/** `content/hidden.json` - the admin hide log, newest first. */
export interface HiddenLog {
  schema_version: SchemaVersion;
  hidden: HiddenEntry[];
}
