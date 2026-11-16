/** Per-source mark filling the 40px image slot when no image exists. Theme-aware (HN tile uses --hot, Octocat and the X logo use --text). Standalone SVG twins live in assets/marks/. */
export interface SourceMarkProps {
  /** "x": a weekly Viral on X / Official Announcements item. Never a feed card, so it shows on /saved only. */
  source: "producthunt" | "hackernews" | "github" | "techcrunch" | "x";
  /** 40 in grid cards, 24 in list rows */
  size?: number;
  className?: string;
}
export declare function SourceMark(props: SourceMarkProps): JSX.Element;
