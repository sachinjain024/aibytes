/** The shape of one gist file, `content/gists/<slug>.json`. A restatement of `Gist` in packages/feed-schema/feed.d.ts, which is the contract of record. */
export interface Gist {
  slug: string;
  kind: "news" | "hn" | "repo" | "launch" | "x_post";
  /** absent on an x_post */
  source?: "producthunt" | "hackernews" | "github" | "techcrunch";
  title: string;
  image: { type: "logo" | "avatar" | "thumbnail" | "none"; url?: string };
  depth: "full" | "brief" | "preview";
  lede?: string;
  sections: Array<
    | { key: "key_points"; points: string[] }
    | { key: "why_it_matters" | "who_its_for" | "pricing"; text: string }
    | { key: "try_it"; command: string }
    | { key: "discussion"; points: Array<{ stance: "agreed" | "disputed" | "counterpoint" | "theme"; text: string; url: string }> }
    | { key: "whats_open"; points: Array<{ text: string; url?: string }> }
  >;
  stats?: Record<string, number | string | { tag: string; published_on: string }>;
  /** UTC ISO 8601: when `stats` was read */
  stats_as_of?: string;
  front_page?: true;
  preview?: { author_name: string; author_handle: string; posted_on: string; text: string };
  links: Array<{ role: "destination" | "discussion" | "source"; title: string; url: string }>;
  appearances: Array<{ item_id: string; edition_date?: string; issue_slug?: string }>;
}
/** The one view the gist panel and the gist page both render: source and first-covered kicker, the item's image (or the source mark) before the title, a small Source button, the lede, a stats grid headed "STATS (As of 6 Nov 2026)", the sections for its kind, closing Source and discussion buttons, "Appeared in", then an actions slot. It takes the gist file and nothing else, and renders on a server with no window.
 * @startingPoint section="Components" subtitle="Gist view" viewport="520x760"
 */
export interface GistViewProps {
  gist: Gist;
  /** "panel" draws the title as an h2; "page" draws it as the page's one h1, in larger type */
  as?: "panel" | "page";
  /** where an "Appeared in" link goes; the default is /<date> for an edition and /weekly/<issue> for an issue */
  appearanceHref?: (appearance: { item_id: string; edition_date?: string; issue_slug?: string }) => string;
  /** rendered last: the save control and reactions (the app owns what they do) */
  actions?: React.ReactNode;
}
export declare function GistView(props: GistViewProps): JSX.Element;
