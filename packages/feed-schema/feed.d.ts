/**
 * aiBytes published feed - types for consumers.
 *
 * The producer is packages/fetchers in the `aibytes` repo, run on a schedule.
 * The feed is served as static JSON from GitHub Pages:
 *
 *   https://sachinjain024.github.io/aibytes/feed/index.json
 *
 * Consumers import this from the workspace, or fetch it alongside the feed. Keep it in step with feed.schema.json, which is the contract of
 * record.
 *
 * A shipped Chrome extension cannot be hotfixed, so treat every field as
 * append-only: add, never rename or remove.
 */

/** Bumped only for a breaking change. Refuse a version you do not know. */
export type FeedSchemaVersion = 1;

export type Cadence = "daily" | "weekly" | "monthly";

export interface FeedSourceRef {
  /** Stable source id, e.g. "hackernews". */
  name: string;
  /** Path to the payload, relative to index.json. */
  path: string;
  /** Number of items in the payload. */
  count: number;
  /** Key inside the payload holding the item array. */
  itemsKey?: string;
  /** Editorial grouping, e.g. "ai-news". */
  section?: string | null;
  /**
   * Present when this source failed in the producing run. The payload may be
   * stale or missing - render the rest of the feed rather than failing.
   */
  error?: string;
}

export interface FeedIndex {
  schemaVersion: FeedSchemaVersion;
  /** UTC timestamp of the producing run. */
  generatedAt: string;
  /** The as-of date the window was cut from. */
  asOf?: string;
  cadence: Cadence;
  sources: FeedSourceRef[];
}

/**
 * A source payload. The envelope shape is shared with the newsletter snapshots,
 * so `itemsKey` names the array to read: "stories" | "repos" | "articles" |
 * "posts". Item shapes differ per source.
 */
export interface FeedPayload<TItem = unknown> {
  source: string;
  section?: string;
  fetched_at: string;
  window?: Record<string, string>;
  query_params: Record<string, unknown>;
  totalCount: number;
  poolCount?: number;
  [itemsKey: string]: TItem[] | unknown;
}
