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
/** Grid-view feed card: 40px image slot (SourceMark fallback), source link, title link (new tab), 2-line summary, mono tags left / signals right, save star. States: default, hover (accent border + lift), saved, top-today (--hot edge + TOP label), no-image, no-signals, long-title (2-line clamp).
 * @startingPoint section="Components" subtitle="Feed card, grid view" viewport="400x190"
 */
export interface CardProps {
  item: EditionItem;
  /** "top today" variant: 2px --hot left edge + mono TOP label */
  topToday?: boolean;
  saved?: boolean;
  onToggleSave?: (id: string) => void;
  /** Where upvotes sit (comments are never shown on cards): "logo" = stacked under the source logo (default); "source" = inline after the source name; "bottom" = under the logo but bottom-aligned to the tags row; "row" = own row between summary and tags. The bottom row itself is always tags-only. */
  signalsPos?: "logo" | "bottom" | "source" | "row";
  /** Tag treatment: "dots" = mono ·-separated (default); "pills" = small bordered chips; "hash" = accent #tags. */
  tagStyle?: "dots" | "pills" | "hash";
  /** Max tags shown (default 3). */
  maxTags?: number;
}
export declare function Card(props: CardProps): JSX.Element;
