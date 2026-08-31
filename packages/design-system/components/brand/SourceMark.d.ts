/** Per-source mark filling the 40px image slot when no image exists. Theme-aware (HN tile uses --hot, Octocat uses --text). Standalone SVG twins live in assets/marks/. */
export interface SourceMarkProps {
  source: "producthunt" | "hackernews" | "github" | "techcrunch";
  /** 40 in grid cards, 24 in list rows */
  size?: number;
  className?: string;
}
export declare function SourceMark(props: SourceMarkProps): JSX.Element;
