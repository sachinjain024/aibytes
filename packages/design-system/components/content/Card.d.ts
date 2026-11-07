/** One edition item, matching the edition JSON schema (spec §5). */
export interface EditionItem {
  id: string;
  title: string;
  summary: string;
  url: string;
  source: "producthunt" | "hackernews" | "github" | "techcrunch";
  source_url: string;
  category: "launches" | "repos" | "news" | "hn";
  tags?: string[];
  image?: { type: "logo" | "avatar" | "thumbnail" | "none"; url?: string };
  signals?: { upvotes?: number; points?: number; stars_gained?: number; comments?: number };
  meta?: { language?: string | null; author?: string };
}
/** Grid-view feed card: 28px image slot (SourceMark fallback), source link, title link (new tab), 2-line summary, mono tags left / signals right, save star. States: default, hover (accent border + lift), saved, top-today (--hot edge + TOP label), no-image, no-signals, long-title (2-line clamp).
 * @startingPoint section="Components" subtitle="Feed card, grid view" viewport="400x190"
 */
export interface CardProps {
  item: EditionItem;
  /** "top today" variant: 2px --hot left edge + mono TOP label */
  topToday?: boolean;
  saved?: boolean;
  /** the save star renders only when this is passed */
  onToggleSave?: (id: string) => void;
  /** Where upvotes sit: "source" = after the source name, in the row pinned to the card's bottom edge (default, as the app shows it); "logo" = stacked under the source logo; "bottom" = under the logo but bottom-aligned to the tags row; "row" = own row between summary and tags. The bottom row itself is always tags-only. */
  signalsPos?: "logo" | "bottom" | "source" | "row";
  /** Tag treatment: "dots" = mono ·-separated (default); "pills" = small bordered chips; "hash" = accent #tags. */
  tagStyle?: "dots" | "pills" | "hash";
  /** Max tags shown (default 0: the app's cards carry no tags). 0 drops the whole tags row, language dot included. */
  maxTags?: number;
  /** Where the save star sits: "actions" = after the ⋮ menu (default); "visual" = under the source image, in its column. Either way it renders only with `onToggleSave`. */
  starPos?: "actions" | "visual";
}
export declare function Card(props: CardProps): JSX.Element;
