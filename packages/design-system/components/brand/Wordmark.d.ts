/** The aiBytes_ wordmark — Bricolage Grotesque 800, trailing underscore in --accent. Typographic; there is no drawn logo asset. */
export interface WordmarkProps {
  /** full = 28px page-level, compact = 20px header, icon = 40px favicon/extension tile */
  variant?: "full" | "compact" | "icon";
  href?: string;
}
export declare function Wordmark(props: WordmarkProps): JSX.Element;
